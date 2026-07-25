/**
 * ============================================================================
 * Adawaty
 * SEO Service
 * ----------------------------------------------------------------------------
 * Handles page metadata.
 * Supports:
 * - title
 * - description
 * - keywords
 * - canonical
 * - robots
 * - Open Graph
 * - Twitter Cards
 * ============================================================================
 */

import eventBus from '../core/event-bus.js';

const DEFAULTS = Object.freeze({
    title: 'Adawaty',
    description: '',
    keywords: '',
    robots: 'index,follow'
});

class SeoService {

    constructor() {

        /**
         * Current SEO state.
         *
         * @type {Object}
         */
        this.state = {
            ...DEFAULTS
        };

    }

    /**
     * Initializes SEO service.
     *
     * @returns {void}
     */
    init() {

        this.apply(this.state);

    }

    /**
     * Applies SEO metadata.
     *
     * @param {Object} metadata
     * @returns {void}
     */
    apply(metadata = {}) {

        this.state = {
            ...this.state,
            ...metadata
        };

        this.setTitle(this.state.title);

        this.setMeta(
            'description',
            this.state.description
        );

        this.setMeta(
            'keywords',
            this.state.keywords
        );

        this.setMeta(
            'robots',
            this.state.robots
        );

        eventBus.emit(
            'seo:updated',
            {
                ...this.state
            }
        );

    }

    /**
     * Sets document title.
     *
     * @param {string} title
     */
    setTitle(title) {

        document.title = title;

    }

    /**
     * Sets or creates a meta tag.
     *
     * @param {string} name
     * @param {string} content
     */
    setMeta(name, content) {

        let tag = document.querySelector(
            `meta[name="${name}"]`
        );

        if (!tag) {

            tag = document.createElement('meta');

            tag.setAttribute(
                'name',
                name
            );

            document.head.appendChild(tag);

        }

        tag.setAttribute(
            'content',
            content ?? ''
        );

    }
	
	    /**
     * Sets the canonical URL.
     *
     * @param {string} url
     * @returns {void}
     */
    setCanonical(url) {

        let link = document.querySelector(
            'link[rel="canonical"]'
        );

        if (!link) {

            link = document.createElement('link');

            link.setAttribute(
                'rel',
                'canonical'
            );

            document.head.appendChild(link);

        }

        link.setAttribute(
            'href',
            url
        );

    }

    /**
     * Sets robots meta tag.
     *
     * @param {string} value
     * @returns {void}
     */
    setRobots(value) {

        this.setMeta(
            'robots',
            value
        );

    }

    /**
     * Sets or creates a meta property tag.
     *
     * @param {string} property
     * @param {string} content
     * @returns {void}
     */
    setMetaProperty(property, content) {

        let tag = document.querySelector(
            `meta[property="${property}"]`
        );

        if (!tag) {

            tag = document.createElement('meta');

            tag.setAttribute(
                'property',
                property
            );

            document.head.appendChild(tag);

        }

        tag.setAttribute(
            'content',
            content ?? ''
        );

    }

    /**
     * Updates Open Graph metadata.
     *
     * @param {Object} metadata
     * @returns {void}
     */
    setOpenGraph(metadata = {}) {

        const {
            title = this.state.title,
            description = this.state.description,
            url = window.location.href,
            image = '',
            type = 'website'
        } = metadata;

        this.setMetaProperty(
            'og:title',
            title
        );

        this.setMetaProperty(
            'og:description',
            description
        );

        this.setMetaProperty(
            'og:url',
            url
        );

        this.setMetaProperty(
            'og:image',
            image
        );

        this.setMetaProperty(
            'og:type',
            type
        );

    }

    /**
     * Updates Twitter Card metadata.
     *
     * @param {Object} metadata
     * @returns {void}
     */
    setTwitterCard(metadata = {}) {

        const {
            card = 'summary_large_image',
            title = this.state.title,
            description = this.state.description,
            image = ''
        } = metadata;

        this.setMeta(
            'twitter:card',
            card
        );

        this.setMeta(
            'twitter:title',
            title
        );

        this.setMeta(
            'twitter:description',
            description
        );

        this.setMeta(
            'twitter:image',
            image
        );

    }
	
	    /**
     * Returns current SEO state.
     *
     * @returns {Object}
     */
    getState() {

        return {
            ...this.state
        };

    }

    /**
     * Resets SEO metadata to defaults.
     *
     * @returns {void}
     */
    reset() {

        this.state = {
            ...DEFAULTS
        };

        this.apply(this.state);

    }

    /**
     * Destroys the service.
     *
     * @returns {void}
     */
    destroy() {

        this.reset();

    }

}

const seo = new SeoService();

export default seo;