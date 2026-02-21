/**
 * PageMap builder — orchestrates enrichment on top of converted content.
 *
 * Takes markdown content (from external converter) + raw HTML (for extraction).
 * Adds interactables, metadata, images, page type detection.
 */

import { createPageMap } from "./types.js";
import { detectPageType } from "./detect-page-type.js";
import { detectInteractables } from "./detect-interactables.js";
import { extractMetadata } from "./extract-metadata.js";
import { extractImages } from "./extract-images.js";

/**
 * Build a PageMap from pre-converted markdown + raw HTML.
 *
 * @param {Object} params
 * @param {string} params.url - Original URL
 * @param {string} params.markdown - Converted markdown content
 * @param {string} params.rawHtml - Original HTML (for interactable/metadata extraction)
 * @param {number} [params.tokens] - Token count from converter
 * @param {string} [params.strategy] - Conversion strategy used
 * @param {string} [params.sourceFormat] - Original content type
 * @param {number} [params.startTime] - Optional start timestamp (to include conversion time)
 * @returns {import('./types.js').PageMap}
 */
export function buildPageMap({ url, markdown, rawHtml, tokens = 0, strategy = "unknown", sourceFormat = "text/html", startTime }) {
    const start = startTime || Date.now();

    // Extract title from HTML
    const titleMatch = rawHtml.match(/<title[^>]*>(.*?)<\/title>/is);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // Detect page type from URL
    const pageType = detectPageType(url);

    // Extract metadata from raw HTML
    const metadata = rawHtml ? extractMetadata(rawHtml) : {};

    // Detect interactive elements from raw HTML
    const interactables = rawHtml ? detectInteractables(rawHtml) : [];

    // Extract images from raw HTML
    const images = rawHtml ? extractImages(rawHtml, url) : [];

    const elapsed = Date.now() - start;

    return createPageMap({
        url,
        title: metadata.title || title,
        pageType,
        interactables,
        content: markdown,
        images,
        metadata,
        stats: {
            tokenCount: tokens,
            interactableCount: interactables.length,
            imageCount: images.length,
            generationMs: elapsed,
            conversionStrategy: strategy,
            sourceFormat,
        },
    });
}
