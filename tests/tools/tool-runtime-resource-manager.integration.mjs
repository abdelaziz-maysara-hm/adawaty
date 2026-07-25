/**
 * @file Runtime resource management integration verification.
 */
import assert from 'node:assert/strict';
import { ToolDirectory, ToolResourceError, ToolRuntimeResourceManager } from '../../src/tools/index.js';

let clock=1000;
const manager=new ToolRuntimeResourceManager({ now:()=>clock, maxResourcesPerOwner:2, idleTimeoutMs:50 });
let disposed=false;
const first=manager.register({ ownerId:'tool:main', type:'timer', value:{}, dispose(){ disposed=true; } });
assert.equal(manager.retain(first.id).referenceCount,2);
assert.equal((await manager.release(first.id,{disposeWhenZero:false})).referenceCount,1);
manager.register({ ownerId:'tool:main', type:'subscription', value:{}, policy:'idle' });
assert.throws(()=>manager.register({ownerId:'tool:main',type:'overflow',value:{}}),(e)=>e instanceof ToolResourceError&&e.code==='TOOL_RESOURCE_QUOTA_EXCEEDED');
clock+=100;
assert.equal(manager.detectLeaks({olderThanMs:50}).leakCount,2);
assert.equal((await manager.cleanupIdle()).disposedCount,1);
assert.equal((await manager.disposeOwner('tool:main')).disposedCount,1);
assert.equal(disposed,true);
assert.equal(manager.getSnapshot().activeCount,0);
manager.register({ownerId:'manual',type:'manual',value:{},policy:'manual'});
assert.equal((await manager.disposeOwner('manual')).disposedCount,0);
assert.equal((await manager.disposeOwner('manual',{includeManual:true})).disposedCount,1);

const directory=new ToolDirectory({resources:{maxResourcesPerOwner:5}});
directory.initialize({ categories:[{id:'tests',name:'Tests',description:'Resource tests.'}], tools:[{ id:'resource-tool', name:'Resource Tool', description:'Resource lifecycle test.', category:'tests', loader:async()=>({ default:{ mount(context){ const h=context.resources.register({type:'listener',value:{}}); context.target.resourceId=h.id; } } }) }] });
const target={};
await directory.mountTool('resource-tool',target,{slot:'workspace'});
assert.equal(directory.getResourceSnapshot().activeCount,1);
assert.equal(directory.detectResourceLeaks().leakCount,1);
await directory.unmountTool('workspace',{reason:'navigation'});
assert.equal(directory.getResourceSnapshot().activeCount,0);
const external=directory.registerResource({ownerId:'external',type:'cache',value:{},policy:'idle'});
await directory.releaseResource(external.id);
assert.equal(directory.getResourceSnapshot().activeCount,0);
assert.equal(directory.getResourceHistory().length>0,true);
await directory.clearAsync();
console.log('Sprint 5 Batch 12 resource management verification passed.');
// END OF FILE
