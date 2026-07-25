/**
 * @file Runtime diagnostics and health center integration verification.
 */
import assert from 'node:assert/strict';
import { ToolDirectory, ToolRuntimeDiagnosticsCenter } from '../../src/tools/index.js';

const center = new ToolRuntimeDiagnosticsCenter({ timeoutMs: 100, historyLimit: 20 });
center.registerProbe({ id: 'healthy', check: () => true, tags: ['core'] });
center.registerProbe({ id: 'degraded', check: () => ({ status: 'degraded', message: 'slow' }) });
center.registerProbe({ id: 'failure', critical: true, check: () => { throw new Error('offline'); } });
center.registerSource('sample', () => ({ value: 1 }));
const report = await center.check();
assert.equal(report.status, 'unhealthy');
assert.equal(report.counts.healthy, 1);
assert.equal(report.counts.degraded, 1);
assert.equal(report.counts.unhealthy, 1);
assert.equal(Object.isFrozen(report), true);
const diagnosis = await center.diagnose({ probeIds: ['healthy'] });
assert.equal(diagnosis.health.status, 'healthy');
assert.equal(diagnosis.sources.sample.value, 1);

const directory = new ToolDirectory();
directory.registerDiagnosticProbe({ id: 'directory-ready', check: ({ context }) => ({ healthy: context.directory !== null }) });
directory.initialize({
    categories: [{ id: 'tests', name: 'Tests', description: 'Diagnostics tests.' }],
    tools: [{
        id: 'diagnostic-tool', name: 'Diagnostic Tool', description: 'Runtime diagnostics tool.', category: 'tests',
        loader: async () => ({ default: { mount(context) {
            context.diagnostics.register({ id: 'tool-probe', check: () => ({ status: 'healthy', details: { mounted: true } }) });
        } } }),
    }],
});
const target = {};
await directory.mountTool('diagnostic-tool', target, { slot: 'workspace' });
let runtimeReport = await directory.checkRuntimeHealth();
assert.equal(runtimeReport.results.some((item) => item.id === 'tool-probe'), true);
const full = await directory.diagnoseRuntime({ probeIds: ['directory-ready'] });
assert.equal(full.sources.directory.toolCount, 1);
assert.equal(full.sources.runtimeHost.mountedCount, 1);
await directory.unmountTool('workspace', { reason: 'test' });
runtimeReport = await directory.checkRuntimeHealth();
assert.equal(runtimeReport.results.some((item) => item.id === 'tool-probe'), false);
await directory.clearAsync();
console.log('Sprint 5 Batch 20 diagnostics center verification passed.');
// END OF FILE
