import { describe, it, expect } from "vitest";
import { extractMetadata } from "../extract-metadata.js";

describe("extractMetadata", () => {
    it("extracts title", () => {
        const html = `<html><head><title>My Page</title></head><body></body></html>`;
        const meta = extractMetadata(html);
        expect(meta.title).toBe("My Page");
    });

    it("extracts meta description", () => {
        const html = `<html><head><meta name="description" content="A great page"></head></html>`;
        const meta = extractMetadata(html);
        expect(meta.description).toBe("A great page");
    });

    it("extracts author", () => {
        const html = `<html><head><meta name="author" content="Jane Doe"></head></html>`;
        const meta = extractMetadata(html);
        expect(meta.author).toBe("Jane Doe");
    });

    it("extracts language", () => {
        const html = `<html lang="en"><head></head></html>`;
        const meta = extractMetadata(html);
        expect(meta.language).toBe("en");
    });

    it("extracts canonical URL", () => {
        const html = `<html><head><link rel="canonical" href="https://example.com/page"></head></html>`;
        const meta = extractMetadata(html);
        expect(meta.canonical).toBe("https://example.com/page");
    });

    it("extracts favicon", () => {
        const html = `<html><head><link rel="icon" href="/favicon.ico"></head></html>`;
        const meta = extractMetadata(html);
        expect(meta.favicon).toBe("/favicon.ico");
    });

    it("extracts RSS feeds", () => {
        const html = `<html><head><link rel="alternate" type="application/rss+xml" href="/feed.xml"></head></html>`;
        const meta = extractMetadata(html);
        expect(meta.feeds).toEqual(["/feed.xml"]);
    });

    it("extracts published date from meta tag", () => {
        const html = `<html><head><meta property="article:published_time" content="2026-01-15"></head></html>`;
        const meta = extractMetadata(html);
        expect(meta.published).toBe("2026-01-15");
    });

    it("extracts published date from time element", () => {
        const html = `<html><body><time datetime="2026-01-15">Jan 15</time></body></html>`;
        const meta = extractMetadata(html);
        expect(meta.published).toBe("2026-01-15");
    });

    it("extracts Open Graph tags", () => {
        const html = `<html><head>
      <meta property="og:title" content="My Page">
      <meta property="og:image" content="https://img.com/pic.jpg">
    </head></html>`;
        const meta = extractMetadata(html);
        expect(meta.og).toBeDefined();
        expect(meta.og.title).toBe("My Page");
        expect(meta.og.image).toBe("https://img.com/pic.jpg");
    });

    it("extracts Twitter Card tags", () => {
        const html = `<html><head>
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="My Tweet">
    </head></html>`;
        const meta = extractMetadata(html);
        expect(meta.twitter).toBeDefined();
        expect(meta.twitter.card).toBe("summary_large_image");
        expect(meta.twitter.title).toBe("My Tweet");
    });

    it("extracts JSON-LD", () => {
        const html = `<html><head>
      <script type="application/ld+json">{"@type":"Product","name":"Shoes"}</script>
    </head></html>`;
        const meta = extractMetadata(html);
        expect(meta.jsonLd).toBeDefined();
        expect(meta.jsonLd[0]).toMatchObject({ "@type": "Product", name: "Shoes" });
    });

    it("skips invalid JSON-LD", () => {
        const html = `<html><head>
      <script type="application/ld+json">not valid json</script>
    </head></html>`;
        const meta = extractMetadata(html);
        expect(meta.jsonLd).toBeUndefined();
    });

    it("returns empty object for empty html", () => {
        const meta = extractMetadata("");
        expect(Object.keys(meta).length).toBe(0);
    });
});
