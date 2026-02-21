import { describe, it, expect } from "vitest";
import { extractImages } from "../extract-images.js";

describe("extractImages", () => {
    it("extracts img src URLs", () => {
        const html = `<body><main><img src="/img/a.jpg"><img src="https://cdn.com/b.png"></main></body>`;
        const images = extractImages(html, "https://example.com");
        expect(images).toHaveLength(2);
        expect(images[0]).toBe("https://example.com/img/a.jpg");
        expect(images[1]).toBe("https://cdn.com/b.png");
    });

    it("skips data: URIs", () => {
        const html = `<body><img src="data:image/png;base64,abc"><img src="/real.jpg"></body>`;
        const images = extractImages(html, "https://example.com");
        expect(images).toHaveLength(1);
        expect(images[0]).toBe("https://example.com/real.jpg");
    });

    it("skips tiny images (icons/tracking pixels)", () => {
        const html = `<body><img src="/pixel.gif" width="1" height="1"><img src="/logo.png" width="200" height="100"></body>`;
        const images = extractImages(html, "https://example.com");
        expect(images).toHaveLength(1);
        expect(images[0]).toBe("https://example.com/logo.png");
    });

    it("deduplicates images", () => {
        const html = `<body><img src="/img.jpg"><img src="/img.jpg"></body>`;
        const images = extractImages(html, "https://example.com");
        expect(images).toHaveLength(1);
    });

    it("caps at 10 images", () => {
        const imgs = Array.from({ length: 15 }, (_, i) => `<img src="/img${i}.jpg">`).join("");
        const html = `<body><main>${imgs}</main></body>`;
        const images = extractImages(html, "https://example.com");
        expect(images.length).toBeLessThanOrEqual(10);
    });

    it("supports data-src (lazy loading)", () => {
        const html = `<body><img data-src="/lazy.jpg"></body>`;
        const images = extractImages(html, "https://example.com");
        expect(images).toHaveLength(1);
        expect(images[0]).toBe("https://example.com/lazy.jpg");
    });
});
