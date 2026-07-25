# Adawaty Core Runtime v1.0 — Public API Specification

## Entry point

```js
import {
    TOOL_RUNTIME_API_LEVEL,
    TOOL_RUNTIME_VERSION,
    ToolCache,
    ToolContext,
    ToolError,
    ToolEvents,
    ToolKernel,
    ToolKernelError,
    ToolLoader,
    ToolLoaderError,
    ToolRunner,
    ToolValidationError,
    ToolValidationRule,
    ToolValidator,
    createToolKernel,
} from './src/tools/core/index.js';
```

Consumers must import public runtime symbols from `src/tools/core/index.js`.

Direct imports from individual implementation modules are allowed only inside the
core runtime itself and are not covered by the public compatibility guarantee.

## Version constants

### `TOOL_RUNTIME_VERSION`

Current value:

```text
1.0.0
```

A semantic version describing the stable public runtime contract.

### `TOOL_RUNTIME_API_LEVEL`

Current value:

```text
1
```

An integer compatibility level intended for runtime feature gating.

## Stable classes and functions

### Kernel

- `ToolKernel`
- `ToolKernelError`
- `createToolKernel(options?)`

The kernel owns the runtime context, cache, events, validator, loader and runners.

### Context

- `ToolContext`

Provides immutable-style runtime state, environment information and registered
services for a tool execution.

### Events

- `ToolEvents`

Provides namespaced subscriptions, middleware, wildcard matching, bounded
history and deterministic disposal.

### Cache

- `ToolCache`

Provides namespaced storage, TTL expiration, LRU behavior, statistics and
lifecycle cleanup.

### Loader

- `ToolLoader`
- `ToolLoaderError`

Provides dynamic ES module loading, retries, timeouts, validation, caching and
abort handling.

### Validation

- `ToolValidator`
- `ToolValidationRule`
- `ToolValidationError`

Provides asynchronous rules, schemas and structured validation issues.

### Runner

- `ToolRunner`

Provides guarded tool execution, timeout and abort handling, state management
and deterministic shutdown.

### Error base

- `ToolError`

Base class for stable machine-readable runtime errors.

## Compatibility policy

The following changes are backward compatible within API level 1:

- adding optional constructor options;
- adding methods that do not alter existing behavior;
- adding new error metadata;
- adding new exports;
- internal performance and memory improvements.

The following require a new API level:

- removing or renaming a public export;
- changing required arguments;
- changing return types;
- changing error-code semantics;
- changing lifecycle ownership.

## Internal APIs

Normalization, cloning, timeout, matching and middleware helpers are internal.
They may change without a major public API announcement and must not be imported
from the package entry point.

// END OF FILE
