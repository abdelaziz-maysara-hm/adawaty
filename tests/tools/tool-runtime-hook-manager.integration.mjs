/**
 * @file Runtime hooks and extension framework integration verification.
 */

import assert from 'node:assert/strict';

import {
    ToolDirectory,
    ToolRuntimeExtensionRegistry,
    ToolRuntimeHookManager,
} from '../../src/tools/index.js';

const hooks = new ToolRuntimeHookManager({
    historyLimit: 50,
    timeoutMs: 100,
});

const order = [];

hooks.before(
    'tool.mount',
    () => {
        order.push('before-low');
    },
    {
        priority: 1,
    },
);

hooks.before(
    'tool.mount',
    () => {
        order.push('before-high');
    },
    {
        priority: 5,
    },
);

hooks.around('tool.mount', async (_context, next) => {
    order.push('around-before');
    const result = await next();
    order.push('around-after');
    return `${result}:around`;
});

hooks.after('tool.mount', (context) => {
    order.push('after');
    return `${context.result}:after`;
});

const result = await hooks.execute(
    'tool.mount',
    {
        toolId: 'alpha',
    },
    async () => {
        order.push('operation');
        return 'mounted';
    },
);

assert.equal(result, 'mounted:around:after');
assert.deepEqual(order, [
    'before-high',
    'before-low',
    'around-before',
    'operation',
    'around-after',
    'after',
]);

let onceCount = 0;
hooks.before(
    'runtime.once',
    () => {
        onceCount += 1;
    },
    {
        once: true,
    },
);
await hooks.execute('runtime.once');
await hooks.execute('runtime.once');
assert.equal(onceCount, 1);

hooks.before(
    'runtime.conditional',
    () => {
        throw new Error('should not execute');
    },
    {
        condition: () => false,
    },
);
await hooks.execute('runtime.conditional');

const extensions = new ToolRuntimeExtensionRegistry({
    hookManager: hooks,
});

const lifecycle = [];

extensions.register({
    id: 'base',
    setup() {
        lifecycle.push('base:setup');
    },
    start(context) {
        lifecycle.push('base:start');
        context.hooks.before('extension.test', () => {
            lifecycle.push('base:hook');
        });
    },
    stop() {
        lifecycle.push('base:stop');
    },
    dispose() {
        lifecycle.push('base:dispose');
    },
});

extensions.register({
    id: 'feature',
    dependencies: ['base'],
    start() {
        lifecycle.push('feature:start');
    },
    stop() {
        lifecycle.push('feature:stop');
    },
});

assert.deepEqual(
    extensions.discover().map((extension) => extension.id),
    ['base', 'feature'],
);

await extensions.startAll();
await hooks.execute('extension.test');
await extensions.stopAll();
await extensions.disposeAll();

assert.deepEqual(lifecycle, [
    'base:setup',
    'base:start',
    'feature:start',
    'base:hook',
    'feature:stop',
    'base:stop',
    'base:dispose',
]);

const directory = new ToolDirectory();

directory.initialize({
    categories: [
        {
            id: 'tests',
            name: 'Tests',
            description: 'Hook tests.',
        },
    ],
    tools: [
        {
            id: 'hook-tool',
            name: 'Hook Tool',
            description: 'Runtime hook tool.',
            category: 'tests',
            loader: async () => ({
                default: {
                    mount(context) {
                        context.hooks.before(
                            'runtime.action',
                            () => {
                                context.target.hooked = true;
                            },
                        );
                    },
                },
            }),
        },
    ],
});

directory.registerExtension({
    id: 'directory-extension',
    start(context) {
        context.hooks.before(
            'directory.action',
            () => {
                context.directory.extensionExecuted = true;
            },
        );
    },
});

await directory.startExtensions();

const target = {};
await directory.mountTool('hook-tool', target, {
    slot: 'workspace',
});

await directory.executeHook('runtime.action');
assert.equal(target.hooked, true);

await directory.executeHook('directory.action');
assert.equal(directory.extensionExecuted, true);

assert.equal(directory.getHookSnapshot().hookCount, 2);
assert.equal(directory.discoverExtensions().length, 1);

await directory.unmountTool('workspace', {
    reason: 'navigation',
});

assert.equal(directory.getHookSnapshot().hookCount, 1);

await directory.clearAsync();

console.log('Sprint 5 Batch 15 hook framework verification passed.');

// END OF FILE
