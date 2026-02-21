import { describe, it, expect } from "vitest";
import app from "../index.js";

describe("API routes", () => {
    it("GET / returns API info", async () => {
        const res = await app.request("/");
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.name).toBe("markdownforagents");
        expect(body.endpoints).toBeDefined();
        expect(body.endpoints.reader).toBeDefined();
        expect(body.endpoints.map).toBeDefined();
    });

    it("GET /health returns ok", async () => {
        const res = await app.request("/health");
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.status).toBe("ok");
        expect(body.version).toBeDefined();
    });

    it("GET /r without url returns 400", async () => {
        const res = await app.request("/r");
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toContain("url");
    });

    it("GET /map without url returns 400", async () => {
        const res = await app.request("/map");
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toContain("url");
    });

    it("GET /r with private IP returns 403", async () => {
        const res = await app.request("/r?url=http://192.168.1.1");
        expect(res.status).toBe(403);
    });

    it("GET /map with localhost returns 403", async () => {
        const res = await app.request("/map?url=http://localhost:3000");
        expect(res.status).toBe(403);
    });

    it("GET /r with invalid scheme returns 403", async () => {
        const res = await app.request("/r?url=ftp://example.com");
        expect(res.status).toBe(403);
    });
});
