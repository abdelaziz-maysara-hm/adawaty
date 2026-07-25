/**
 * ============================================================================
 * Adawaty
 * Clipboard Service
 * ----------------------------------------------------------------------------
 * Handles clipboard operations with graceful fallback.
 * ============================================================================
 */

import eventBus from '../core/event-bus.js';

class ClipboardService {

    /**
     * Copies text to the clipboard.
     *
     * @param {string} text
     * @returns {Promise<boolean>}
     */
    async copy(text) {

        if (typeof text !== 'string') {
            return false;
        }

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            try {

                await navigator.clipboard.writeText(
                    text
                );

                eventBus.emit(
                    'clipboard:copied',
                    {
                        text
                    }
                );

                return true;

            } catch (error) {

                console.error(
                    '[Clipboard] Clipboard API failed.',
                    error
                );

            }

        }

        return this.copyFallback(text);

    }

    /**
     * Copies text using a fallback method.
     *
     * @private
     *
     * @param {string} text
     * @returns {boolean}
     */
    copyFallback(text) {

        const textarea =
            document.createElement(
                'textarea'
            );

        textarea.value = text;

        textarea.setAttribute(
            'readonly',
            ''
        );

        textarea.style.position = 'fixed';

        textarea.style.opacity = '0';

        document.body.appendChild(
            textarea
        );

        textarea.select();

        let success = false;

        try {

            success = document.execCommand(
                'copy'
            );

        } catch (error) {

            console.error(
                '[Clipboard] Fallback failed.',
                error
            );

        }

        document.body.removeChild(
            textarea
        );

        if (success) {

            eventBus.emit(
                'clipboard:copied',
                {
                    text
                }
            );

        }

        return success;

    }

    /**
     * Reads text from the clipboard.
     *
     * @returns {Promise<string>}
     */
    async read() {

        if (
            !navigator.clipboard ||
            !window.isSecureContext
        ) {

            throw new Error(
                'Clipboard API is unavailable.'
            );

        }

        return navigator.clipboard.readText();

    }
	
	    /**
     * Returns whether clipboard operations are supported.
     *
     * @returns {boolean}
     */
    isSupported() {

        return (
            window.isSecureContext &&
            typeof navigator.clipboard !== 'undefined'
        );

    }

    /**
     * Attempts to clear the clipboard.
     *
     * Browsers may deny this operation depending on
     * permissions and security policies.
     *
     * @returns {Promise<boolean>}
     */
    async clear() {

        if (!this.isSupported()) {
            return false;
        }

        try {

            await navigator.clipboard.writeText('');

            eventBus.emit(
                'clipboard:cleared'
            );

            return true;

        } catch (error) {

            console.error(
                '[Clipboard] Failed to clear clipboard.',
                error
            );

            return false;

        }

    }

    /**
     * Releases resources.
     *
     * @returns {void}
     */
    destroy() {

        // Reserved for future cleanup.

    }

}

const clipboard = new ClipboardService();

export default clipboard;