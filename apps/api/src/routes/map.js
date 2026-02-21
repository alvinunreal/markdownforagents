import { Hono } from "hono";
import { buildPageMap, toJson } from "@markdownforagents/pagemap";
import { convertUrl } from "../lib/convert.js";

const map = new Hono();

map.get("/map", async (c) => {
    const start = Date.now();
    const rawUrl = c.req.query("url");
    if (!rawUrl) {
        return c.json({ error: "Missing required 'url' query parameter." }, 400);
    }
    // Use the normalized URL stored by ssrfMiddleware (https:// auto-prepended)
    const url = c.get("normalizedUrl") || rawUrl;
    try {
        const result = await convertUrl(url, c.env.AI);
        const pageMap = buildPageMap({
            url,
            markdown: result.markdown,
            rawHtml: result.rawHtml,
            tokens: result.tokens,
            strategy: result.strategy,
            sourceFormat: result.sourceFormat,
            startTime: start,
        });

        const json = toJson(pageMap);

        return c.json(json, 200, {
            "X-Token-Count": String(result.tokens),
            "X-Page-Type": pageMap.pageType,
            "X-Conversion-Strategy": result.strategy,
            "X-Source-Format": result.sourceFormat,
            "X-Generation-Ms": String(pageMap.stats.generationMs),
        });
    } catch (err) {
        const status = err.message.includes("Unsupported content type") ? 415
            : err.message.includes("too large") ? 413
            : err.message.includes("(429)") ? 429
            : err.message.includes("(403)") ? 403
                : 502;
        return c.json({ error: err.message }, status);
    }
});

export { map };
