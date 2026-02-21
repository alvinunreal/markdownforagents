import { Hono } from "hono";

const health = new Hono();

health.get("/health", (c) => {
    return c.json({
        status: "ok",
        version: "0.0.1",
        timestamp: new Date().toISOString(),
    });
});

export { health };
