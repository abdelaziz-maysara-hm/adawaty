/**
 * ============================================================================
 * Adawaty
 * Tool Validator
 * ----------------------------------------------------------------------------
 * Validates tool definitions before registration or loading.
 * ============================================================================
 */

const REQUIRED_FIELDS = [
    'id',
    'name',
    'category',
    'loader'
];

class ToolValidator {

    /**
     * Validates a tool definition.
     *
     * @param {Object} definition
     * @returns {{valid:boolean,errors:string[]}}
     */
    validate(definition) {

        const errors = [];

        if (
            !definition ||
            typeof definition !== 'object'
        ) {

            return {
                valid: false,
                errors: [
                    'Tool definition must be an object.'
                ]
            };

        }

        for (
            const field of REQUIRED_FIELDS
        ) {

            if (
                definition[field] === undefined ||
                definition[field] === null
            ) {

                errors.push(
                    `Missing required field "${field}".`
                );

            }

        }

        this.validateId(
            definition.id,
            errors
        );

        this.validateName(
            definition.name,
            errors
        );

        this.validateCategory(
            definition.category,
            errors
        );

        this.validateLoader(
            definition.loader,
            errors
        );

        this.validateKeywords(
            definition.keywords,
            errors
        );

        this.validateTags(
            definition.tags,
            errors
        );

        this.validateDescription(
            definition.description,
            errors
        );

        return {

            valid:
                errors.length === 0,

            errors

        };

    }

    /**
     * Validates tool id.
     *
     * @param {string} id
     * @param {string[]} errors
     * @returns {void}
     */
    validateId(
        id,
        errors
    ) {

        if (
            typeof id !== 'string'
        ) {

            errors.push(
                'Tool id must be a string.'
            );

            return;

        }

        if (
            id.trim().length === 0
        ) {

            errors.push(
                'Tool id cannot be empty.'
            );

        }

        if (
            !/^[a-z0-9-]+$/.test(id)
        ) {

            errors.push(
                'Tool id may only contain lowercase letters, numbers and hyphens.'
            );

        }

    }

    /**
     * Validates tool name.
     *
     * @param {string} name
     * @param {string[]} errors
     * @returns {void}
     */
    validateName(
        name,
        errors
    ) {

        if (
            typeof name !== 'string'
        ) {

            errors.push(
                'Tool name must be a string.'
            );

            return;

        }

        if (
            name.trim().length === 0
        ) {

            errors.push(
                'Tool name cannot be empty.'
            );

        }

    }
	
	    /**
     * Validates tool category.
     *
     * @param {string} category
     * @param {string[]} errors
     * @returns {void}
     */
    validateCategory(
        category,
        errors
    ) {

        if (
            typeof category !== 'string'
        ) {

            errors.push(
                'Tool category must be a string.'
            );

            return;

        }

        if (
            category.trim().length === 0
        ) {

            errors.push(
                'Tool category cannot be empty.'
            );

        }

    }

    /**
     * Validates loader.
     *
     * @param {Function} loader
     * @param {string[]} errors
     * @returns {void}
     */
    validateLoader(
        loader,
        errors
    ) {

        if (
            typeof loader !== 'function'
        ) {

            errors.push(
                'Tool loader must be a function.'
            );

        }

    }

    /**
     * Validates keywords.
     *
     * @param {string[]} keywords
     * @param {string[]} errors
     * @returns {void}
     */
    validateKeywords(
        keywords,
        errors
    ) {

        if (
            keywords === undefined
        ) {

            return;

        }

        if (
            !Array.isArray(keywords)
        ) {

            errors.push(
                'Tool keywords must be an array.'
            );

            return;

        }

        if (
            keywords.some(
                keyword =>
                    typeof keyword !== 'string'
            )
        ) {

            errors.push(
                'Every keyword must be a string.'
            );

        }

    }

    /**
     * Validates tags.
     *
     * @param {string[]} tags
     * @param {string[]} errors
     * @returns {void}
     */
    validateTags(
        tags,
        errors
    ) {

        if (
            tags === undefined
        ) {

            return;

        }

        if (
            !Array.isArray(tags)
        ) {

            errors.push(
                'Tool tags must be an array.'
            );

            return;

        }

        if (
            tags.some(
                tag =>
                    typeof tag !== 'string'
            )
        ) {

            errors.push(
                'Every tag must be a string.'
            );

        }

    }

    /**
     * Validates description.
     *
     * @param {string} description
     * @param {string[]} errors
     * @returns {void}
     */
    validateDescription(
        description,
        errors
    ) {

        if (
            description === undefined
        ) {

            return;

        }

        if (
            typeof description !==
            'string'
        ) {

            errors.push(
                'Tool description must be a string.'
            );

            return;

        }

        if (
            description.trim().length === 0
        ) {

            errors.push(
                'Tool description cannot be empty.'
            );

        }

    }
    /**
     * Validates a tool definition and
     * throws when validation fails.
     *
     * @param {Object} definition
     * @returns {Object}
     */
    assert(definition) {

        const result =
            this.validate(definition);

        if (!result.valid) {

            throw new Error(

                result.errors.join('\n')

            );

        }

        return definition;

    }

}

const validator =
    new ToolValidator();

export default validator;

export {
    ToolValidator
};
