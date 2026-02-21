/**
 * Page type detection from URL patterns.
 * Ported from Retio-pagemap page_map_builder.py
 */

const PAGE_TYPE_PATTERNS = {
    product_detail: [
        "/vp/products/", "/products/", "/goods/", "/catalog/",
        "/item/", "/product/", "/product.", "/dp/",
        "/Product/", "/t/", "/productDetail", "/good",
    ],
    search_results: [
        "/search", "?q=", "?query=", "?keyword=",
        "/browse", "?searchTerm=", "/w?q=",
    ],
    article: [
        "/article/", "/articles/", "/news/",
        "/wiki/", "/blog/", "/post/",
    ],
    listing: [
        "/list", "/ranking", "/best", "/category/",
        "/w/", "/men/", "/women/", "/man/", "/woman/",
    ],
};

/**
 * Detect page type from URL patterns.
 * @param {string} url
 * @returns {string}
 */
export function detectPageType(url) {
    const lower = url.toLowerCase();
    for (const [pageType, patterns] of Object.entries(PAGE_TYPE_PATTERNS)) {
        if (patterns.some((p) => lower.includes(p))) {
            return pageType;
        }
    }
    return "unknown";
}
