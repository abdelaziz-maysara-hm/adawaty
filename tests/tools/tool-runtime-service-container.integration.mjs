import assert from 'node:assert/strict';
import { ToolDirectory, ToolRuntimeServiceContainer, ToolServiceError } from '../../src/tools/index.js';

const container = new ToolRuntimeServiceContainer({ historyLimit: 50 });
let calls = 0;
container.register({ id: 'config', value: { locale: 'ar' }, aliases: ['settings'] });
container.register({ id: 'logger', lifetime: 'singleton', factory() { calls += 1; return { messages: [] }; } });
container.register({ id: 'request-context', lifetime: 'scoped', factory(context) { return { scopeId: context.scopeId }; } });
container.register({ id: 'controller', lifetime: 'transient', dependencies: ['logger','config',{ id:'optional-service', optional:true }], factory(context) { return { ...context.dependencies }; } });
const a=await container.resolve('controller'); const b=await container.resolve('controller');
assert.notEqual(a,b); assert.equal(a.logger,b.logger); assert.equal(calls,1); assert.equal(a.config.locale,'ar'); assert.equal(await container.resolve('settings'),await container.resolve('config')); assert.equal(a['optional-service'],undefined);
const sa=container.createScope('scope-a'); const sb=container.createScope('scope-b');
const a1=await sa.resolve('request-context'); const a2=await sa.resolve('request-context'); const b1=await sb.resolve('request-context');
assert.equal(a1,a2); assert.notEqual(a1,b1); assert.equal(a1.scopeId,'scope-a');
await assert.rejects(()=>container.resolve('request-context'),e=>e instanceof ToolServiceError&&e.code==='TOOL_SERVICE_SCOPE_REQUIRED');
container.register({id:'cycle-a',dependencies:['cycle-b'],factory(){return{};}}); container.register({id:'cycle-b',dependencies:['cycle-a'],factory(){return{};}});
await assert.rejects(()=>container.resolve('cycle-a'),e=>e instanceof ToolServiceError&&e.code==='TOOL_SERVICE_CIRCULAR_DEPENDENCY');
assert.equal(container.getSnapshot().serviceCount>=6,true); assert.deepEqual(container.getGraph().controller.map(d=>d.id),['logger','config','optional-service']);
await sa.dispose(); await sb.dispose();

const directory=new ToolDirectory();
directory.registerService({id:'runtime-message',value:{text:'ready'}});
directory.registerService({id:'tool-state',lifetime:'scoped',factory(context){return{scopeId:context.scopeId,mounts:0};}});
directory.initialize({categories:[{id:'tests',name:'Tests',description:'Service tests.'}],tools:[{id:'service-tool',name:'Service Tool',description:'Runtime service tool.',category:'tests',loader:async()=>({default:{async mount(context){const message=await context.services.resolve('runtime-message'); const state=await context.services.resolve('tool-state'); state.mounts+=1; context.target.message=message.text; context.target.scopeId=state.scopeId;}}})}]});
const target={}; await directory.mountTool('service-tool',target,{slot:'workspace'});
assert.equal(target.message,'ready'); assert.equal(target.scopeId,'service-tool:workspace'); assert.equal(directory.getServiceSnapshot().scopeCount,1);
await directory.unmountTool('workspace',{reason:'navigation'}); assert.equal(directory.getServiceSnapshot().scopeCount,0);
assert.equal(await directory.resolveService('runtime-message'),await directory.resolveService('runtime-message'));
await directory.clearAsync();
console.log('Sprint 5 Batch 16 service container verification passed.');
// END OF FILE
