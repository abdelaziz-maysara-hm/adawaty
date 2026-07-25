/**
 * @file Runtime observability and circuit breaker integration verification.
 */

import assert from 'node:assert/strict';

import {
    RuntimeToolLoader,
    ToolCircuitOpenError,
    ToolDirectory,
    ToolRegistry,
    ToolRuntimeHost,
    ToolRuntimeMonitor,
} from '../../src/tools/index.js';

let clock = 1_000;
const reported = [];

const monitor = new ToolRuntimeMonitor({
    failureThreshold: 2,
    cooldownMs: 100,
    windowMs: 1_000,
    historyLimit: 20,
    now: () => clock,
    reporter(entry) {
        reported.push(entry.type);
    },
});

assert.equal(monitor.getHealth('alpha').state, 'closed');

monitor.recordFailure('alpha', new Error('first'), {
    phase: 'load',
    durationMs: 5,
});
assert.equal(monitor.getHealth('alpha').state, 'closed');

clock += 10;
monitor.recordFailure('alpha', new Error('second'), {
    phase: 'load',
    durationMs: 7,
});

const opened = monitor.getHealth('alpha');
assert.equal(opened.state, 'open');
assert.equal(opened.failureCount, 2);
assert.equal(opened.consecutiveFailures, 2);
assert.equal(opened.averageDurationMs, 6);

assert.throws(
    () => monitor.assertAvailable('alpha'),
    (error) =>
        error instanceof ToolCircuitOpenError &&
        error.code === 'TOOL_CIRCUIT_OPEN' &&
        error.toolId === 'alpha',
);

clock += 100;
assert.equal(monitor.getHealth('alpha').state, 'halfOpen');
assert.doesNotThrow(() => monitor.assertAvailable('alpha'));

monitor.recordSuccess('alpha', {
    phase: 'load',
    durationMs: 4,
});
assert.equal(monitor.getHealth('alpha').state, 'closed');
assert.equal(monitor.getHealth('alpha').consecutiveFailures, 0);

const value = await monitor.run(
    'beta',
    async () => {
        clock += 6;
        return 'ok';
    },
    {
        phase: 'mount',
    },
);
assert.equal(value, 'ok');
assert.equal(monitor.getHealth('beta').successCount, 1);

await assert.rejects(
    monitor.run(
        'beta',
        async () => {
            clock += 3;
            throw new Error('runtime-failure');
        },
        {
            phase: 'unmount',
        },
    ),
    /runtime-failure/,
);
assert.equal(monitor.getHealth('beta').failureCount, 1);

const snapshot = monitor.getSnapshot();
assert.equal(snapshot.toolCount, 2);
assert.equal(snapshot.openCount, 0);
assert.equal(Object.isFrozen(snapshot), true);
assert.ok(monitor.getHistory({ toolId: 'alpha' }).length >= 3);
assert.ok(reported.includes('success'));
assert.ok(reported.includes('failure'));
assert.equal(monitor.reset('alpha'), true);
assert.equal(monitor.getHealth('alpha').failureCount, 0);

const registry = new ToolRegistry();
let loaderCalls = 0;

registry.register({
    id: 'unstable-loader',
    name: 'Unstable Loader',
    description: 'Circuit breaker verification.',
    category: 'tests',
    loader: async () => {
        loaderCalls += 1;
        throw new Error('cannot-import');
    },
});

const loaderMonitor = new ToolRuntimeMonitor({
    failureThreshold: 2,
    cooldownMs: 1_000,
    now: () => clock,
});
const loader = new RuntimeToolLoader({
    toolRegistry: registry,
    monitor: loaderMonitor,
    retries: 0,
});

await assert.rejects(loader.load('unstable-loader'), /cannot-import/);
await assert.rejects(loader.load('unstable-loader'), /cannot-import/);
assert.equal(loaderCalls, 2);
assert.equal(loaderMonitor.getHealth('unstable-loader').state, 'open');

await assert.rejects(
    loader.load('unstable-loader'),
    (error) => error.code === 'TOOL_CIRCUIT_OPEN',
);
assert.equal(loaderCalls, 2);

const hostRegistry = new ToolRegistry();
let mountCalls = 0;

hostRegistry.register({
    id: 'unstable-runtime',
    name: 'Unstable Runtime',
    description: 'Runtime monitor verification.',
    category: 'tests',
    loader: async () => ({
        default: {
            mount() {
                mountCalls += 1;
                throw new Error('mount-failed');
            },
        },
    }),
});

const hostMonitor = new ToolRuntimeMonitor({
    failureThreshold: 1,
    cooldownMs: 500,
    now: () => clock,
});
const hostLoader = new RuntimeToolLoader({
    toolRegistry: hostRegistry,
});
const host = new ToolRuntimeHost({
    loader: hostLoader,
    monitor: hostMonitor,
});

await assert.rejects(
    host.mount('unstable-runtime', {}, { slot: 'main' }),
    /failed to mount/,
);
assert.equal(hostMonitor.getHealth('unstable-runtime').state, 'open');
assert.equal(mountCalls, 1);

await assert.rejects(
    host.mount('unstable-runtime', {}, { slot: 'main' }),
    (error) => error.code === 'TOOL_CIRCUIT_OPEN',
);
assert.equal(mountCalls, 1);

const directory = new ToolDirectory({
    monitor: {
        failureThreshold: 2,
        cooldownMs: 100,
        now: () => clock,
    },
});

directory.initialize({
    categories: [
        {
            id: 'tests',
            name: 'Tests',
            description: 'Observability tests.',
        },
    ],
    tools: [
        {
            id: 'healthy-tool',
            name: 'Healthy Tool',
            description: 'Directory health verification.',
            category: 'tests',
            loader: async () => ({
                default(context) {
                    context.target.ready = true;

                    return () => {
                        context.target.ready = false;
                    };
                },
            }),
        },
    ],
});

const target = {
    ready: false,
};

await directory.mountTool('healthy-tool', target, {
    slot: 'workspace',
});
assert.equal(target.ready, true);
assert.equal(directory.getToolHealth('healthy-tool').successCount >= 2, true);
assert.equal(directory.getHealthSnapshot().toolCount, 1);
assert.ok(directory.getRuntimeHistory({ toolId: 'healthy-tool' }).length >= 2);

await directory.unmountTool('workspace');
assert.equal(target.ready, false);
assert.equal(directory.getToolHealth('healthy-tool').state, 'closed');
assert.equal(directory.resetToolHealth('healthy-tool'), true);
assert.equal(directory.getToolHealth('healthy-tool').successCount, 0);

await directory.clearAsync();

console.log('Sprint 5 Batch 8 runtime observability verification passed.');

// END OF FILE
