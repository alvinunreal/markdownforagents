import { describe, it, expect } from "vitest";
import { validateUrl } from "../middleware/ssrf.js";

describe("validateUrl", () => {
    it("allows valid http URLs", () => {
        expect(validateUrl("https://example.com").ok).toBe(true);
        expect(validateUrl("http://github.com/repo").ok).toBe(true);
    });

    it("blocks non-http schemes", () => {
        expect(validateUrl("ftp://example.com").ok).toBe(false);
        expect(validateUrl("file:///etc/passwd").ok).toBe(false);
        expect(validateUrl("javascript:alert(1)").ok).toBe(false);
    });

    it("blocks localhost", () => {
        expect(validateUrl("http://localhost").ok).toBe(false);
        expect(validateUrl("http://localhost:3000").ok).toBe(false);
    });

    it("blocks private IPs", () => {
        expect(validateUrl("http://192.168.1.1").ok).toBe(false);
        expect(validateUrl("http://10.0.0.1").ok).toBe(false);
        expect(validateUrl("http://172.16.0.1").ok).toBe(false);
        expect(validateUrl("http://127.0.0.1").ok).toBe(false);
    });

    it("blocks cloud metadata IPs", () => {
        expect(validateUrl("http://169.254.169.254").ok).toBe(false);
        expect(validateUrl("http://metadata.google.internal").ok).toBe(false);
    });

    it("blocks CGNAT range", () => {
        expect(validateUrl("http://100.64.0.1").ok).toBe(false);
        expect(validateUrl("http://100.127.255.255").ok).toBe(false);
    });

    it("rejects invalid URLs", () => {
        // Empty string has no meaningful URL even after normalization
        expect(validateUrl("").ok).toBe(false);
        // Non-http schemes are rejected
        expect(validateUrl("ftp://foo.com").ok).toBe(false);
        // Note: bare strings like 'not-a-url' are now normalized to https://not-a-url
        // This is intentional — we allow bare hostnames and prepend https://
    });
});
