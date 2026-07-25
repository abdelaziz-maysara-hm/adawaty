/**
 * @file Stable public API for the Adawaty tool core runtime.
 * @module tools/core
 */

/**
 * Semantic version of the stable core runtime API.
 *
 * @type {string}
 */
const TOOL_RUNTIME_VERSION = '1.0.0';

/**
 * Integer compatibility level for consumers that need feature gating.
 *
 * The API level changes only when the public contract changes in a way that
 * requires consumers to adapt.
 *
 * @type {number}
 */
const TOOL_RUNTIME_API_LEVEL = 1;

export {
    ToolError,
} from './tool-error.js';

export {
    ToolCache,
} from './tool-cache.js';

export {
    ToolContext,
} from './tool-context.js';

export {
    ToolEvents,
} from './tool-events.js';

export {
    ToolKernel,
    ToolKernelError,
    createToolKernel,
} from './tool-kernel.js';

export {
    ToolLoader,
    ToolLoaderError,
} from './tool-loader.js';

export {
    ToolRunner,
} from './tool-runner.js';

export {
    ToolValidationError,
    ToolValidationRule,
    ToolValidator,
} from './tool-validator.js';

export {
    TOOL_RUNTIME_API_LEVEL,
    TOOL_RUNTIME_VERSION,
};

// END OF FILE
