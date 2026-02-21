/**
 * @typedef {Object} Interactable
 * @property {number} ref - Sequential number for agent reference
 * @property {string} role - button, link, searchbox, combobox, checkbox, etc.
 * @property {string} name - Accessibility name
 * @property {string} affordance - click, type, select, toggle
 * @property {string} region - header, main, footer, navigation, complementary, unknown
 * @property {number} tier - Detection tier (1-4)
 * @property {string} [value] - Current value (for inputs)
 * @property {string[]} [options] - For selects/comboboxes
 */

/**
 * @typedef {Object} PageMap
 * @property {string} url
 * @property {string} title
 * @property {string} pageType - product_detail, search_results, article, listing, unknown
 * @property {Interactable[]} interactables
 * @property {string} content - Markdown content (from AI.toMarkdown or converter)
 * @property {string[]} images - Content image URLs
 * @property {Object} metadata - Structured metadata (JSON-LD, OG, Twitter, etc.)
 * @property {Object} stats - Generation stats
 * @property {number} stats.tokenCount
 * @property {number} stats.generationMs
 * @property {string} stats.conversionStrategy
 * @property {string} stats.sourceFormat
 */

/**
 * Create an Interactable object.
 * @param {Partial<Interactable> & { ref: number, role: string, name: string, affordance: string }} props
 * @returns {Interactable}
 */
export function createInteractable(props) {
    return {
        ref: props.ref,
        role: props.role,
        name: props.name,
        affordance: props.affordance,
        region: props.region || "main",
        tier: props.tier || 2,
        value: props.value || "",
        options: props.options || [],
    };
}

/**
 * Create a PageMap object.
 * @param {Partial<PageMap> & { url: string, title: string }} props
 * @returns {PageMap}
 */
export function createPageMap(props) {
    return {
        url: props.url,
        title: props.title,
        pageType: props.pageType || "unknown",
        interactables: props.interactables || [],
        content: props.content || "",
        images: props.images || [],
        metadata: props.metadata || {},
        stats: props.stats || {
            tokenCount: 0,
            generationMs: 0,
            conversionStrategy: "unknown",
            sourceFormat: "text/html",
        },
    };
}
