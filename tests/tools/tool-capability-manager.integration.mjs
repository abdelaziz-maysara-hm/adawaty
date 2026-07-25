/**
 * @file Plugin runtime capability integration verification.
 */
import assert from 'node:assert/strict';
import {
    ToolCapabilityError,
    ToolCapabilityManager,
    ToolDirectory,
    compareVersions,
} from '../../src/tools/index.js';

let clock = 1000;
const manager = new ToolCapabilityManager({
    apiVersion: '1.2.0',
    now: () => clock,
    capabilities: [
        { id: 'storage.read', version: '1.0.0' },
        { id: 'storage.write', version: '1.1.0' },
        { id: 'clipboard.read', version: '1.0.0', optional: true },
    ],
});
assert.equal(compareVersions('1.2.0','1.1.9'),1);
const negotiation = manager.negotiate({
    required: ['storage.read'],
    optional: ['clipboard.read','network.fetch'],
    minimumApiVersion: '1.0.0',
});
assert.deepEqual(negotiation.granted, ['clipboard.read','storage.read']);
assert.deepEqual(negotiation.unavailableOptional, ['network.fetch']);
assert.throws(() => manager.negotiate({ required:['missing'] }), (e)=>e instanceof ToolCapabilityError && e.code==='TOOL_CAPABILITY_UNAVAILABLE');
const token = manager.issueToken({
    toolId: 'editor', required:['storage.read'], optional:['storage.write'], ttlMs:50,
});
assert.equal(manager.require(token.id,'storage.read'),true);
assert.throws(() => manager.require(token.id,'clipboard.read'), (e)=>e.code==='TOOL_CAPABILITY_DENIED');
const facade = manager.createServiceFacade(token.id, { read(){return 1;}, write(){return 2;}, admin(){return 3;} }, { read:'storage.read', write:'storage.write', admin:'admin' });
assert.deepEqual(Object.keys(facade), ['read','write']);
clock += 51;
assert.throws(() => manager.require(token.id,'storage.read'), (e)=>e.code==='TOOL_CAPABILITY_TOKEN_EXPIRED');

const directory = new ToolDirectory({
    capabilities: {
        apiVersion: '1.0.0',
        capabilities: [
            { id: 'service.echo', version: '1.0.0' },
        ],
    },
});
directory.initialize({
    categories:[{id:'tests',name:'Tests',description:'Capability tests.'}],
    tools:[{
        id:'capability-tool', name:'Capability Tool', description:'Capability runtime test.', category:'tests',
        loader: async()=>({ default:{ mount(context){
            context.capabilities.require('service.echo');
            context.target.echo = context.services.echo('ok');
            context.target.tokenId = context.capabilities.token.id;
        }}}),
    }],
});
const target={};
await directory.mountTool('capability-tool', target, {
    slot:'main', capabilities:['service.echo'],
    services:{ echo:(value)=>value, secret:()=>false },
    serviceCapabilities:{ echo:'service.echo', secret:'service.secret' },
});
assert.equal(target.echo,'ok');
assert.equal(directory.getCapabilitySnapshot().activeTokenCount,1);
assert.equal(directory.discoverCapabilities().capabilities.length,1);
await directory.unmountTool('main');
assert.equal(directory.getCapabilitySnapshot().activeTokenCount,0);
assert.ok(directory.getCapabilityAuditLog().some((entry)=>entry.type==='token-revoked'));
await directory.clearAsync();
console.log('Sprint 5 Batch 13 plugin capability verification passed.');
// END OF FILE
