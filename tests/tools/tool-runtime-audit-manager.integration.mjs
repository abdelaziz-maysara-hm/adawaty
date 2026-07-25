import assert from 'node:assert/strict';
import { ToolDirectory, ToolRuntimeAuditManager } from '../../src/tools/index.js';

const audit = new ToolRuntimeAuditManager({ historyLimit: 10 });
const first = audit.record({ action: 'service.resolve', actor: { id: 'u1', token: 'secret' }, resource: 'logger', correlationId: 'c1', metadata: { password: 'hidden' } });
assert.equal(first.actor.token, '[REDACTED]');
assert.equal(first.metadata.password, '[REDACTED]');
assert.equal(Object.isFrozen(first), true);
audit.record({ action: 'policy.authorize', outcome: 'denied', correlationId: 'c1', traceId: 't1' });
assert.equal(audit.query({ correlationId: 'c1' }).length, 2);
assert.equal(audit.query({ outcome: 'denied' }).length, 1);
assert.equal(audit.validateIntegrity().valid, true);
assert.equal(JSON.parse(audit.export()).length, 2);

const directory = new ToolDirectory();
directory.initialize({ categories:[{id:'tests',name:'Tests',description:'Tests'}], tools:[{ id:'audit-tool', name:'Audit Tool', description:'Audit integration', category:'tests', loader:async()=>({default:{mount(context){context.audit.record({action:'tool.action',metadata:{token:'x'}}); context.target.count=context.audit.query({action:'tool.action'}).length;}}}) }] });
const target={};
await directory.mountTool('audit-tool',target,{slot:'workspace'});
assert.equal(target.count,1);
assert.equal(directory.getAuditSnapshot().recordCount,1);
assert.equal(directory.getAuditHistory()[0].metadata.token,'[REDACTED]');
await directory.clearAsync();
console.log('Sprint 5 Batch 19 audit compliance verification passed.');
// END OF FILE
