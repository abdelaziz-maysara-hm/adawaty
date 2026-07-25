/**
 * @file Dependency graph and runtime scheduler integration verification.
 */

import assert from 'node:assert/strict';

import {
    RuntimeToolLoader,
    ToolDependencyError,
    ToolDependencyGraph,
    ToolDirectory,
    ToolRegistry,
    ToolRuntimeScheduler,
} from '../../src/tools/index.js';

const graph = new ToolDependencyGraph();
graph.registerMany([
    { id: 'core', dependencies: [] },
    { id: 'parser', dependencies: ['core'] },
    { id: 'formatter', dependencies: ['core'] },
    {
        id: 'document-tool',
        dependencies: ['parser', 'formatter'],
    },
]);

assert.deepEqual(graph.resolve('document-tool'), [
    'core',
    'formatter',
    'parser',
    'document-tool',
]);
assert.deepEqual(graph.resolveLevels('document-tool'), [
    ['core'],
    ['formatter', 'parser'],
    ['document-tool'],
]);
assert.equal(graph.validate().valid, true);
assert.equal(graph.getSnapshot().nodeCount, 4);

graph.register('broken', ['missing']);

assert.throws(
    () => graph.resolve('broken'),
    (error) =>
        error instanceof ToolDependencyError &&
        error.code === 'TOOL_DEPENDENCY_MISSING',
);

const cyclic = new ToolDependencyGraph();
cyclic.register('a', ['b']);
cyclic.register('b', ['c']);
cyclic.register('c', ['a']);

assert.throws(
    () => cyclic.resolve('a'),
    (error) =>
        error instanceof ToolDependencyError &&
        error.code === 'TOOL_DEPENDENCY_CYCLE' &&
        error.cycle.length === 4,
);

const registry = new ToolRegistry();
const loadOrder = [];
let active = 0;
let maxActive = 0;

for (const id of ['core', 'parser', 'formatter', 'document-tool']) {
    registry.register({
        id,
        name: id,
        description: `${id} tool`,
        category: 'tests',
        loader: async () => {
            active += 1;
            maxActive = Math.max(maxActive, active);
            await new Promise((resolve) => setTimeout(resolve, 5));
            loadOrder.push(id);
            active -= 1;

            return {
                default() {},
            };
        },
    });
}

const loader = new RuntimeToolLoader({
    toolRegistry: registry,
});
const scheduler = new ToolRuntimeScheduler({
    loader,
    graph,
    concurrency: 2,
});

const loaded = await scheduler.schedule('document-tool', {
    priority: 'high',
});

assert.equal(loaded.length, 4);
assert.equal(loadOrder[0], 'core');
assert.equal(loadOrder.at(-1), 'document-tool');
assert.ok(maxActive <= 2);
assert.equal(scheduler.getSnapshot().queuedCount, 0);
assert.equal(scheduler.getHistory().length, 4);

const warmup = await scheduler.warmup([
    'document-tool',
    'parser',
]);
assert.equal(warmup.failedCount, 0);
assert.equal(warmup.loadedCount, 2);

let idleCalled = false;
const idleScheduler = new ToolRuntimeScheduler({
    loader,
    graph,
    idleScheduler(callback) {
        idleCalled = true;
        callback();
    },
});

await idleScheduler.schedule('core', {
    idle: true,
});
assert.equal(idleCalled, true);

const directory = new ToolDirectory({
    scheduler: {
        concurrency: 2,
    },
});

directory.initialize({
    categories: [
        {
            id: 'tests',
            name: 'Tests',
            description: 'Scheduler tests.',
        },
    ],
    tools: [
        {
            id: 'base-tool',
            name: 'Base Tool',
            description: 'Base dependency.',
            category: 'tests',
            dependencies: [],
            loader: async () => ({
                default() {},
            }),
        },
        {
            id: 'feature-tool',
            name: 'Feature Tool',
            description: 'Feature dependency.',
            category: 'tests',
            dependencies: ['base-tool'],
            loader: async () => ({
                default() {},
            }),
        },
    ],
});

assert.deepEqual(directory.resolveToolDependencies('feature-tool'), [
    'base-tool',
    'feature-tool',
]);

const directoryLoaded = await directory.scheduleTool('feature-tool');
assert.equal(directoryLoaded.length, 2);
assert.equal(directory.getDependencySnapshot().nodeCount, 2);
assert.equal(directory.getSchedulerSnapshot().queuedCount, 0);

const directoryWarmup = await directory.warmupTools([
    'feature-tool',
]);
assert.equal(directoryWarmup.loadedCount, 1);

await directory.clearAsync();
assert.equal(directory.getDependencySnapshot().nodeCount, 0);

console.log('Sprint 5 Batch 9 dependency graph scheduler verification passed.');

// END OF FILE
