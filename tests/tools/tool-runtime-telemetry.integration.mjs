/**
 * @file Runtime telemetry integration verification.
 */
import assert from 'node:assert/strict';
import { ToolDirectory, ToolRuntimeTelemetry } from '../../src/tools/index.js';

const telemetry = new ToolRuntimeTelemetry({ historyLimit: 20, slowOperationMs: 0 });
telemetry.increment('requests.total', 2, { labels: { route: 'home' } });
telemetry.gauge('workers.active', 3);
telemetry.histogram('request.duration', 10);
telemetry.histogram('request.duration', 30);
const snapshot = telemetry.getSnapshot();
assert.equal(snapshot.metricCount, 3);
assert.equal(snapshot.metrics.find((item) => item.name === 'requests.total').value, 2);
assert.equal(snapshot.metrics.find((item) => item.name === 'request.duration').average, 20);
assert.equal(Object.isFrozen(snapshot), true);

const trace = telemetry.startTrace({ name: 'load' });
const finished = telemetry.finishTrace(trace.traceId, trace.spanId);
assert.equal(finished.status, 'ok');
assert.equal(finished.spans.length, 1);
await telemetry.span('async-work', async () => 42);
assert.equal(telemetry.getSnapshot().completedTraceCount, 2);

const directory = new ToolDirectory();
directory.initialize({
    categories: [{ id: 'tests', name: 'Tests', description: 'Telemetry tests.' }],
    tools: [{
        id: 'telemetry-tool', name: 'Telemetry Tool', description: 'Runtime telemetry tool.', category: 'tests',
        loader: async () => ({ default: { mount(context) {
            context.telemetry.counter('tool.mounts');
            context.telemetry.gauge('tool.ready', 1);
        } } }),
    }],
});
await directory.mountTool('telemetry-tool', {}, { slot: 'workspace' });
assert.equal(directory.getTelemetrySnapshot().metrics.some((item) => item.name === 'tool.mounts'), true);
await directory.unmountTool('workspace', { reason: 'test' });
assert.equal(directory.getTelemetrySnapshot().metrics.some((item) => item.name === 'tool.mounts'), false);
directory.recordMetric('directory.calls', 1, { type: 'counter' });
assert.equal(directory.getTelemetryHistory().length > 0, true);
await directory.clearAsync();
console.log('Sprint 5 Batch 21 telemetry verification passed.');
// END OF FILE
