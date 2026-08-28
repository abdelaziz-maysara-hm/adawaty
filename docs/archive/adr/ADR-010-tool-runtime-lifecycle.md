# ADR-010: Tool Runtime Lifecycle Host

## Status

Accepted.

## Context

Lazy module loading does not define how a tool is mounted into a page, replaced,
unmounted, cleaned up, or coordinated when multiple application regions are
active.

## Decision

Introduce `ToolRuntimeHost` above `RuntimeToolLoader`.

The host:

- manages one active tool instance per named slot;
- serializes lifecycle operations inside each slot;
- unmounts the previous instance before replacement;
- accepts default functions or objects exposing `mount()`/`render()`;
- supports cleanup functions and objects exposing cleanup lifecycle methods;
- injects immutable props, services, locale, direction and custom context;
- provides mount and unmount lifecycle hooks;
- normalizes runtime failures through stable `ToolRuntimeError` codes;
- exposes immutable instance and operational snapshots.

`ToolDirectory` exposes the host through mount, unmount and inspection methods.

## Consequences

UI integrations use one lifecycle contract, stale instances are cleaned before
replacement, and tool modules remain independent from routing and page-shell
implementation details.

// END OF FILE
