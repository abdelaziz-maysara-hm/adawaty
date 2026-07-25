/**
 * @file Runtime event bus integration verification.
 */

import assert from 'node:assert/strict';

import {
    ToolDirectory,
    ToolEventError,
    ToolRuntimeEventBus,
} from '../../src/tools/index.js';

const bus = new ToolRuntimeEventBus({
    historyLimit: 50,
    deadLetterLimit: 10,
    maxPending: 10,
    requestTimeoutMs: 100,
});

const delivery = [];
bus.subscribe(
    'tools.ready',
    (event) => {
        delivery.push(`normal:${event.payload.id}`);
        return 'normal';
    },
    {
        priority: 1,
        ownerId: 'owner-a',
    },
);
bus.subscribe(
    'tools.*',
    (event) => {
        delivery.push(`wildcard:${event.payload.id}`);
        return 'wildcard';
    },
    {
        priority: 5,
        ownerId: 'owner-b',
    },
);
bus.once(
    'tools.ready',
    () => {
        delivery.push('once');
    },
);

const first = await bus.publish(
    'tools.ready',
    {
        id: 'alpha',
    },
    {
        replay: true,
        traceId: 'trace-1',
    },
);

assert.equal(first.deliveredCount, 3);
assert.deepEqual(delivery, [
    'wildcard:alpha',
    'normal:alpha',
    'once',
]);
assert.equal(bus.getReplay('tools.ready').traceId, 'trace-1');

await bus.publish('tools.ready', {
    id: 'beta',
});
assert.equal(delivery.includes('once'), true);
assert.equal(
    delivery.filter((item) => item === 'once').length,
    1,
);

const removeMiddleware = bus.use(
    async (event, next) =>
        next({
            ...event,
            metadata: {
                ...event.metadata,
                middleware: true,
            },
        }),
    {
        priority: 10,
    },
);

let metadataSeen = false;
bus.once('middleware.check', (event) => {
    metadataSeen = event.metadata.middleware === true;
});
await bus.publish('middleware.check', null);
assert.equal(metadataSeen, true);
assert.equal(removeMiddleware(), true);

bus.use(async (event, next) => {
    if (event.name === 'cancel.me') {
        return {
            ...event,
            cancelled: true,
        };
    }
    return next(event);
});

const cancelled = await bus.publish('cancel.me', {});
assert.equal(cancelled.cancelled, true);

bus.subscribe('broken.event', () => {
    throw new Error('listener failed');
});
const broken = await bus.publish('broken.event', {});
assert.equal(broken.failedCount, 1);
assert.equal(bus.getDeadLetters().length, 1);

bus.subscribe('math:add:request', async (event) => {
    await bus.publish(
        'math:add:response',
        event.payload.left + event.payload.right,
        {
            correlationId: event.correlationId,
        },
    );
});

assert.equal(
    await bus.request(
        'math:add',
        {
            left: 2,
            right: 5,
        },
    ),
    7,
);

await assert.rejects(
    () =>
        bus.request('missing.handler', {}, {
            timeoutMs: 10,
        }),
    (error) =>
        error instanceof ToolEventError &&
        error.code === 'TOOL_EVENT_REQUEST_TIMEOUT',
);

const ownerCleanup = bus.unsubscribeOwner('owner-a');
assert.equal(ownerCleanup.listenersRemoved, 1);

const directory = new ToolDirectory();

directory.initialize({
    categories: [
        {
            id: 'tests',
            name: 'Tests',
            description: 'Event tests.',
        },
    ],
    tools: [
        {
            id: 'event-tool',
            name: 'Event Tool',
            description: 'Runtime event tool.',
            category: 'tests',
            loader: async () => ({
                default: {
                    mount(context) {
                        context.events.subscribe(
                            'runtime.ping',
                            (event) => {
                                context.target.received =
                                    event.payload;
                            },
                        );
                        context.events.publish(
                            'runtime.mounted',
                            {
                                toolId: context.toolId,
                            },
                        );
                    },
                },
            }),
        },
    ],
});

const target = {};
await directory.mountTool('event-tool', target, {
    slot: 'workspace',
});

await directory.publishEvent('runtime.ping', {
    ok: true,
});

assert.deepEqual(target.received, {
    ok: true,
});
assert.equal(directory.getEventSnapshot().listenerCount, 1);

await directory.unmountTool('workspace', {
    reason: 'navigation',
});

assert.equal(directory.getEventSnapshot().listenerCount, 0);
assert.equal(directory.getEventHistory().length > 0, true);
assert.equal(directory.clearEventHistory() > 0, true);

await directory.clearAsync();

console.log('Sprint 5 Batch 14 event bus verification passed.');

// END OF FILE
