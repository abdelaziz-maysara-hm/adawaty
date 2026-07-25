/**
 * @file Tool sandbox and runtime isolation integration verification.
 */

import assert from 'node:assert/strict';

import {
    RuntimeToolLoader,
    ToolDirectory,
    ToolRegistry,
    ToolRuntimeHost,
    ToolSandboxError,
    ToolSandboxManager,
} from '../../src/tools/index.js';

let clock = 1_000;
const disposed = [];
const telemetry = [];

const sandbox = new ToolSandboxManager({
    allowedCapabilities: [
        'storage:read',
        'storage:write',
        'network:read',
    ],
    defaultCapabilities: ['storage:read'],
    sessionTtlMs: 100,
    eventBufferSize: 20,
    now: () => clock,
    telemetry(entry) {
        telemetry.push(entry.type);
    },
});

const first = sandbox.createSession({
    toolId: 'alpha',
    slot: 'main',
    capabilities: ['storage:read'],
    metadata: {
        source: 'test',
    },
});
const second = sandbox.createSession({
    toolId: 'beta',
    slot: 'side',
    capabilities: ['network:read'],
});

assert.equal(first.toolId, 'alpha');
assert.deepEqual(first.capabilities, ['storage:read']);
assert.equal(Object.isFrozen(first), true);

assert.throws(
    () =>
        sandbox.createSession({
            toolId: 'denied',
            capabilities: ['admin:all'],
        }),
    (error) =>
        error instanceof ToolSandboxError &&
        error.code === 'TOOL_CAPABILITY_NOT_ALLOWED',
);

assert.equal(
    sandbox.requireCapability(first.id, 'storage:read'),
    true,
);
assert.throws(
    () => sandbox.requireCapability(first.id, 'storage:write'),
    (error) =>
        error instanceof ToolSandboxError &&
        error.code === 'TOOL_CAPABILITY_DENIED',
);

const services = sandbox.createServiceFacade(
    first.id,
    {
        storage: {
            read() {
                return 'value';
            },
        },
        network: {
            fetch() {
                return 'network';
            },
        },
        publicApi: {
            ping() {
                return 'pong';
            },
        },
    },
    {
        storage: 'storage:read',
        network: 'network:read',
    },
);

assert.equal(services.storage.read(), 'value');
assert.equal('network' in services, false);
assert.equal(services.publicApi.ping(), 'pong');
assert.equal(Object.isFrozen(services), true);

sandbox.registerResource(
    first.id,
    'timer',
    {
        active: true,
    },
    async (resource, context) => {
        disposed.push(`${context.resourceId}:${context.reason}`);
        resource.active = false;
    },
);

let firstEvents = 0;
let secondEvents = 0;

sandbox.on(first.id, 'change', async (payload, context) => {
    firstEvents += payload.value;
    assert.equal(context.sessionId, first.id);
});
sandbox.on(second.id, 'change', async (payload) => {
    secondEvents += payload.value;
});

assert.equal(
    await sandbox.emit(first.id, 'change', {
        value: 2,
    }),
    1,
);
assert.equal(firstEvents, 2);
assert.equal(secondEvents, 0);

assert.equal(
    await sandbox.releaseResource(first.id, 'timer', {
        reason: 'manual-test',
    }),
    true,
);
assert.deepEqual(disposed, ['timer:manual-test']);

clock += 50;
sandbox.requireCapability(first.id, 'storage:read');
clock += 90;
assert.equal(await sandbox.sweepExpiredSessions(), 1);
assert.equal(sandbox.getSession(second.id), null);
assert.notEqual(sandbox.getSession(first.id), null);

assert.equal(
    await sandbox.closeSession(first.id, {
        reason: 'complete',
    }),
    true,
);
assert.equal(sandbox.getSnapshot().sessionCount, 0);
assert.ok(telemetry.includes('session-created'));
assert.ok(telemetry.includes('event-emitted'));
assert.ok(sandbox.getTelemetry().length > 0);

const registry = new ToolRegistry();
registry.register({
    id: 'sandboxed-tool',
    name: 'Sandboxed Tool',
    description: 'Runtime sandbox verification.',
    category: 'tests',
    loader: async () => ({
        default: {
            async mount(context) {
                context.sandbox.require('storage:read');
                assert.equal('storage' in context.services, true);
                assert.equal('network' in context.services, false);

                context.sandbox.registerResource(
                    'subscription',
                    {
                        active: true,
                    },
                    (resource) => {
                        resource.active = false;
                    },
                );

                const off = context.sandbox.on('message', (payload) => {
                    context.target.value = payload;
                });

                await context.sandbox.emit('message', 'ready');

                return () => {
                    off();
                    context.target.value = '';
                };
            },
        },
    }),
});

const runtimeSandbox = new ToolSandboxManager({
    allowedCapabilities: ['storage:read', 'network:read'],
});
const loader = new RuntimeToolLoader({
    toolRegistry: registry,
});
const host = new ToolRuntimeHost({
    loader,
    sandbox: runtimeSandbox,
});

const target = {
    value: '',
};
const instance = await host.mount('sandboxed-tool', target, {
    slot: 'main',
    capabilities: ['storage:read'],
    services: {
        storage: {
            read() {},
        },
        network: {
            fetch() {},
        },
    },
    serviceCapabilities: {
        storage: 'storage:read',
        network: 'network:read',
    },
});

assert.equal(target.value, 'ready');
assert.ok(instance.sandboxSessionId);
assert.equal(runtimeSandbox.getSnapshot().sessionCount, 1);

assert.equal(
    await host.unmount('main', {
        reason: 'navigation',
    }),
    true,
);
assert.equal(target.value, '');
assert.equal(runtimeSandbox.getSnapshot().sessionCount, 0);

const directory = new ToolDirectory({
    sandbox: {
        allowedCapabilities: ['storage:read'],
        eventBufferSize: 10,
    },
});

directory.initialize({
    categories: [
        {
            id: 'tests',
            name: 'Tests',
            description: 'Sandbox tests.',
        },
    ],
    tools: [
        {
            id: 'directory-sandbox',
            name: 'Directory Sandbox',
            description: 'Directory sandbox facade.',
            category: 'tests',
            loader: async () => ({
                default(context) {
                    context.sandbox.require('storage:read');
                    context.target.active = true;

                    return () => {
                        context.target.active = false;
                    };
                },
            }),
        },
    ],
});

const directoryTarget = {
    active: false,
};

await directory.mountTool('directory-sandbox', directoryTarget, {
    slot: 'workspace',
    capabilities: ['storage:read'],
});

assert.equal(directoryTarget.active, true);
assert.equal(directory.getSandboxSnapshot().sessionCount, 1);
assert.ok(directory.getSandboxTelemetry().length > 0);

await directory.clearAsync();
assert.equal(directoryTarget.active, false);
assert.equal(directory.getSandboxSnapshot().sessionCount, 0);

console.log('Sprint 5 Batch 7 tool sandbox isolation verification passed.');

// END OF FILE
