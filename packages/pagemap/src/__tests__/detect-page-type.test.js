import { describe, it, expect } from "vitest";
import { detectPageType } from "../detect-page-type.js";

describe("detectPageType", () => {
    it("detects product_detail from URL", () => {
        expect(detectPageType("https://example.com/products/123")).toBe("product_detail");
        expect(detectPageType("https://example.com/product/air-max")).toBe("product_detail");
        expect(detectPageType("https://amazon.com/dp/B08N5WRWNW")).toBe("product_detail");
    });

    it("detects search_results from URL", () => {
        expect(detectPageType("https://example.com/search?q=shoes")).toBe("search_results");
        expect(detectPageType("https://example.com/browse")).toBe("search_results");
    });

    it("detects article from URL", () => {
        expect(detectPageType("https://example.com/blog/my-post")).toBe("article");
        expect(detectPageType("https://en.wikipedia.org/wiki/JavaScript")).toBe("article");
    });

    it("detects listing from URL", () => {
        expect(detectPageType("https://example.com/category/electronics")).toBe("listing");
        expect(detectPageType("https://example.com/women/dresses")).toBe("listing");
    });

    it("returns unknown for unrecognized URLs", () => {
        expect(detectPageType("https://example.com")).toBe("unknown");
        expect(detectPageType("https://example.com/about")).toBe("unknown");
    });
});
