/**
 * ============================================================================
 * Adawaty
 * Tool Filters
 * ----------------------------------------------------------------------------
 * Chainable filtering service for tool collections.
 * ============================================================================
 */

class ToolFilters {

    constructor() {

        this.reset();

    }

    /**
     * Resets all filter criteria.
     *
     * @returns {ToolFilters}
     */
    reset() {

        this.criteria = {
            category: null,
            language: null,
            featured: null,
            tags: [],
            keywords: []
        };

        return this;

    }

    /**
     * Filters by category.
     *
     * @param {string} value
     * @returns {ToolFilters}
     */
    category(value) {

        this.criteria.category = value;

        return this;

    }

    /**
     * Filters by language.
     *
     * @param {string} value
     * @returns {ToolFilters}
     */
    language(value) {

        this.criteria.language = value;

        return this;

    }

    /**
     * Filters by featured state.
     *
     * @param {boolean} value
     * @returns {ToolFilters}
     */
    featured(value = true) {

        this.criteria.featured = value;

        return this;

    }

    /**
     * Filters by tags.
     *
     * @param {string[]} values
     * @returns {ToolFilters}
     */
    tags(values = []) {

        this.criteria.tags = [...values];

        return this;

    }

    /**
     * Filters by keywords.
     *
     * @param {string[]} values
     * @returns {ToolFilters}
     */
    keywords(values = []) {

        this.criteria.keywords = [...values];

        return this;

    }
	
	    /**
     * Applies all configured filters.
     *
     * @param {Object[]} tools
     * @returns {Object[]}
     */
    apply(tools = []) {

        let results = [...tools];

        results = this.filterCategory(results);

        results = this.filterLanguage(results);

        results = this.filterFeatured(results);

        results = this.filterTags(results);

        results = this.filterKeywords(results);

        return results;

    }

    /**
     * Filters by category.
     *
     * @private
     * @param {Object[]} tools
     * @returns {Object[]}
     */
    filterCategory(tools) {

        if (!this.criteria.category) {

            return tools;

        }

        return tools.filter(
            tool =>
                tool.category ===
                this.criteria.category
        );

    }

    /**
     * Filters by language.
     *
     * @private
     * @param {Object[]} tools
     * @returns {Object[]}
     */
    filterLanguage(tools) {

        if (!this.criteria.language) {

            return tools;

        }

        return tools.filter(
            tool =>
                tool.language ===
                this.criteria.language
        );

    }

    /**
     * Filters by featured flag.
     *
     * @private
     * @param {Object[]} tools
     * @returns {Object[]}
     */
    filterFeatured(tools) {

        if (
            this.criteria.featured === null
        ) {

            return tools;

        }

        return tools.filter(
            tool =>
                Boolean(tool.featured) ===
                this.criteria.featured
        );

    }

    /**
     * Filters by tags.
     *
     * @private
     * @param {Object[]} tools
     * @returns {Object[]}
     */
    filterTags(tools) {

        if (
            this.criteria.tags.length === 0
        ) {

            return tools;

        }

        return tools.filter(tool => {

            const tags =
                tool.tags ?? [];

            return this.criteria.tags.every(
                tag =>
                    tags.includes(tag)
            );

        });

    }

    /**
     * Filters by keywords.
     *
     * @private
     * @param {Object[]} tools
     * @returns {Object[]}
     */
    filterKeywords(tools) {

        if (
            this.criteria.keywords.length === 0
        ) {

            return tools;

        }

        return tools.filter(tool => {

            const keywords =
                tool.keywords ?? [];

            return this.criteria.keywords.every(
                keyword =>
                    keywords.includes(keyword)
            );

        });

    }

    /**
     * Returns whether any filters
     * are currently active.
     *
     * @returns {boolean}
     */
    hasActiveFilters() {

        return (
            this.criteria.category !== null ||
            this.criteria.language !== null ||
            this.criteria.featured !== null ||
            this.criteria.tags.length > 0 ||
            this.criteria.keywords.length > 0
        );

    }
	
	    /**
     * Sorts tools.
     *
     * @param {Object[]} tools
     * @param {string} [by='name']
     * @returns {Object[]}
     */
    sort(
        tools,
        by = 'name'
    ) {

        const sorted = [...tools];

        switch (by) {

            case 'order':

                sorted.sort(
                    (a, b) =>
                        (a.order ?? Number.MAX_SAFE_INTEGER) -
                        (b.order ?? Number.MAX_SAFE_INTEGER)
                );

                break;

            case 'featured':

                sorted.sort(
                    (a, b) =>
                        Number(Boolean(b.featured)) -
                        Number(Boolean(a.featured))
                );

                break;

            case 'name':

            default:

                sorted.sort(
                    (a, b) =>
                        (a.name ?? '').localeCompare(
                            b.name ?? '',
                            undefined,
                            {
                                sensitivity: 'base'
                            }
                        )
                );

        }

        return sorted;

    }

    /**
     * Clears all filter criteria.
     *
     * @returns {ToolFilters}
     */
    clear() {

        return this.reset();

    }

    /**
     * Destroys the filter service.
     *
     * @returns {void}
     */
    destroy() {

        this.reset();

    }

}

const filters =
    new ToolFilters();

export default filters;

export {
    ToolFilters
};