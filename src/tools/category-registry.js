/**
 * @file Category registry for the Adawaty tool catalogue.
 * @module tools/category-registry
 */

import { createCategoryManifest } from './category-manifest.js';

class CategoryRegistry {
    constructor() {
        this.categories = new Map();
        this.revision = 0;
    }

    register(definition) {
        const category = createCategoryManifest(definition);
        if (this.categories.has(category.id)) {
            throw new Error(`Category "${category.id}" is already registered.`);
        }
        this.categories.set(category.id, category);
        this.revision += 1;
        return category;
    }

    registerMany(definitions) {
        const categories = [...definitions].map(createCategoryManifest);
        const seen = new Set(this.categories.keys());
        for (const category of categories) {
            if (seen.has(category.id)) {
                throw new Error(`Category "${category.id}" is already registered.`);
            }
            seen.add(category.id);
        }
        for (const category of categories) this.categories.set(category.id, category);
        if (categories.length > 0) this.revision += 1;
        return Object.freeze(categories);
    }

    get(id) { return this.categories.get(String(id)) ?? null; }
    has(id) { return this.categories.has(String(id)); }

    getAll(options = {}) {
        const includeHidden = options.includeHidden ?? false;
        return Object.freeze([...this.categories.values()]
            .filter((category) => includeHidden || !category.hidden)
            .sort((left, right) => left.order !== right.order ? left.order - right.order : left.id.localeCompare(right.id)));
    }

    getFeatured() {
        return Object.freeze(this.getAll().filter((category) => category.featured));
    }

    unregister(id) {
        const deleted = this.categories.delete(String(id));
        if (deleted) this.revision += 1;
        return deleted;
    }

    clear() {
        if (this.categories.size === 0) return;
        this.categories.clear();
        this.revision += 1;
    }

    count() { return this.categories.size; }
    getRevision() { return this.revision; }
}

export { CategoryRegistry };

// END OF FILE
