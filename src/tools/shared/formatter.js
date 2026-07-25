/**
 * ============================================================================
 * Adawaty
 * Formatter
 * ----------------------------------------------------------------------------
 * Shared formatting utilities.
 * ============================================================================
 */

class Formatter {

    /**
     * Formats a number.
     *
     * @param {number|string} value
     * @param {string} locale
     * @returns {string}
     */
    static number(
        value,
        locale = 'en'
    ) {

        return new Intl.NumberFormat(
            locale
        ).format(
            Number(value)
        );

    }

    /**
     * Formats a currency.
     *
     * @param {number|string} value
     * @param {string} currency
     * @param {string} locale
     * @returns {string}
     */
    static currency(
        value,
        currency = 'USD',
        locale = 'en'
    ) {

        return new Intl.NumberFormat(
            locale,
            {
                style: 'currency',
                currency
            }
        ).format(
            Number(value)
        );

    }

    /**
     * Formats a percentage.
     *
     * @param {number|string} value
     * @param {string} locale
     * @returns {string}
     */
    static percent(
        value,
        locale = 'en'
    ) {

        return new Intl.NumberFormat(
            locale,
            {
                style: 'percent'
            }
        ).format(
            Number(value)
        );

    }

    /**
     * Formats a decimal number.
     *
     * @param {number|string} value
     * @param {number} digits
     * @returns {string}
     */
    static decimal(
        value,
        digits = 2
    ) {

        return Number(value)
            .toFixed(digits);

    }

    /**
     * Adds thousand separators.
     *
     * @param {number|string} value
     * @param {string} locale
     * @returns {string}
     */
    static thousands(
        value,
        locale = 'en'
    ) {

        return Formatter.number(
            value,
            locale
        );

    }

    /**
     * Formats a number with
     * custom fraction digits.
     *
     * @param {number|string} value
     * @param {number} min
     * @param {number} max
     * @param {string} locale
     * @returns {string}
     */
    static fixed(
        value,
        min = 0,
        max = 2,
        locale = 'en'
    ) {

        return new Intl.NumberFormat(
            locale,
            {
                minimumFractionDigits: min,
                maximumFractionDigits: max
            }
        ).format(
            Number(value)
        );

    }

    /**
     * Formats a signed number.
     *
     * @param {number|string} value
     * @param {string} locale
     * @returns {string}
     */
    static signed(
        value,
        locale = 'en'
    ) {

        return new Intl.NumberFormat(
            locale,
            {
                signDisplay: 'always'
            }
        ).format(
            Number(value)
        );

    }

    /**
     * Formats a date.
     *
     * @param {Date|string|number} value
     * @param {string} locale
     * @returns {string}
     */
    static date(
        value,
        locale = 'en'
    ) {

        return new Intl.DateTimeFormat(
            locale,
            {
                dateStyle: 'medium'
            }
        ).format(
            new Date(value)
        );

    }

    /**
     * Formats a time.
     *
     * @param {Date|string|number} value
     * @param {string} locale
     * @returns {string}
     */
    static time(
        value,
        locale = 'en'
    ) {

        return new Intl.DateTimeFormat(
            locale,
            {
                timeStyle: 'short'
            }
        ).format(
            new Date(value)
        );

    }

    /**
     * Formats date and time.
     *
     * @param {Date|string|number} value
     * @param {string} locale
     * @returns {string}
     */
    static dateTime(
        value,
        locale = 'en'
    ) {

        return new Intl.DateTimeFormat(
            locale,
            {
                dateStyle: 'medium',
                timeStyle: 'short'
            }
        ).format(
            new Date(value)
        );

    }

    /**
     * Formats a duration.
     *
     * @param {number} seconds
     * @returns {string}
     */
    static duration(seconds) {

        const total =
            Math.max(
                0,
                Number(seconds)
            );

        const hours =
            Math.floor(
                total / 3600
            );

        const minutes =
            Math.floor(
                (total % 3600) / 60
            );

        const secs =
            total % 60;

        return [

            hours,

            minutes,

            secs

        ]
            .map(
                value =>
                    String(value)
                        .padStart(
                            2,
                            '0'
                        )
            )
            .join(':');

    }

    /**
     * Formats relative time.
     *
     * @param {number} value
     * @param {Intl.RelativeTimeFormatUnit} unit
     * @param {string} locale
     * @returns {string}
     */
    static relativeTime(
        value,
        unit = 'day',
        locale = 'en'
    ) {

        return new Intl.RelativeTimeFormat(
            locale,
            {
                numeric: 'auto'
            }
        ).format(
            value,
            unit
        );

    }

    /**
     * Returns the localized weekday.
     *
     * @param {Date|string|number} value
     * @param {string} locale
     * @returns {string}
     */
    static weekday(
        value,
        locale = 'en'
    ) {

        return new Intl.DateTimeFormat(
            locale,
            {
                weekday: 'long'
            }
        ).format(
            new Date(value)
        );

    }

    /**
     * Returns the localized month.
     *
     * @param {Date|string|number} value
     * @param {string} locale
     * @returns {string}
     */
    static month(
        value,
        locale = 'en'
    ) {

        return new Intl.DateTimeFormat(
            locale,
            {
                month: 'long'
            }
        ).format(
            new Date(value)
        );

    }

    /**
     * Returns the localized year.
     *
     * @param {Date|string|number} value
     * @param {string} locale
     * @returns {string}
     */
    static year(
        value,
        locale = 'en'
    ) {

        return new Intl.DateTimeFormat(
            locale,
            {
                year: 'numeric'
            }
        ).format(
            new Date(value)
        );

    }
	
	    /**
     * Formats a file size.
     *
     * @param {number} bytes
     * @param {string} locale
     * @returns {string}
     */
    static fileSize(
        bytes,
        locale = 'en'
    ) {

        const units = [
            'B',
            'KB',
            'MB',
            'GB',
            'TB',
            'PB'
        ];

        let value = Number(bytes);
        let index = 0;

        while (
            value >= 1024 &&
            index < units.length - 1
        ) {

            value /= 1024;
            index++;

        }

        return `${Formatter.fixed(
            value,
            0,
            2,
            locale
        )} ${units[index]}`;

    }

    /**
     * Formats a compact number.
     *
     * @param {number|string} value
     * @param {string} locale
     * @returns {string}
     */
    static compactNumber(
        value,
        locale = 'en'
    ) {

        return new Intl.NumberFormat(
            locale,
            {
                notation: 'compact'
            }
        ).format(
            Number(value)
        );

    }

    /**
     * Returns an ordinal representation.
     *
     * @param {number} value
     * @returns {string}
     */
    static ordinal(value) {

        const number = Number(value);

        const mod100 = number % 100;

        if (
            mod100 >= 11 &&
            mod100 <= 13
        ) {

            return `${number}th`;

        }

        switch (number % 10) {

            case 1:
                return `${number}st`;

            case 2:
                return `${number}nd`;

            case 3:
                return `${number}rd`;

            default:
                return `${number}th`;

        }

    }

    /**
     * Capitalizes the first character.
     *
     * @param {string} value
     * @returns {string}
     */
    static capitalize(value) {

        const text = String(value);

        return text.charAt(0)
            .toUpperCase() +
            text.slice(1);

    }

    /**
     * Converts text to title case.
     *
     * @param {string} value
     * @returns {string}
     */
    static titleCase(value) {

        return String(value)
            .split(/\s+/)
            .map(
                word =>
                    Formatter.capitalize(
                        word
                    )
            )
            .join(' ');

    }

    /**
     * Wraps text in RTL direction.
     *
     * @param {string} value
     * @returns {string}
     */
    static rtl(value) {

        return `\u202B${value}\u202C`;

    }

    /**
     * Wraps text in LTR direction.
     *
     * @param {string} value
     * @returns {string}
     */
    static ltr(value) {

        return `\u202A${value}\u202C`;

    }

    /**
     * Resolves the effective locale.
     *
     * @param {string} locale
     * @returns {string}
     */
    static locale(locale = 'en') {

        return Intl.NumberFormat
            .supportedLocalesOf(
                [locale]
            )[0] ?? 'en';

    }
	
	    /**
     * Returns whether the locale is RTL.
     *
     * @param {string} locale
     * @returns {boolean}
     */
    static isRTL(locale = 'en') {

        return /^(ar|fa|he|ur)/i.test(
            Formatter.locale(locale)
        );

    }

    /**
     * Normalizes whitespace.
     *
     * @param {string} value
     * @returns {string}
     */
    static normalizeWhitespace(value) {

        return String(value)
            .replace(/\s+/g, ' ')
            .trim();

    }

    /**
     * Truncates text.
     *
     * @param {string} value
     * @param {number} length
     * @param {string} suffix
     * @returns {string}
     */
    static truncate(
        value,
        length = 100,
        suffix = '…'
    ) {

        const text = String(value);

        if (text.length <= length) {

            return text;

        }

        return text.slice(
            0,
            length
        ) + suffix;

    }

}

/**
 * Freeze helper methods.
 */
Object.freeze(
    Formatter
);

export default Formatter;

// END OF FILE
