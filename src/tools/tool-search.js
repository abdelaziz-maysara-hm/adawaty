/**
 * ============================================================================
 * Adawaty
 * Tool Search
 * ----------------------------------------------------------------------------
 * High-level search service for registered tools.
 * ============================================================================
 */

import registry from './tool-registry.js';

class ToolSearch {

    /**
     * Searches for tools.
     *
     * @param {string} query
     * @returns {Object[]}
     */
    search(query = '') {

        return this.rank(

            registry.search(query),

            query

        );

    }

    /**
     * Returns search suggestions.
     *
     * @param {string} query
     * @param {number} [limit=5]
     * @returns {string[]}
     */
    suggestions(
        query,
        limit = 5
    ) {

        if (!query?.trim()) {

            return [];

        }

        return this.search(query)
            .slice(0, limit)
            .map(tool => tool.name);

    }

    /**
     * Ranks search results.
     *
     * @private
     * @param {Object[]} tools
     * @param {string} query
     * @returns {Object[]}
     */
    rank(
        tools,
        query
    ) {

        if (!query?.trim()) {

            return tools;

        }

        const normalized =
            query
                .trim()
                .toLowerCase();

        return [...tools].sort(
            (a, b) =>

                this.score(
                    b,
                    normalized
                ) -

                this.score(
                    a,
                    normalized
                )

        );

    }

    /**
     * Calculates relevance score.
     *
     * @private
     * @param {Object} tool
     * @param {string} query
     * @returns {number}
     */
    score(
        tool,
        query
    ) {

        let score = 0;

        const name =
            (tool.name ?? '')
                .toLowerCase();

        if (name === query) {

            score += 100;

        } else if (

            name.startsWith(query)

        ) {

            score += 50;

        } else if (

            name.includes(query)

        ) {

            score += 25;

        }

        return score;

    }
	
	    /**
     * Calculates the final relevance score.
     *
     * @private
     * @param {Object} tool
     * @param {string} query
     * @returns {number}
     */
    score(
        tool,
        query
    ) {

        let score = 0;

        const name =
            (tool.name ?? '')
                .toLowerCase();

        const description =
            (tool.description ?? '')
                .toLowerCase();

        const category =
            (tool.category ?? '')
                .toLowerCase();

        const keywords =
            (tool.keywords ?? [])
                .join(' ')
                .toLowerCase();

        const tags =
            (tool.tags ?? [])
                .join(' ')
                .toLowerCase();

        if (name === query) {

            score += 100;

        } else if (name.startsWith(query)) {

            score += 50;

        } else if (name.includes(query)) {

            score += 25;

        }

        if (description.includes(query)) {

            score += 15;

        }

        if (keywords.includes(query)) {

            score += 20;

        }

        if (tags.includes(query)) {

            score += 20;

        }

        if (category === query) {

            score += 10;

        }

        return score;

    }

    /**
     * Finds tools by category.
     *
     * @param {string} category
     * @returns {Object[]}
     */
    findByCategory(category) {

        if (!category?.trim()) {

            return [];

        }

        const normalized =
            category
                .trim()
                .toLowerCase();

        return registry
            .getAll()
            .filter(
                tool =>
                    (tool.category ?? '')
                        .toLowerCase() === normalized
            );

    }

    /**
     * Returns related tools.
     *
     * @param {Object} tool
     * @param {number} [limit=5]
     * @returns {Object[]}
     */
    findRelated(
        tool,
        limit = 5
    ) {

        if (!tool) {

            return [];

        }

        return registry
            .getAll()
            .filter(
                item =>
                    item.id !== tool.id &&
                    item.category === tool.category
            )
            .slice(0, limit);

    }

    /**
     * Returns the number of search results.
     *
     * @param {string} query
     * @returns {number}
     */
    count(query) {

        return this.search(query).length;

    }
	
	    /**
     * Clears any cached search data.
     *
     * Reserved for future search indexing.
     *
     * @returns {void}
     */
    clearCache() {

        // No cache currently implemented.

    }

    /**
     * Destroys the search service.
     *
     * @returns {void}
     */
    destroy() {

        this.clearCache();

    }

}

const search = new ToolSearch();

export default search;

export {
    ToolSearch
};