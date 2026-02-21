/**
 * 3-tier URL → Markdown conversion.
 *
 * Tier 1: Content negotiation (Accept: text/markdown) — free, fastest
 * Tier 2: Workers AI.toMarkdown() — universal fallback
 */

const USER_AGENT =
    "Mozilla/5.0 (compatible; MarkdownForAgents/0.1; +https://markdownforagents.com)";

/** Content types that AI.toMarkdown() can handle */
const SUPPORTED_TYPES = new Set([
    "text/html",
    "application/pdf",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/markdown",
]);

/** Map content type → file extension for AI.toMarkdown() */
const EXT_MAP = {
    "text/html": "html",
    "application/pdf": "pdf",
    "text/csv": "csv",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "text/plain": "txt",
    "text/markdown": "md",
};

/**
 * @typedef {Object} ConversionResult
 * @property {string} markdown - Converted markdown content
 * @property {string} rawHtml - Original HTML (for interactable/metadata extraction)
 * @property {number} tokens - Estimated token count
 * @property {string} strategy - Which conversion tier was used
 * @property {string} sourceFormat - Original content type
 * @property {number} status - Upstream HTTP status
 */

/**
 * Convert a URL to markdown using tiered strategy.
 *
 * @param {string} url
 * @param {Object} ai - Workers AI binding (env.AI)
 * @returns {Promise<ConversionResult>}
 */
export async function convertUrl(url, ai) {
    // --- Tier 1: Content negotiation ---
    const tier1 = await tryContentNegotiation(url);
    if (tier1) return tier1;

    // --- Tier 2: Fetch raw + AI.toMarkdown() ---
    return await fetchAndConvert(url, ai);
}

/**
 * Tier 1: Try fetching with Accept: text/markdown.
 * Works for sites with Cloudflare Markdown for Agents enabled.
 */
async function tryContentNegotiation(url) {
    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent": USER_AGENT,
                Accept: "text/markdown, text/html;q=0.9",
            },
            redirect: "follow",
            signal: AbortSignal.timeout(10_000),
        });

        if (!res.ok) return null;

        const contentType = (res.headers.get("content-type") || "").toLowerCase();
        if (!contentType.includes("text/markdown")) return null;

        const markdown = await res.text();
        if (!markdown || markdown.trim().length < 20) return null;

        const tokens = parseInt(res.headers.get("x-markdown-tokens") || "0", 10);

        // We still need raw HTML for interactable/metadata extraction.
        // Fetch it separately (cheap, usually cached by CF).
        let rawHtml = "";
        try {
            const htmlRes = await fetch(url, {
                headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
                redirect: "follow",
                signal: AbortSignal.timeout(10_000),
            });
            if (htmlRes.ok) rawHtml = await htmlRes.text();
        } catch {
            // Non-critical — we still have the markdown
        }

        return {
            markdown,
            rawHtml,
            tokens,
            strategy: "accept-header",
            sourceFormat: "text/html",
            status: res.status,
        };
    } catch {
        return null;
    }
}

/**
 * Tier 2: Fetch raw content + convert via AI.toMarkdown().
 */
async function fetchAndConvert(url, ai) {
    const res = await fetch(url, {
        headers: {
            "User-Agent": USER_AGENT,
            Accept: "text/html,application/xhtml+xml,application/pdf,*/*",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
        if (res.status === 429) {
            throw new Error("Target site returned 429 Too Many Requests. Access is restricted.");
        }
        if (res.status === 403) {
            throw new Error("Target site is blocking automated access (403). Some sites block Cloudflare Workers.");
        }
        throw new Error(`Upstream returned ${res.status} ${res.statusText}`);
    }

    const contentType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    const sourceFormat = contentType || "text/html";

    // Reject early if content-length header indicates too large (fast path)
    const contentLength = parseInt(res.headers.get("content-length") || "0", 10);
    if (contentLength > 2_097_152) {
        throw new Error("Response too large (max 2MB)");
    }

    // Read body once — all branches decode from this buffer
    const rawBody = await res.arrayBuffer();

    // Check actual body size (content-length may be absent or wrong)
    if (rawBody.byteLength > 2_097_152) {
        throw new Error("Response too large (max 2MB)");
    }

    const decoder = new TextDecoder();

    // If already markdown or plain text, return as-is
    if (contentType === "text/markdown") {
        const markdown = decoder.decode(rawBody);
        return {
            markdown,
            rawHtml: "",
            tokens: estimateTokens(markdown),
            strategy: "direct",
            sourceFormat,
            status: res.status,
        };
    }

    if (contentType === "text/plain") {
        const text = decoder.decode(rawBody);
        return {
            markdown: text,
            rawHtml: "",
            tokens: estimateTokens(text),
            strategy: "direct",
            sourceFormat,
            status: res.status,
        };
    }

    // Check if we support this content type
    if (!SUPPORTED_TYPES.has(contentType) && !contentType.startsWith("text/html")) {
        throw new Error(`Unsupported content type: ${contentType}`);
    }

    const rawHtml = contentType.includes("html") ? decoder.decode(rawBody) : "";
    const ext = EXT_MAP[contentType] || "html";

    // Convert via AI.toMarkdown()
    const blob = new Blob([rawBody], { type: contentType });
    const result = await ai.toMarkdown([{ name: `page.${ext}`, blob }]);

    const conversion = Array.isArray(result) ? result[0] : result;

    if (conversion.format === "error") {
        throw new Error(`AI conversion failed: ${conversion.error}`);
    }

    return {
        markdown: conversion.data || "",
        rawHtml,
        tokens: conversion.tokens || estimateTokens(conversion.data || ""),
        strategy: "ai-tomarkdown",
        sourceFormat,
        status: res.status,
    };
}

/** Rough token estimate: ~4 chars per token */
function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}
