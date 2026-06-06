/**
 * Parse pagination query parameters.
 * @param {Object} query - The request query object.
 * @returns {Object} { page, size } parsed as integers.
 */
export function parsePagination(query) {
    const page = Math.max(1, parseInt(query?.page, 10) || 1);
    const size = Math.max(1, parseInt(query?.size || query?.limit, 10) || 10);
    return { page, size };
}

/**
 * Parse pagination and allowed filters from query parameters.
 * @param {Object} query - The request query object.
 * @param {Object} options - Filtering options.
 * @param {string[]} options.allowedFilters - The keys allowed to be extracted as filters.
 * @returns {Object} { page, size, filter }
 */
export function parsePaginationAndFilters(query, options = {}) {
    const { page, size } = parsePagination(query);
    const allowedFilters = options.allowedFilters || [];
    const filter = {};

    if (query && typeof query === 'object') {
        Object.keys(query).forEach(key => {
            if (allowedFilters.includes(key) && query[key] !== undefined && query[key] !== null) {
                filter[key] = query[key];
            }
        });
    }

    return { page, size, filter };
}
