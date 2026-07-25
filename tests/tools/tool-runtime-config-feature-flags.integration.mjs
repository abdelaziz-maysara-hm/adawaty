/**
 * @file Runtime configuration and feature flag integration verification.
 */
import assert from 'node:assert/strict';
import { ToolConfigError, ToolDirectory, ToolRuntimeConfigManager, ToolRuntimeFeatureFlags } from '../../src/tools/index.js';

const config=new ToolRuntimeConfigManager({defaults:{ui:{theme:'light'},api:{timeout:1000}},environment:{api:{timeout:2000}}});
config.set('ui.locale','ar');
config.set('ui.theme','dark',{toolId:'editor',layer:'tool'});
assert.equal(config.get('api.timeout'),2000);
assert.equal(config.get('ui.theme'), 'light');
assert.equal(config.get('ui.theme',{toolId:'editor'}),'dark');
config.registerSchema('api',{properties:{api:{type:'object',required:true,properties:{timeout:{type:'number',required:true}}}}});
assert.equal(config.snapshot('editor').values.ui.locale,'ar');
assert.throws(()=>config.get('missing',{required:true}),e=>e instanceof ToolConfigError&&e.code==='TOOL_CONFIG_REQUIRED');

const flags=new ToolRuntimeFeatureFlags();
flags.register({id:'new-ui',defaultValue:false,rules:[{when:{role:'admin'},value:true}]});
flags.register({id:'beta-mode',defaultValue:false,prerequisites:[{id:'new-ui',value:true}],rollout:100});
flags.register({id:'theme-variant',type:'variant',defaultValue:'classic',rollout:{variants:[{value:'modern',percentage:100}]}});
assert.equal(flags.isEnabled('new-ui',{role:'user'}),false);
assert.equal(flags.isEnabled('new-ui',{role:'admin'}),true);
assert.equal(flags.isEnabled('beta-mode',{role:'admin',subjectKey:'a'}),true);
assert.equal(flags.evaluate('theme-variant',{subjectKey:'a'}),'modern');
flags.override('new-ui',true,{toolId:'editor'});
assert.equal(flags.isEnabled('new-ui',{toolId:'editor'}),true);
assert.equal(flags.removeOverride('new-ui',{toolId:'editor'}),true);

const directory=new ToolDirectory({config:{defaults:{shared:{message:'hello'}}}});
directory.setConfig('tool.enabled',true,{toolId:'config-tool',layer:'tool'});
directory.registerFeatureFlag({id:'runtime-feature',defaultValue:true});
directory.initialize({categories:[{id:'tests',name:'Tests',description:'Configuration tests.'}],tools:[{id:'config-tool',name:'Config Tool',description:'Uses runtime config.',category:'tests',loader:async()=>({default:{mount(context){context.target.message=context.config.get('shared.message');context.target.enabled=context.config.get('tool.enabled');context.target.feature=context.features.isEnabled('runtime-feature');}}})}]});
const target={};
await directory.mountTool('config-tool',target,{slot:'workspace'});
assert.deepEqual(target,{message:'hello',enabled:true,feature:true});
assert.equal(directory.getConfigSnapshot('config-tool').values.tool.enabled,true);
assert.equal(directory.getFeatureFlagSnapshot().flagCount,1);
await directory.clearAsync();
console.log('Sprint 5 Batch 17 configuration and feature flags verification passed.');
// END OF FILE
