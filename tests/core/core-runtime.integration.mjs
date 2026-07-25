/**
 * @file Core Runtime v1.0 integration verification.
 */

import assert from 'node:assert/strict';

import {
    TOOL_RUNTIME_API_LEVEL,
    TOOL_RUNTIME_VERSION,
    ToolCache,
    ToolError,
    ToolEvents,
    ToolKernel,
    ToolValidationError,
    ToolValidator,
    createToolKernel,
} from '../../src/tools/core/index.js';

assert.equal(TOOL_RUNTIME_VERSION, '1.0.0');
assert.equal(TOOL_RUNTIME_API_LEVEL, 1);

const events = new ToolEvents({
    historyLimit: 3,
});

let eventCount = 0;
const unsubscribe = events.on('tool:*', () => {
    eventCount += 1;
});

await events.emit('tool:start', {
    id: 'integration',
});

assert.equal(eventCount, 1);
unsubscribe();

const waiting = events.waitFor('tool:done', {
    timeout: 1000,
});

await events.emit('tool:done', {
    ok: true,
});

const waitedEvent = await waiting;
assert.equal(waitedEvent.name, 'tool:done');

const cache = new ToolCache({
    maxEntries: 2,
});

cache.set('first', 1);
cache.set('second', 2);
assert.equal(cache.get('first'), 1);

cache.set('third', 3);
assert.equal(cache.has('second'), false);
assert.equal(cache.get('third'), 3);

const validator = new ToolValidator();
validator.use(
    (value) => value !== null && value !== undefined && value !== '',
    {
        code: 'required',
        message: 'Value is required.',
    },
);

const validation = await validator.validate('');
assert.equal(validation.valid, false);
assert.equal(validation.issues[0].code, 'required');

assert.throws(
    () => {
        throw new ToolValidationError(
            'Invalid input.',
            validation.issues,
        );
    },
    ToolError,
);

const kernel = createToolKernel({
    namespace: 'core-runtime-v1-test',
});

assert.ok(kernel instanceof ToolKernel);
await kernel.disposeAsync();

cache.destroy();
events.destroy();

console.log('Core Runtime v1.0 integration verification passed.');

// END OF FILE
