import { describe, it, expect } from "vitest";
import { buildPageMap } from "../build-page-map.js";
import { toAgentMarkdown, toJson } from "../serializer.js";

const SAMPLE_HTML = `
<html lang="en">
<head>
  <title>Nike Air Max 90 - Shoes</title>
  <meta name="description" content="Classic sneaker with visible Air cushioning">
  <meta name="author" content="Nike">
  <meta property="og:title" content="Nike Air Max 90">
  <meta property="og:image" content="https://cdn.nike.com/air-max.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="https://nike.com/product/air-max-90">
  <script type="application/ld+json">{"@type":"Product","name":"Air Max 90","offers":{"price":"139"}}</script>
</head>
<body>
  <nav><a href="/">Home</a><a href="/men">Men</a><button>Menu</button></nav>
  <main>
    <h1>Nike Air Max 90</h1>
    <span itemprop="price">$139.00</span>
    <span>4.7 stars (2,341 reviews)</span>
    <img src="https://cdn.nike.com/air-max-1.jpg" width="600" height="400">
    <img src="https://cdn.nike.com/air-max-2.jpg" width="600" height="400">
    <select aria-label="Size"><option>8</option><option>9</option><option>10</option></select>
    <button>Add to Cart</button>
    <button>Buy Now</button>
    <input type="search" placeholder="Search Nike">
  </main>
  <footer><button>Back to top</button>Copyright 2026</footer>
</body>
</html>
`;

const SAMPLE_MARKDOWN = "# Nike Air Max 90\n\n$139.00\n4.7 stars (2,341 reviews)";

describe("buildPageMap", () => {
    it("builds a complete PageMap from markdown + HTML", () => {
        const pageMap = buildPageMap({
            url: "https://nike.com/product/air-max-90",
            markdown: SAMPLE_MARKDOWN,
            rawHtml: SAMPLE_HTML,
            tokens: 42,
            strategy: "ai-tomarkdown",
            sourceFormat: "text/html",
        });

        expect(pageMap.url).toBe("https://nike.com/product/air-max-90");
        expect(pageMap.title).toBe("Nike Air Max 90 - Shoes");
        expect(pageMap.pageType).toBe("product_detail");
        expect(pageMap.content).toBe(SAMPLE_MARKDOWN);
        expect(pageMap.images.length).toBeGreaterThanOrEqual(1);
        expect(pageMap.stats.tokenCount).toBe(42);
        expect(pageMap.stats.conversionStrategy).toBe("ai-tomarkdown");

        // Interactables should come from <main>, not nav/footer
        const names = pageMap.interactables.map((i) => i.name);
        expect(names).toContain("Add to Cart");
        expect(names).toContain("Buy Now");
        expect(names).not.toContain("Menu"); // nav button filtered
        expect(names).not.toContain("Back to top"); // footer button filtered
    });

    it("extracts rich metadata", () => {
        const pageMap = buildPageMap({
            url: "https://nike.com/product/air-max-90",
            markdown: SAMPLE_MARKDOWN,
            rawHtml: SAMPLE_HTML,
        });

        expect(pageMap.metadata.title).toBe("Nike Air Max 90 - Shoes");
        expect(pageMap.metadata.description).toBe("Classic sneaker with visible Air cushioning");
        expect(pageMap.metadata.author).toBe("Nike");
        expect(pageMap.metadata.language).toBe("en");
        expect(pageMap.metadata.canonical).toBe("https://nike.com/product/air-max-90");
        expect(pageMap.metadata.og.title).toBe("Nike Air Max 90");
        expect(pageMap.metadata.twitter.card).toBe("summary_large_image");
        expect(pageMap.metadata.jsonLd[0]).toMatchObject({ "@type": "Product" });
    });

    it("handles missing rawHtml gracefully", () => {
        const pageMap = buildPageMap({
            url: "https://example.com/doc.pdf",
            markdown: "# My PDF Content",
            rawHtml: "",
            strategy: "ai-tomarkdown",
            sourceFormat: "application/pdf",
        });

        expect(pageMap.content).toBe("# My PDF Content");
        expect(pageMap.interactables).toHaveLength(0);
        expect(pageMap.images).toHaveLength(0);
    });
});

describe("toAgentMarkdown", () => {
    it("produces markdown with YAML frontmatter", () => {
        const pageMap = buildPageMap({
            url: "https://nike.com/product/air-max-90",
            markdown: SAMPLE_MARKDOWN,
            rawHtml: SAMPLE_HTML,
            tokens: 42,
        });
        const md = toAgentMarkdown(pageMap);

        expect(md).toContain("---");
        expect(md).toContain("url: https://nike.com/product/air-max-90");
        expect(md).toContain("type: product_detail");
        expect(md).toContain("tokens: 42");
        expect(md).toContain("# Nike Air Max 90");
        expect(md).toContain("## Actions");
        expect(md).toContain("Add to Cart");
    });
});

describe("toJson", () => {
    it("produces structured JSON with stats", () => {
        const pageMap = buildPageMap({
            url: "https://nike.com/product/air-max-90",
            markdown: SAMPLE_MARKDOWN,
            rawHtml: SAMPLE_HTML,
            tokens: 42,
            strategy: "ai-tomarkdown",
        });
        const json = toJson(pageMap);

        expect(json.url).toBe("https://nike.com/product/air-max-90");
        expect(json.page_type).toBe("product_detail");
        expect(json.content).toBe(SAMPLE_MARKDOWN);
        expect(json.interactables).toBeInstanceOf(Array);
        expect(json.stats.tokenCount).toBe(42);
        expect(json.stats.conversionStrategy).toBe("ai-tomarkdown");
        expect(json.metadata.og).toBeDefined();
        expect(json.metadata.jsonLd).toBeDefined();
    });
});
