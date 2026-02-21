import { Hono } from "hono";
import { cors } from "hono/cors";
import { health } from "./routes/health.js";
import { reader } from "./routes/reader.js";
import { map } from "./routes/map.js";
import { ssrfMiddleware } from "./middleware/ssrf.js";

const app = new Hono();

// Global middleware
app.use("*", cors());
app.use("/r", ssrfMiddleware);
app.use("/map", ssrfMiddleware);

// Routes
app.route("/", health);
app.route("/", reader);
app.route("/", map);

// Root — self-documenting API info
app.get("/", (c) => {
    return c.json({
        name: "markdownforagents",
        version: "0.1.0",
        endpoints: {
            reader: {
                method: "GET",
                path: "/r?url={url}",
                description: "Convert any URL to clean markdown",
                returns: "text/markdown",
            },
            map: {
                method: "GET",
                path: "/map?url={url}",
                description: "Structured PageMap with interactables and metadata",
                returns: "application/json",
            },
            health: {
                method: "GET",
                path: "/health",
                returns: "application/json",
            },
        },
        docs: "https://markdownforagents.com",
    });
});

export default app;
