/**
 * @file Runtime tool loading integration verification.
 */

import assert from 'node:assert/strict';

import {
    RuntimeToolLoader,
    ToolDirectory,
    ToolLoadError,
    ToolRegistry,
} from '../../src/tools/index.js';

const registry = new ToolRegistry();
let sharedCalls = 0;
let retryCalls = 0;
let slowCalls = 0;
const hooks = [];

registry.registerMany([
    {
        id: 'shared-tool',
        name: 'Shared Tool',
        description: 'Concurrent loading test.',
        category: 'tests',
        loader: async ({ attempt }) => {
            sharedCalls += 1;
            await new Promise((resolve) => setTimeout(resolve, 10));

            return {
                default: {
                    attempt,
                    ready: true,
                },
                named: 'shared',
            };
        },
    },
    {
        id: 'retry-tool',
        name: 'Retry Tool',
        description: 'Retry test.',
        category: 'tests',
        loader: async () => {
            retryCalls += 1;

            if (retryCalls < 2) {
                throw new Error('Transient failure.');
            }

            return {
                default: 'recovered',
            };
        },
    },
    {
        id: 'slow-tool',
        name: 'Slow Tool',
        description: 'Timeout test.',
        category: 'tests',
        loader: async () => {
            slowCalls += 1;
            await new Promise((resolve) => setTimeout(resolve, 50));
            return {
                default: 'late',
            };
        },
    },
]);

const loader = new RuntimeToolLoader({
    toolRegistry: registry,
    timeoutMs: 100,
    retries: 1,
    hooks: {
        beforeLoad(context) {
            hooks.push(`before:${context.id}:${context.attempt}`);
        },
        afterLoad(context) {
            hooks.push(`after:${context.id}:${context.attempt}`);
        },
        onError(context) {
            hooks.push(`error:${context.id}:${context.attempt}`);
        },
    },
});

const [first, second] = await Promise.all([
    loader.load('shared-tool'),
    loader.load('shared-tool'),
]);

assert.equal(first, second);
assert.equal(sharedCalls, 1);
assert.equal(first.defaultExport.ready, true);
assert.equal(first.module.named, 'shared');
assert.equal(Object.isFrozen(first), true);
assert.equal(loader.isLoaded('shared-tool'), true);
assert.equal(loader.getCached('shared-tool'), first);

const cached = await loader.load('shared-tool');
assert.equal(cached, first);
assert.equal(sharedCalls, 1);

const forced = await loader.load('shared-tool', {
    force: true,
});
assert.notEqual(forced, first);
assert.equal(sharedCalls, 2);

const recovered = await loader.load('retry-tool');
assert.equal(recovered.defaultExport, 'recovered');
assert.equal(recovered.attempt, 2);
assert.equal(retryCalls, 2);
assert.equal(loader.getFailure('retry-tool'), null);

await assert.rejects(
    loader.load('slow-tool', {
        timeoutMs: 5,
        retries: 0,
    }),
    (error) =>
        error instanceof ToolLoadError &&
        error.code === 'TOOL_LOAD_TIMEOUT' &&
        error.toolId === 'slow-tool',
);
assert.equal(slowCalls, 1);
assert.equal(loader.getFailure('slow-tool').code, 'TOOL_LOAD_TIMEOUT');

await assert.rejects(
    loader.load('missing-tool'),
    (error) =>
        error instanceof ToolLoadError &&
        error.code === 'TOOL_NOT_FOUND',
);

const preload = await loader.preload([
    'shared-tool',
    'missing-tool',
]);
assert.equal(preload.loaded['shared-tool'].id, 'shared-tool');
assert.equal(preload.failed['missing-tool'].code, 'TOOL_NOT_FOUND');

assert.ok(hooks.includes('before:shared-tool:1'));
assert.ok(hooks.includes('after:shared-tool:1'));
assert.ok(hooks.includes('error:retry-tool:1'));
assert.ok(hooks.includes('error:slow-tool:1'));

const snapshot = loader.getSnapshot();
assert.equal(snapshot.loadedCount, 2);
assert.equal(snapshot.failedIds.includes('slow-tool'), true);
assert.equal(Object.isFrozen(snapshot), true);

assert.equal(loader.invalidate('shared-tool'), true);
assert.equal(loader.isLoaded('shared-tool'), false);

const controller = new AbortController();
controller.abort('cancelled');

await assert.rejects(
    loader.load('shared-tool', {
        signal: controller.signal,
    }),
    (error) => error.code === 'TOOL_LOAD_ABORTED',
);

const directory = new ToolDirectory({
    loader: {
        timeoutMs: 100,
    },
});
directory.initialize({
    categories: [
        {
            id: 'tests',
            name: 'Tests',
            description: 'Test tools.',
        },
    ],
    tools: [
        {
            id: 'directory-tool',
            name: 'Directory Tool',
            description: 'Directory loading facade.',
            category: 'tests',
            loader: async () => ({
                default: {
                    mounted: true,
                },
            }),
        },
    ],
});

const directoryRecord = await directory.loadTool('directory-tool');
assert.equal(directoryRecord.defaultExport.mounted, true);
assert.equal(directory.getLoaderSnapshot().loadedCount, 1);
assert.equal(directory.invalidateTool('directory-tool'), true);

const directoryPreload = await directory.preloadTools(['directory-tool']);
assert.equal(directoryPreload.loaded['directory-tool'].id, 'directory-tool');

directory.clear();
assert.equal(directory.getLoaderSnapshot().loadedCount, 0);
assert.equal(directory.getSnapshot().toolCount, 0);

loader.clear();
assert.equal(loader.getSnapshot().loadedCount, 0);
assert.equal(loader.getSnapshot().failedCount, 0);

console.log('Sprint 5 Batch 5 runtime tool loading verification passed.');

// END OF FILE
