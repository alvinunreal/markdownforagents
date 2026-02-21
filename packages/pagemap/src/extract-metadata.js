/**
 * Metadata extraction from raw HTML.
 * Pulls structured data (JSON-LD, Open Graph, Twitter, meta tags) from the page.
 */

import { parse } from "node-html-parser";

/**
 * Extract all available metadata from HTML.
 * @param {string} rawHtml
 * @returns {Object}
 */
export function extractMetadata(rawHtml) {
    const root = parse(rawHtml);
    const metadata = {};

    // Title
    const titleEl = root.querySelector("title");
    if (titleEl) metadata.title = titleEl.textContent.trim();

    // Meta description
    const descEl = root.querySelector('meta[name="description"]');
    if (descEl) metadata.description = (descEl.getAttribute("content") || "").trim();

    // Author
    const authorEl = root.querySelector('meta[name="author"]');
    if (authorEl) metadata.author = (authorEl.getAttribute("content") || "").trim();

    // Keywords
    const keywordsEl = root.querySelector('meta[name="keywords"]');
    if (keywordsEl) metadata.keywords = (keywordsEl.getAttribute("content") || "").trim();

    // Language
    const htmlEl = root.querySelector("html");
    if (htmlEl) {
        const lang = htmlEl.getAttribute("lang");
        if (lang) metadata.language = lang.trim();
    }

    // Canonical URL
    const canonicalEl = root.querySelector('link[rel="canonical"]');
    if (canonicalEl) metadata.canonical = (canonicalEl.getAttribute("href") || "").trim();

    // Favicon
    const faviconEl =
        root.querySelector('link[rel="icon"]') ||
        root.querySelector('link[rel="shortcut icon"]');
    if (faviconEl) metadata.favicon = (faviconEl.getAttribute("href") || "").trim();

    // RSS/Atom feeds
    const feedEls = root.querySelectorAll(
        'link[rel="alternate"][type="application/rss+xml"], link[rel="alternate"][type="application/atom+xml"]'
    );
    if (feedEls.length > 0) {
        metadata.feeds = feedEls
            .map((el) => el.getAttribute("href"))
            .filter(Boolean);
    }

    // Published date — try multiple sources
    const dateEl =
        root.querySelector('meta[property="article:published_time"]') ||
        root.querySelector('meta[name="date"]') ||
        root.querySelector('meta[name="pubdate"]');
    if (dateEl) {
        metadata.published = (dateEl.getAttribute("content") || "").trim();
    } else {
        // Try <time> element with datetime attribute
        const timeEl = root.querySelector("time[datetime]");
        if (timeEl) metadata.published = timeEl.getAttribute("datetime").trim();
    }

    // Open Graph
    const ogTags = root.querySelectorAll('meta[property^="og:"]');
    if (ogTags.length > 0) {
        metadata.og = {};
        for (const tag of ogTags) {
            const prop = tag.getAttribute("property").replace("og:", "");
            metadata.og[prop] = (tag.getAttribute("content") || "").trim();
        }
    }

    // Twitter Card
    const twitterTags = root.querySelectorAll('meta[name^="twitter:"]');
    if (twitterTags.length > 0) {
        metadata.twitter = {};
        for (const tag of twitterTags) {
            const name = tag.getAttribute("name").replace("twitter:", "");
            metadata.twitter[name] = (tag.getAttribute("content") || "").trim();
        }
    }

    // JSON-LD
    const jsonLdMatches =
        rawHtml.match(
            /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
        ) || [];
    if (jsonLdMatches.length > 0) {
        metadata.jsonLd = [];
        for (const script of jsonLdMatches) {
            const content = script
                .replace(/<script[^>]*>/, "")
                .replace(/<\/script>/, "")
                .trim();
            try {
                metadata.jsonLd.push(JSON.parse(content));
            } catch {
                // skip invalid JSON-LD
            }
        }
        if (metadata.jsonLd.length === 0) delete metadata.jsonLd;
    }

    return metadata;
}
