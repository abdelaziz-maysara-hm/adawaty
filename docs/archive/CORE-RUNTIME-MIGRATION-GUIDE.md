# Core Runtime v1.0 Migration Guide

## Summary

The public entry point has been reduced to stable runtime classes, documented
error classes, the kernel factory and version constants.

Previously exported low-level helper functions are no longer exported from
`src/tools/core/index.js`.

## Recommended imports

Before:

```js
import {
    ToolKernel,
    normalizeKernelNamespace,
    cloneCacheValue,
    normalizeEventName,
} from './src/tools/core/index.js';
```

After:

```js
import {
    ToolKernel,
} from './src/tools/core/index.js';
```

Application code should pass values to public classes and allow those classes to
perform normalization internally.

## Removed entry-point helper exports

The following helper categories are now internal:

- cache cloning and normalization helpers;
- context cloning, merge and direction helpers;
- event matching, ID, namespace and middleware helpers;
- kernel namespace normalization;
- loader key, ID, delay, timeout and specifier helpers;
- runner promise and guard helpers;
- validator issue and path normalization helpers;
- generic error conversion and normalization helpers.

Their implementation modules still contain them for internal runtime use, but
application code must not depend on them.

## Runtime compatibility checks

Consumers may check the runtime contract:

```js
import {
    TOOL_RUNTIME_API_LEVEL,
    TOOL_RUNTIME_VERSION,
} from './src/tools/core/index.js';

if (TOOL_RUNTIME_API_LEVEL !== 1) {
    throw new Error(`Unsupported tool runtime API: ${TOOL_RUNTIME_VERSION}`);
}
```

## Legacy runtime

Application modules under `src/core/` are compatibility/application layers.
New tool-runtime integrations must target `src/tools/core/index.js`.

// END OF FILE
