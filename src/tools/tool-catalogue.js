/**
 * @file Read-only catalogue facade combining tools and categories.
 * @module tools/tool-catalogue
 */

import { resolveLocalizedText } from './tool-manifest.js';

class ToolCatalogue {
    constructor(options) {
        if (!options?.toolRegistry || !options?.categoryRegistry) {
            throw new TypeError('ToolCatalogue requires toolRegistry and categoryRegistry.');
        }
        this.toolRegistry = options.toolRegistry;
        this.categoryRegistry = options.categoryRegistry;
        this.cachedRevisionKey = '';
        this.cachedCatalogue = Object.freeze([]);
    }

    getCatalogue(options = {}) {
        const includeEmpty = options.includeEmpty ?? false;
        const includeHidden = options.includeHidden ?? false;
        const revisionKey = this.createRevisionKey(includeEmpty, includeHidden);
        if (revisionKey === this.cachedRevisionKey) return this.cachedCatalogue;

        const result = this.categoryRegistry.getAll({ includeHidden })
            .map((category) => {
                const tools = this.toolRegistry.getToolsByCategory(category.id);
                return Object.freeze({ ...category, tools, toolCount: tools.length });
            })
            .filter((category) => includeEmpty || category.toolCount > 0);

        this.cachedRevisionKey = revisionKey;
        this.cachedCatalogue = Object.freeze(result);
        return this.cachedCatalogue;
    }

    getCategory(categoryId) {
        const category = this.categoryRegistry.get(categoryId);
        if (!category) return null;
        const tools = this.toolRegistry.getToolsByCategory(category.id);
        return Object.freeze({ ...category, tools, toolCount: tools.length });
    }

    getOrphanTools() {
        return Object.freeze(this.toolRegistry.filter((tool) => !this.categoryRegistry.has(tool.category)));
    }

    getNavigation(locale = 'ar') {
        return Object.freeze(this.getCatalogue().map((category) => Object.freeze({
            id: category.id,
            label: resolveLocalizedText(category.name, locale),
            route: category.route,
            icon: category.icon,
            toolCount: category.toolCount,
        })).filter((item) => item.label));
    }

    createRevisionKey(includeEmpty, includeHidden) {
        return [
            this.toolRegistry.getRevision(),
            this.categoryRegistry.getRevision(),
            Number(includeEmpty),
            Number(includeHidden),
        ].join(':');
    }
}

export { ToolCatalogue };

// END OF FILE
