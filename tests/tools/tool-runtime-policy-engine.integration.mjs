/**
 * @file Runtime policy engine integration verification.
 */
import assert from 'node:assert/strict';
import { ToolDirectory, ToolPolicyError, ToolRuntimePolicyEngine } from '../../src/tools/index.js';

const engine = new ToolRuntimePolicyEngine({ defaultEffect: 'deny' });
engine.register({ id: 'allow-readers', effect: 'allow', actions: ['read'], resources: ['document:*'], roles: ['reader'] });
engine.register({ id: 'deny-secret', effect: 'deny', priority: 100, actions: ['read'], resources: ['document:secret'] });
engine.register({ id: 'allow-owner-write', effect: 'allow', actions: ['write'], resources: ['document:*'], condition: (request) => request.attributes.ownerId === request.subject });

assert.equal((await engine.authorize({ subject: 'u1', roles: ['reader'], action: 'read', resource: 'document:public' })).allowed, true);
assert.equal((await engine.authorize({ subject: 'u1', roles: ['reader'], action: 'read', resource: 'document:secret' })).allowed, false);
assert.equal((await engine.authorize({ subject: 'u1', action: 'write', resource: 'document:1', attributes: { ownerId: 'u1' } })).allowed, true);
await assert.rejects(() => engine.require({ subject: 'u2', action: 'delete', resource: 'document:1' }), (error) => error instanceof ToolPolicyError && error.code === 'TOOL_POLICY_DENIED');
assert.equal(engine.getSnapshot().evaluationCount, 4);

const directory = new ToolDirectory({ policies: { defaultEffect: 'deny' } });
directory.registerPolicy({ id: 'tool-read', effect: 'allow', actions: ['read'], resources: ['runtime:data'], toolIds: ['secure-tool'] });
directory.initialize({
    categories: [{ id: 'tests', name: 'Tests', description: 'Policy tests.' }],
    tools: [{
        id: 'secure-tool', name: 'Secure Tool', description: 'Policy-aware tool.', category: 'tests',
        loader: async () => ({ default: { async mount(context) {
            context.target.allowed = await context.security.can({ action: 'read', resource: 'runtime:data' });
            context.target.denied = await context.security.can({ action: 'write', resource: 'runtime:data' });
        } } }),
    }],
});
const target = {};
await directory.mountTool('secure-tool', target, { slot: 'workspace' });
assert.equal(target.allowed, true);
assert.equal(target.denied, false);
assert.equal((await directory.authorize({ action: 'read', resource: 'runtime:data', toolId: 'secure-tool' })).allowed, true);
await directory.clearAsync();
console.log('Sprint 5 Batch 18 security policy verification passed.');
// END OF FILE
