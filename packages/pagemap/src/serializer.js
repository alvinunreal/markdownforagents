/**
 * PageMap serialization: agent markdown and structured JSON.
 */

/**
 * Strip YAML frontmatter from start of string.
 * @param {string} content
 * @returns {string}
 */
function stripFrontmatter(content) {
    if (!content) return "";
    return content.replace(/^---\s*[\s\S]*?---\s*/, "").trim();
}

/**
 * Serialize PageMap to agent-friendly markdown with YAML frontmatter.
 *
 * @param {import('./types.js').PageMap} pageMap
 * @returns {string}
 */
export function toAgentMarkdown(pageMap) {
    const lines = [];
    const content = stripFrontmatter(pageMap.content);

    // YAML frontmatter
    lines.push("---");
    lines.push(`url: ${pageMap.url}`);
    if (pageMap.title) lines.push(`title: "${pageMap.title.replace(/"/g, '\\"')}"`);
    lines.push(`type: ${pageMap.pageType}`);
    if (pageMap.stats.tokenCount) lines.push(`tokens: ${pageMap.stats.tokenCount}`);
    lines.push("---");
    lines.push("");

    // Main content
    if (content) {
        lines.push(content);
        lines.push("");
    }

    // Actions section (interactables)
    if (pageMap.interactables.length > 0) {
        lines.push("## Actions");
        lines.push("");
        for (const item of pageMap.interactables) {
            let line = `[${item.ref}] ${item.role}: ${item.name} (${item.affordance})`;
            if (item.value) line += ` value="${item.value}"`;
            if (item.options && item.options.length > 0) {
                const opts = item.options.slice(0, 8).join(", ");
                const extra = item.options.length > 8 ? ` ...+${item.options.length - 8}` : "";
                line += ` options=[${opts}${extra}]`;
            }
            lines.push(line);
        }
        lines.push("");
    }

    // Images
    if (pageMap.images.length > 0) {
        lines.push("## Images");
        lines.push("");
        for (const img of pageMap.images.slice(0, 5)) {
            lines.push(`![](${img})`);
        }
        lines.push("");
    }

    return lines.join("\n");
}

/**
 * Serialize PageMap to structured JSON.
 * @param {import('./types.js').PageMap} pageMap
 * @returns {Object}
 */
export function toJson(pageMap) {
    return {
        url: pageMap.url,
        title: pageMap.title,
        page_type: pageMap.pageType,
        content: stripFrontmatter(pageMap.content),
        interactables: pageMap.interactables.map((i) => ({
            ref: i.ref,
            role: i.role,
            name: i.name,
            affordance: i.affordance,
            ...(i.value ? { value: i.value } : {}),
            ...(i.options && i.options.length > 0 ? { options: i.options } : {}),
        })),
        images: pageMap.images,
        metadata: pageMap.metadata,
        stats: pageMap.stats,
    };
}
