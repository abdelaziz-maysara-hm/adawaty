/**
 * @file Tool runtime host integration verification.
 */

import assert from 'node:assert/strict';

import {
    ToolDirectory,
    ToolRuntimeError,
    ToolRuntimeHost,
    ToolRegistry,
    RuntimeToolLoader,
} from '../../src/tools/index.js';

const events = [];
const targets = {
    main: {
        name: 'main',
        content: '',
    },
    side: {
        name: 'side',
        content: '',
    },
};

const registry = new ToolRegistry();
registry.registerMany([
    {
        id: 'counter-tool',
        name: 'Counter Tool',
        description: 'Lifecycle verification.',
        category: 'tests',
        loader: async () => ({
            default: {
                mount(context) {
                    events.push(`mount:${context.toolId}:${context.slot}`);
                    context.target.content = String(context.props.value);

                    return (cleanupContext) => {
                        events.push(
                            `cleanup:${cleanupContext.toolId}:${cleanupContext.reason}`,
                        );
                        cleanupContext.target.content = '';
                    };
                },
                unmount(context) {
                    events.push(`unmount:${context.toolId}:${context.reason}`);
                },
            },
        }),
    },
    {
        id: 'function-tool',
        name: 'Function Tool',
        description: 'Default function runtime.',
        category: 'tests',
        loader: async () => ({
            default(context) {
                context.target.content = 'function-mounted';
                return {
                    destroy(cleanupContext) {
                        cleanupContext.target.content = '';
                    },
                };
            },
        }),
    },
    {
        id: 'replacement-tool',
        name: 'Replacement Tool',
        description: 'Slot replacement verification.',
        category: 'tests',
        loader: async () => ({
            default: {
                render(context) {
                    events.push(`render:${context.toolId}:${context.slot}`);
                    context.target.content = 'replacement';
                },
                destroy(context) {
                    events.push(`destroy:${context.toolId}:${context.reason}`);
                },
            },
        }),
    },
    {
        id: 'invalid-tool',
        name: 'Invalid Tool',
        description: 'Invalid runtime verification.',
        category: 'tests',
        loader: async () => ({
            default: {
                value: true,
            },
        }),
    },
]);

const loader = new RuntimeToolLoader({
    toolRegistry: registry,
});

const host = new ToolRuntimeHost({
    loader,
    contextFactory(input) {
        return {
            runtimeLabel: `${input.toolId}:${input.slot}`,
        };
    },
    hooks: {
        beforeMount(context) {
            events.push(`before-mount:${context.toolId}`);
        },
        afterMount(context) {
            events.push(`after-mount:${context.toolId}`);
        },
        beforeUnmount(context) {
            events.push(`before-unmount:${context.toolId}`);
        },
        afterUnmount(context) {
            events.push(`after-unmount:${context.toolId}`);
        },
        onError(context) {
            events.push(`error:${context.error.code}`);
        },
    },
});

const first = await host.mount('counter-tool', targets.main, {
    slot: 'main',
    props: {
        value: 42,
    },
    services: {
        analytics: {
            track() {},
        },
    },
    locale: 'ar',
    direction: 'rtl',
});

assert.equal(first.toolId, 'counter-tool');
assert.equal(first.context.runtimeLabel, 'counter-tool:main');
assert.equal(first.context.locale, 'ar');
assert.equal(first.context.direction, 'rtl');
assert.equal(targets.main.content, '42');
assert.equal(host.isMounted('main'), true);
assert.equal(host.getInstance('main'), first);
assert.equal(Object.isFrozen(first), true);

const replacement = await host.mount('replacement-tool', targets.main, {
    slot: 'main',
});

assert.equal(replacement.toolId, 'replacement-tool');
assert.equal(targets.main.content, 'replacement');
assert.ok(events.includes('cleanup:counter-tool:replaced'));
assert.ok(events.includes('unmount:counter-tool:replaced'));
assert.equal(host.getInstance('main'), replacement);

const functionInstance = await host.mount('function-tool', targets.side, {
    slot: 'side',
});
assert.equal(functionInstance.toolId, 'function-tool');
assert.equal(targets.side.content, 'function-mounted');
assert.equal(host.getInstances().length, 2);

const remounted = await host.remount('side', {
    props: {
        version: 2,
    },
});
assert.notEqual(remounted.id, functionInstance.id);
assert.equal(targets.side.content, 'function-mounted');

assert.equal(await host.unmount('side', { reason: 'navigation' }), true);
assert.equal(targets.side.content, '');
assert.equal(await host.unmount('side'), false);

await assert.rejects(
    host.mount('invalid-tool', targets.side, {
        slot: 'side',
    }),
    (error) =>
        error instanceof ToolRuntimeError &&
        error.code === 'TOOL_RUNTIME_INVALID',
);

const aborted = new AbortController();
aborted.abort('cancelled');

await assert.rejects(
    host.mount('counter-tool', targets.side, {
        slot: 'side',
        signal: aborted.signal,
    }),
    (error) =>
        error instanceof ToolRuntimeError &&
        error.code === 'TOOL_MOUNT_ABORTED',
);

const snapshot = host.getSnapshot();
assert.equal(snapshot.mountedCount, 1);
assert.equal(snapshot.instances[0].toolId, 'replacement-tool');
assert.equal(Object.isFrozen(snapshot), true);

const unmounted = await host.unmountAll({
    reason: 'shutdown',
});
assert.equal(unmounted.main, true);
assert.equal(host.getSnapshot().mountedCount, 0);
assert.ok(events.includes('destroy:replacement-tool:shutdown'));

const directory = new ToolDirectory({
    runtime: {
        contextFactory(input) {
            return {
                directoryContext: input.toolId,
            };
        },
    },
});

directory.initialize({
    categories: [
        {
            id: 'tests',
            name: 'Tests',
            description: 'Runtime tests.',
        },
    ],
    tools: [
        {
            id: 'directory-runtime',
            name: 'Directory Runtime',
            description: 'Directory host facade.',
            category: 'tests',
            loader: async () => ({
                default(context) {
                    context.target.content = context.directoryContext;
                    return () => {
                        context.target.content = '';
                    };
                },
            }),
        },
    ],
});

const directoryTarget = {
    content: '',
};
const directoryInstance = await directory.mountTool(
    'directory-runtime',
    directoryTarget,
    {
        slot: 'workspace',
    },
);

assert.equal(directoryInstance.toolId, 'directory-runtime');
assert.equal(directoryTarget.content, 'directory-runtime');
assert.equal(directory.getRuntimeSnapshot().mountedCount, 1);
assert.equal(directory.getMountedTool('workspace').toolId, 'directory-runtime');

assert.equal(
    await directory.unmountTool('workspace', {
        reason: 'test-complete',
    }),
    true,
);
assert.equal(directoryTarget.content, '');

await directory.clearAsync();
assert.equal(directory.getRuntimeSnapshot().mountedCount, 0);
assert.equal(directory.getSnapshot().toolCount, 0);

console.log('Sprint 5 Batch 6 tool lifecycle host verification passed.');

// END OF FILE
