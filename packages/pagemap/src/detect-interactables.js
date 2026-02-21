/**
 * Static HTML parsing for interactive elements.
 * Ported from Retio-pagemap, with noise filtering for production quality.
 */

import { parse } from "node-html-parser";
import { createInteractable } from "./types.js";

const CTA_RE =
    /add.to.(?:cart|bag|basket)|buy.now|purchase|checkout|order|size.guide|wishlist|sign.up|subscribe|download|get.started|try.free|learn.more|contact/i;

/** Buttons/links with these names are UI chrome, not useful to agents */
const NOISE_NAMES = new Set([
    "toggle navigation",
    "close",
    "dismiss",
    "cancel",
    "resetting focus",
    "dismiss this message",
    "dismiss error",
    "close dialog",
    "manage cookies",
    "cookie settings",
    "do not share my personal information",
    "submit feedback",
    "create saved search",
    "report repository",
    "sign in",
    "sign up",
    "log in",
    "log out",
    "homepage",
]);

/** Noise patterns — if name matches any of these, skip */
const NOISE_PATTERNS = [
    /^menu$/i,
    /^open menu$/i,
    /^close menu$/i,
    /^skip to/i,
    /^accept (?:all )?cookies?/i,
    /^reject (?:all )?cookies?/i,
    /^cookie/i,
    /^privacy/i,
    /^share (?:on|via|to)/i,
    /^print$/i,
    /^back to top$/i,
    /^scroll to top$/i,
    /^loading/i,
    /^show more$/i,
    /^show less$/i,
    /^expand$/i,
    /^collapse$/i,
];

/** Tags whose children should be excluded (UI chrome containers) */
const CHROME_SELECTORS = [
    "nav",
    "header",
    "footer",
    '[role="dialog"]',
    '[role="banner"]',
    '[role="navigation"]',
    '[role="complementary"]',
    '[aria-modal="true"]',
    "dialog",
    ".modal",
    ".cookie-banner",
    ".cookie-consent",
];

/**
 * Extract interactive elements from raw HTML.
 * Focuses on main content area, filters out navigation chrome.
 *
 * @param {string} html
 * @param {Object} [options]
 * @param {boolean} [options.includeChromeElements] - Include nav/header/footer elements (default: false)
 * @returns {import('./types.js').Interactable[]}
 */
export function detectInteractables(html, options = {}) {
    const { includeChromeElements = false } = options;

    const root = parse(html);
    const interactables = [];
    let ref = 1;

    // Find the main content container
    let scope = root;
    if (!includeChromeElements) {
        const mainEl =
            root.querySelector("main") ||
            root.querySelector('[role="main"]') ||
            root.querySelector("article");
        if (mainEl) scope = mainEl;
    }

    // Remove chrome containers from scope before scanning
    if (!includeChromeElements && scope === root) {
        for (const sel of CHROME_SELECTORS) {
            try {
                scope.querySelectorAll(sel).forEach((el) => el.remove());
            } catch {
                // Some selectors may not be supported by node-html-parser
            }
        }
    }

    const scopeHtml = scope.innerHTML || "";

    // --- Buttons ---
    const buttonRe = /<button\b([^>]*)>(.*?)<\/button>/gis;
    for (const m of scopeHtml.matchAll(buttonRe)) {
        const attrs = m[1];
        const inner = m[2];

        if (/(?:type=["']hidden|disabled\b|style=["'][^"']*display:\s*none)/i.test(attrs)) continue;

        let name = extractAttr(attrs, "aria-label") || stripTags(inner).trim();
        name = name.replace(/\s+/g, " ").trim();

        if (!name || name.length > 100) continue;
        if (isNoise(name)) continue;

        interactables.push(
            createInteractable({ ref: ref++, role: "button", name, affordance: "click" })
        );
    }

    // --- Links (CTA only) ---
    const linkRe = /<a\b([^>]*)>(.*?)<\/a>/gis;
    for (const m of scopeHtml.matchAll(linkRe)) {
        const attrs = m[1];
        const inner = m[2];

        let name = extractAttr(attrs, "aria-label") || stripTags(inner).trim();
        name = name.replace(/\s+/g, " ").trim();

        if (!name || name.length > 100) continue;
        if (isNoise(name)) continue;

        if (CTA_RE.test(name) || CTA_RE.test(attrs)) {
            interactables.push(
                createInteractable({ ref: ref++, role: "link", name, affordance: "click" })
            );
        }
    }

    // --- Inputs ---
    const inputRe = /<input\b([^>]*)>/gi;
    for (const m of scopeHtml.matchAll(inputRe)) {
        const attrs = m[1];
        const typeMatch = attrs.match(/type=["'](\w+)["']/i);
        const inputType = typeMatch ? typeMatch[1].toLowerCase() : "text";

        if (["hidden", "submit", "image", "reset"].includes(inputType)) continue;

        let name = "";
        for (const attr of ["aria-label", "placeholder", "name", "title"]) {
            const v = extractAttr(attrs, attr);
            if (v) { name = v; break; }
        }

        if (isNoise(name)) continue;

        const role =
            inputType === "search" || (name && name.toLowerCase().includes("search"))
                ? "searchbox"
                : "textbox";

        if (!name) name = inputType;

        interactables.push(
            createInteractable({ ref: ref++, role, name, affordance: "type" })
        );
    }

    // --- Selects ---
    const selectRe = /<select\b([^>]*)>(.*?)<\/select>/gis;
    for (const m of scopeHtml.matchAll(selectRe)) {
        const attrs = m[1];
        const inner = m[2];

        let name = "";
        for (const attr of ["aria-label", "name", "id", "title"]) {
            const v = extractAttr(attrs, attr);
            if (v) { name = v; break; }
        }

        const options = [...inner.matchAll(/<option[^>]*>(.*?)<\/option>/gis)]
            .map((o) => stripTags(o[1]).trim())
            .filter(Boolean)
            .slice(0, 10);

        interactables.push(
            createInteractable({
                ref: ref++,
                role: "combobox",
                name: name || "select",
                affordance: "select",
                options,
            })
        );
    }

    // Deduplicate by (role, name)
    const seen = new Set();
    const deduped = [];
    for (const el of interactables) {
        const key = `${el.role}:${el.name.toLowerCase()}`;
        if (!seen.has(key)) {
            seen.add(key);
            deduped.push(el);
        }
    }

    // Renumber
    deduped.forEach((el, i) => { el.ref = i + 1; });

    return deduped;
}

// --- Helpers ---

function isNoise(name) {
    if (!name) return false;
    const lower = name.toLowerCase().trim();
    if (NOISE_NAMES.has(lower)) return true;
    return NOISE_PATTERNS.some((re) => re.test(lower));
}

function extractAttr(attrStr, attrName) {
    const re = new RegExp(`${attrName}=["']([^"']+)["']`, "i");
    const m = attrStr.match(re);
    return m ? m[1].trim() : "";
}

function stripTags(html) {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}
