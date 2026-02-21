import { describe, it, expect } from "vitest";
import { detectInteractables } from "../detect-interactables.js";

describe("detectInteractables", () => {
    it("extracts buttons from main content", () => {
        const html = `<body><main><button>Add to Cart</button><button>Buy Now</button></main></body>`;
        const result = detectInteractables(html);
        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({ ref: 1, role: "button", name: "Add to Cart", affordance: "click" });
        expect(result[1]).toMatchObject({ ref: 2, role: "button", name: "Buy Now", affordance: "click" });
    });

    it("skips hidden/disabled buttons", () => {
        const html = `<body><main>
      <button disabled>Disabled</button>
      <button style="display: none">Hidden</button>
      <button>Visible</button>
    </main></body>`;
        const result = detectInteractables(html);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Visible");
    });

    it("extracts inputs", () => {
        const html = `<body><main>
      <input type="search" placeholder="Search products">
      <input type="text" aria-label="Email">
    </main></body>`;
        const result = detectInteractables(html);
        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({ role: "searchbox", name: "Search products", affordance: "type" });
        expect(result[1]).toMatchObject({ role: "textbox", name: "Email", affordance: "type" });
    });

    it("skips hidden inputs", () => {
        const html = `<body><main>
      <input type="hidden" name="csrf">
      <input type="submit" value="Go">
      <input type="text" placeholder="Name">
    </main></body>`;
        const result = detectInteractables(html);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Name");
    });

    it("extracts selects with options", () => {
        const html = `<body><main>
      <select aria-label="Size"><option>S</option><option>M</option><option>L</option></select>
    </main></body>`;
        const result = detectInteractables(html);
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ role: "combobox", name: "Size", affordance: "select" });
        expect(result[0].options).toEqual(["S", "M", "L"]);
    });

    it("extracts CTA links only", () => {
        const html = `<body><main>
      <a href="/about">About</a>
      <a href="/cart">Add to Cart</a>
      <a href="/dl">Download</a>
    </main></body>`;
        const result = detectInteractables(html);
        expect(result.some((i) => i.name === "Add to Cart")).toBe(true);
        expect(result.some((i) => i.name === "Download")).toBe(true);
        expect(result.some((i) => i.name === "About")).toBe(false);
    });

    it("filters out noise elements", () => {
        const html = `<body><main>
      <button>Toggle navigation</button>
      <button>Close</button>
      <button>Dismiss this message</button>
      <button>Add to Cart</button>
    </main></body>`;
        const result = detectInteractables(html);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Add to Cart");
    });

    it("filters out sign-in/sign-up noise", () => {
        const html = `<body><main>
      <a href="/login">Sign in</a>
      <a href="/register">Sign up</a>
      <button>Submit Order</button>
    </main></body>`;
        const result = detectInteractables(html);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Submit Order");
    });

    it("filters out cookie banners", () => {
        const html = `<body><main>
      <button>Accept all cookies</button>
      <button>Reject cookies</button>
      <button>Cookie settings</button>
      <button>Buy Now</button>
    </main></body>`;
        const result = detectInteractables(html);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Buy Now");
    });

    it("deduplicates by (role, name)", () => {
        const html = `<body><main><button>Submit</button><button>Submit</button><button>Cancel</button></main></body>`;
        const result = detectInteractables(html);
        // Cancel is noise, Submit deduplicates to 1
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Submit");
        expect(result[0].ref).toBe(1);
    });

    it("scopes to main content area by default", () => {
        const html = `<body>
      <nav><button>Menu</button></nav>
      <main><button>Buy Now</button></main>
      <footer><button>Back to top</button></footer>
    </body>`;
        const result = detectInteractables(html);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Buy Now");
    });

    it("returns empty for empty html", () => {
        expect(detectInteractables("")).toHaveLength(0);
        expect(detectInteractables("<div>Just text</div>")).toHaveLength(0);
    });

    it("supports includeChromeElements option", () => {
        const html = `<body>
      <nav><button>Menu Toggle</button></nav>
      <main><button>Add to Cart</button></main>
    </body>`;
        const result = detectInteractables(html, { includeChromeElements: true });
        // Menu Toggle is noise but Add to Cart stays; nav buttons are included with option
        expect(result.some((i) => i.name === "Add to Cart")).toBe(true);
    });
});
