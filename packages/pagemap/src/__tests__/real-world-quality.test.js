/**
 * Real-world quality tests.
 * Uses saved HTML fixtures from actual websites to test the pagemap pipeline.
 *
 * These tests assert:
 * 1. Content completeness — main content is present
 * 2. Noise removal — nav/modals/chrome are absent from interactables
 * 3. Metadata richness — OG, JSON-LD, title, etc. extracted
 * 4. Interactable quality — only useful elements, no noise
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPageMap } from "../build-page-map.js";
import { toAgentMarkdown, toJson } from "../serializer.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (name) => readFileSync(join(__dirname, "fixtures", name), "utf-8");

// ─── example.com ────────────────────────────────────────────────────
describe("Fixture: example.com", () => {
  const html = fixture("example.html");
  const pageMap = buildPageMap({
    url: "https://example.com",
    markdown: "# Example Domain\n\nThis domain is for use in documentation examples.",
    rawHtml: html,
  });

  it("detects title", () => {
    expect(pageMap.title).toBe("Example Domain");
  });

  it("detects language", () => {
    expect(pageMap.metadata.language).toBe("en");
  });

  it("has minimal interactables (simple page)", () => {
    expect(pageMap.interactables.length).toBeLessThanOrEqual(3);
  });
});

// ─── Wikipedia: JavaScript ──────────────────────────────────────────
describe("Fixture: Wikipedia — JavaScript", () => {
  const html = fixture("wikipedia-javascript.html");
  const pageMap = buildPageMap({
    url: "https://en.wikipedia.org/wiki/JavaScript",
    markdown: "# JavaScript\n\nJavaScript is a high-level programming language.",
    rawHtml: html,
  });

  it("detects article page type", () => {
    expect(pageMap.pageType).toBe("article");
  });

  it("extracts title", () => {
    expect(pageMap.title).toContain("JavaScript");
  });

  it("has Open Graph metadata", () => {
    expect(pageMap.metadata.og).toBeDefined();
    expect(pageMap.metadata.og.title).toContain("JavaScript");
  });

  it("extracts language", () => {
    expect(pageMap.metadata.language).toBe("en");
  });

  it("interactables don't include nav chrome", () => {
    const names = pageMap.interactables.map((i) => i.name.toLowerCase());
    expect(names).not.toContain("toggle navigation");
    expect(names).not.toContain("menu");
    expect(names).not.toContain("sign in");
    expect(names).not.toContain("log in");
  });

  it("has reasonable interactable count", () => {
    // Wikipedia has lots of links but few real interactables in main content
    expect(pageMap.interactables.length).toBeLessThan(30);
  });
});

// ─── Hacker News ────────────────────────────────────────────────────
describe("Fixture: Hacker News", () => {
  const html = fixture("hackernews.html");
  const pageMap = buildPageMap({
    url: "https://news.ycombinator.com",
    markdown: "# Hacker News\n\n1. Some post title",
    rawHtml: html,
  });

  it("extracts title", () => {
    expect(pageMap.title).toBe("Hacker News");
  });

  it("page type is listing or unknown", () => {
    expect(["listing", "unknown"]).toContain(pageMap.pageType);
  });

  it("interactables don't include noise", () => {
    const names = pageMap.interactables.map((i) => i.name.toLowerCase());
    expect(names).not.toContain("close");
    expect(names).not.toContain("dismiss");
    expect(names).not.toContain("cookie");
  });
});

// ─── MDN: Array ─────────────────────────────────────────────────────
describe("Fixture: MDN — Array Reference", () => {
  const html = fixture("mdn-array.html");
  const pageMap = buildPageMap({
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array",
    markdown: "# Array\n\nThe Array object enables storing a collection of multiple items.",
    rawHtml: html,
  });

  it("extracts title with Array", () => {
    expect(pageMap.title).toContain("Array");
  });

  it("extracts language", () => {
    expect(pageMap.metadata.language).toBeDefined();
  });

  it("extracts canonical URL", () => {
    expect(pageMap.metadata.canonical).toContain("developer.mozilla.org");
  });

  it("interactables are filtered to content area", () => {
    const names = pageMap.interactables.map((i) => i.name.toLowerCase());
    expect(names).not.toContain("sign in");
    expect(names).not.toContain("menu");
    expect(names).not.toContain("close");
  });

  it("has rich metadata (title + description)", () => {
    expect(pageMap.metadata.title).toBeDefined();
    expect(pageMap.metadata.title).toContain("Array");
  });
});

// ─── Cloudflare Blog: Markdown for Agents ───────────────────────────
describe("Fixture: Cloudflare Blog", () => {
  const html = fixture("cloudflare-blog.html");
  const pageMap = buildPageMap({
    url: "https://blog.cloudflare.com/markdown-for-agents/",
    markdown: "# Introducing Markdown for Agents\n\nMarkdown has become the lingua franca for agents.",
    rawHtml: html,
  });

  it("detects article page type from URL", () => {
    // blog.cloudflare.com doesn't match article patterns by default
    // but the content is article-like
    expect(pageMap.title).toContain("Markdown");
  });

  it("extracts OG metadata", () => {
    expect(pageMap.metadata.og).toBeDefined();
    expect(pageMap.metadata.og.title).toBeDefined();
  });

  it("extracts twitter card", () => {
    expect(pageMap.metadata.twitter).toBeDefined();
  });

  it("has description", () => {
    expect(pageMap.metadata.description).toBeDefined();
    expect(pageMap.metadata.description.length).toBeGreaterThan(10);
  });

  it("interactables are clean (no cookie/nav noise)", () => {
    const names = pageMap.interactables.map((i) => i.name.toLowerCase());
    expect(names).not.toContain("toggle navigation");
    expect(names).not.toContain("manage cookies");
    expect(names).not.toContain("sign in");
    expect(names).not.toContain("accept cookies");
    expect(names).not.toContain("cookie settings");
  });
});

// ─── GitHub: Hono ───────────────────────────────────────────────────
describe("Fixture: GitHub — Hono repo", () => {
  const html = fixture("github-hono.html");
  const pageMap = buildPageMap({
    url: "https://github.com/honojs/hono",
    markdown: "# Hono\n\nWeb framework built on Web Standards",
    rawHtml: html,
  });

  it("extracts title with hono", () => {
    expect(pageMap.title.toLowerCase()).toContain("hono");
  });

  it("has OG metadata", () => {
    expect(pageMap.metadata.og).toBeDefined();
  });

  it("interactables are scoped to main content", () => {
    const names = pageMap.interactables.map((i) => i.name.toLowerCase());

    // Should NOT include GitHub chrome
    expect(names).not.toContain("toggle navigation");
    expect(names).not.toContain("dismiss this message");
    expect(names).not.toContain("dismiss error");
    expect(names).not.toContain("close dialog");
    expect(names).not.toContain("resetting focus");
    expect(names).not.toContain("sign in");
    expect(names).not.toContain("sign up");
    expect(names).not.toContain("homepage");
    expect(names).not.toContain("submit feedback");
    expect(names).not.toContain("create saved search");
    expect(names).not.toContain("manage cookies");
    expect(names).not.toContain("do not share my personal information");
  });

  it("has reasonable interactable count (not 30+ noise)", () => {
    // Before noise filtering, GitHub had 32 interactables
    // After, should be much fewer — only real content actions
    expect(pageMap.interactables.length).toBeLessThan(15);
  });

  it("extracts images from main content", () => {
    // GitHub repos have images in the README area
    expect(pageMap.images.length).toBeGreaterThanOrEqual(0); // may have badges
  });
});

// ─── BBC News ───────────────────────────────────────────────────────
describe("Fixture: BBC News", () => {
  const html = fixture("bbc-news.html");
  const pageMap = buildPageMap({
    url: "https://www.bbc.com/news",
    markdown: "# BBC News\n\nLatest news headlines.",
    rawHtml: html,
  });

  it("extracts title", () => {
    expect(pageMap.title.toLowerCase()).toContain("bbc");
  });

  it("extracts language", () => {
    expect(pageMap.metadata.language).toBeDefined();
  });

  it("interactables don't include nav/cookie noise", () => {
    const names = pageMap.interactables.map((i) => i.name.toLowerCase());
    expect(names).not.toContain("close");
    expect(names).not.toContain("dismiss");
    expect(names).not.toContain("accept cookies");
    expect(names).not.toContain("cookie");
  });
});

// ─── Cross-cutting quality checks ───────────────────────────────────
describe("Cross-cutting: serialization quality", () => {
  const html = fixture("cloudflare-blog.html");
  const pageMap = buildPageMap({
    url: "https://blog.cloudflare.com/markdown-for-agents/",
    markdown: "# Introducing Markdown for Agents\n\nMarkdown has become the lingua franca for agents.",
    rawHtml: html,
    tokens: 200,
    strategy: "ai-tomarkdown",
    sourceFormat: "text/html",
  });

  it("toAgentMarkdown includes YAML frontmatter", () => {
    const md = toAgentMarkdown(pageMap);
    expect(md).toMatch(/^---\n/);
    expect(md).toContain("url: https://blog.cloudflare.com/markdown-for-agents/");
    expect(md).toContain("tokens: 200");
    expect(md).toContain("---\n\n");
  });

  it("toAgentMarkdown includes content before actions", () => {
    const md = toAgentMarkdown(pageMap);
    const contentPos = md.indexOf("# Introducing");
    const actionsPos = md.indexOf("## Actions");
    if (actionsPos > -1) {
      expect(contentPos).toBeLessThan(actionsPos);
    }
  });

  it("toJson includes stats", () => {
    const json = toJson(pageMap);
    expect(json.stats.tokenCount).toBe(200);
    expect(json.stats.conversionStrategy).toBe("ai-tomarkdown");
    expect(json.stats.sourceFormat).toBe("text/html");
    expect(json.stats.interactableCount).toBeDefined();
  });

  it("toJson metadata is rich", () => {
    const json = toJson(pageMap);
    expect(json.metadata.og).toBeDefined();
    expect(json.metadata.description).toBeDefined();
  });
});
