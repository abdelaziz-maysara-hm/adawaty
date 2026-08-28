# Core Runtime v1.0 Integration Report

## Release

```text
Runtime version: 1.0.0
API level: 1
Canonical entry point: src/tools/core/index.js
```

## Verified areas

- Exact stable public export surface.
- ES module loading.
- Kernel construction.
- Deterministic asynchronous kernel disposal.
- Event wildcard subscriptions.
- `waitFor()` settlement and cleanup.
- Bounded event history.
- Cache reads, writes and LRU eviction.
- Validator rule registration and execution.
- Unified runtime error inheritance.

## Architectural result

The canonical runtime is now isolated under:

```text
src/tools/core/
```

Application and compatibility modules may consume this runtime through its
public entry point, but the runtime does not depend on application components,
pages or global application singletons.

## Compatibility result

The stable v1.0 entry point exports only documented runtime classes, documented
error classes, the kernel factory and version constants.

Low-level normalization, cloning, timeout and matching helpers remain internal
implementation details.

## Build limitation

The uploaded repository intentionally contains an unfinished application
scaffold and an empty root `package.json`. Therefore this release verifies the
Core Runtime independently rather than claiming a complete Vite application
build.

// END OF FILE
