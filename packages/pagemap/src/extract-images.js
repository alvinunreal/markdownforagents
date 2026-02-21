/**
 * Image extraction from raw HTML.
 */

import { parse } from "node-html-parser";

/**
 * Extract product/content images from HTML.
 * @param {string} rawHtml
 * @param {string} baseUrl
 * @returns {string[]}
 */
export function extractImages(rawHtml, baseUrl) {
    const root = parse(rawHtml);
    const images = [];
    const seen = new Set();

    // Prefer images from main content area
    const mainEl =
        root.querySelector("main") ||
        root.querySelector('[role="main"]') ||
        root.querySelector("article") ||
        root;

    for (const img of mainEl.querySelectorAll("img")) {
        const src =
            img.getAttribute("src") ||
            img.getAttribute("data-src") ||
            img.getAttribute("data-lazy-src") ||
            "";
        if (!src || src.startsWith("data:")) continue;

        // Skip tiny icons/tracking pixels
        const width = parseInt(img.getAttribute("width") || "999", 10);
        const height = parseInt(img.getAttribute("height") || "999", 10);
        if (width < 50 || height < 50) continue;

        let fullUrl;
        try {
            fullUrl = new URL(src, baseUrl).href;
        } catch {
            continue;
        }

        if (!seen.has(fullUrl)) {
            seen.add(fullUrl);
            images.push(fullUrl);
        }

        if (images.length >= 10) break;
    }

    return images;
}
