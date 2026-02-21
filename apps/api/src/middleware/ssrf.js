/**
 * SSRF protection middleware.
 * Blocks private IPs, localhost, cloud metadata endpoints.
 * Ported from Retio-pagemap server.py
 */

/**
 * Normalize a URL string — if no scheme is present, prepend https://.
 * @param {string} urlStr
 * @returns {string}
 */
export function normalizeUrl(urlStr) {
    const trimmed = urlStr.trim();
    // Only prepend https:// if there is no scheme at all (no "://")
    if (!trimmed.includes("://")) {
        return `https://${trimmed}`;
    }
    return trimmed;
}

const ALLOWED_SCHEMES = new Set(["http:", "https:"]);

const BLOCKED_HOSTS = new Set([
    "localhost",
    "metadata.google.internal",
    "169.254.169.254",
]);

/**
 * Check if an IP is in a private/reserved range.
 * @param {string} ip
 * @returns {boolean}
 */
function isPrivateIp(ip) {
    // IPv4 private ranges
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some((p) => isNaN(p))) return false;

    // 10.0.0.0/8
    if (parts[0] === 10) return true;
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 127.0.0.0/8 (loopback)
    if (parts[0] === 127) return true;
    // 169.254.0.0/16 (link-local / cloud metadata)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 0.0.0.0/8
    if (parts[0] === 0) return true;
    // 100.64.0.0/10 (CGNAT)
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;

    return false;
}

/**
 * Validate a URL for safe fetching.
 * @param {string} urlStr
 * @returns {{ ok: boolean, error?: string }}
 */
export function validateUrl(urlStr) {
    const normalized = normalizeUrl(urlStr);
    let parsed;
    try {
        parsed = new URL(normalized);
    } catch {
        return { ok: false, error: "Invalid URL format." };
    }

    if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
        return { ok: false, error: `URL scheme '${parsed.protocol}' is not allowed. Use http or https.` };
    }

    const hostname = parsed.hostname.toLowerCase();
    if (!hostname) {
        return { ok: false, error: "URL must include a hostname." };
    }

    if (BLOCKED_HOSTS.has(hostname)) {
        return { ok: false, error: `Access to '${hostname}' is blocked.` };
    }

    if (isPrivateIp(hostname)) {
        return { ok: false, error: `Access to private IP '${hostname}' is blocked.` };
    }

    return { ok: true };
}

/**
 * Hono middleware that validates the `url` query parameter.
 * @param {import('hono').Context} c
 * @param {Function} next
 */
export async function ssrfMiddleware(c, next) {
    const url = c.req.query("url");
    if (!url) return await next();

    const result = validateUrl(url);
    if (!result.ok) {
        return c.json({ error: result.error }, 403);
    }

    // Store the normalized URL so routes don't have to normalize again
    c.set("normalizedUrl", normalizeUrl(url));

    await next();
}
