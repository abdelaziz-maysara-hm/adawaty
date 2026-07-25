/**
 * @file Runtime feature flag engine.
 * @module tools/tool-runtime-feature-flags
 */

const DEFAULT_HISTORY_LIMIT = 500;

class ToolFeatureFlagError extends Error {
    constructor(message, options = {}) {
        super(message, { cause: options.cause });
        this.name = 'ToolFeatureFlagError';
        this.code = options.code ?? 'TOOL_FEATURE_FLAG_FAILED';
        this.flagId = options.flagId ?? '';
    }
}

class ToolRuntimeFeatureFlags {
    constructor(options = {}) {
        this.now = options.now ?? (() => Date.now());
        this.historyLimit = positiveInteger(options.historyLimit, DEFAULT_HISTORY_LIMIT, 'historyLimit');
        this.flags = new Map();
        this.overrides = new Map();
        this.history = [];
    }

    register(definition, options = {}) {
        if (!definition || typeof definition !== 'object') throw new TypeError('flag definition must be an object.');
        const id=requiredText(definition.id,'flag.id');
        if(this.flags.has(id)&&options.override!==true) throw new ToolFeatureFlagError(`Feature flag "${id}" already exists.`,{code:'TOOL_FEATURE_FLAG_DUPLICATE',flagId:id});
        const record={
            id,
            type: definition.type ?? inferType(definition.defaultValue),
            defaultValue: definition.defaultValue ?? false,
            variants: Object.freeze([...(definition.variants ?? [])]),
            rollout: normalizeRollout(definition.rollout),
            prerequisites: Object.freeze([...(definition.prerequisites ?? [])].map(normalizePrerequisite)),
            rules: Object.freeze([...(definition.rules ?? [])].map(normalizeRule)),
            metadata: Object.freeze({...(definition.metadata ?? {})}),
            registeredAt:this.now(),
        };
        if(!['boolean','variant'].includes(record.type))throw new TypeError('flag.type must be boolean or variant.');
        this.flags.set(id,record);
        this.record('registered',{flagId:id});
        return this.snapshotRecord(record);
    }

    evaluate(flagId, context = {}, options = {}) {
        const id=requiredText(flagId,'flagId');
        const record=this.flags.get(id);
        if(!record){ if('fallback' in options)return options.fallback; throw new ToolFeatureFlagError(`Feature flag "${id}" is not registered.`,{code:'TOOL_FEATURE_FLAG_NOT_FOUND',flagId:id}); }
        const override=this.resolveOverride(id,context);
        let value;
        let reason;
        if(override.found){ value=override.value; reason='override'; }
        else if(!this.prerequisitesPass(record,context)){ value=record.defaultValue; reason='prerequisite'; }
        else {
            const rule=record.rules.find(r=>matchesRule(r,context));
            if(rule){ value=rule.value; reason='rule'; }
            else if(record.rollout){ value=evaluateRollout(record,context); reason='rollout'; }
            else { value=record.defaultValue; reason='default'; }
        }
        this.record('evaluated',{flagId:id,value,reason,contextKey:stableKey(context)});
        return options.details===true?Object.freeze({flagId:id,value,reason}):value;
    }

    isEnabled(flagId, context = {}, options = {}) { return this.evaluate(flagId,context,{...options,fallback:options.fallback??false})===true; }

    override(flagId, value, options = {}) {
        const id=requiredText(flagId,'flagId');
        if(!this.flags.has(id))throw new ToolFeatureFlagError(`Feature flag "${id}" is not registered.`,{code:'TOOL_FEATURE_FLAG_NOT_FOUND',flagId:id});
        const key=overrideKey(id,options.toolId,options.environment);
        this.overrides.set(key,{flagId:id,value,toolId:optionalText(options.toolId),environment:optionalText(options.environment),updatedAt:this.now()});
        this.record('overridden',{flagId:id,toolId:optionalText(options.toolId),environment:optionalText(options.environment)});
        return value;
    }

    removeOverride(flagId, options = {}) { const removed=this.overrides.delete(overrideKey(requiredText(flagId,'flagId'),options.toolId,options.environment)); if(removed)this.record('override-removed',{flagId}); return removed; }
    getSnapshot(){return Object.freeze({flagCount:this.flags.size,overrideCount:this.overrides.size,flags:Object.freeze([...this.flags.values()].map(r=>this.snapshotRecord(r)))});}
    getHistory(){return Object.freeze([...this.history]);}
    clearHistory(){const n=this.history.length;this.history=[];return n;}
    clear(){this.flags.clear();this.overrides.clear();this.clearHistory();}

    prerequisitesPass(record,context){ return record.prerequisites.every(p=>this.evaluate(p.id,context,{fallback:false})===p.value); }
    resolveOverride(id,context){ const keys=[overrideKey(id,context.toolId,context.environment),overrideKey(id,'',context.environment),overrideKey(id,context.toolId,''),overrideKey(id,'','')]; for(const key of keys){if(this.overrides.has(key))return {found:true,value:this.overrides.get(key).value};} return {found:false}; }
    snapshotRecord(r){return Object.freeze({id:r.id,type:r.type,defaultValue:r.defaultValue,variants:r.variants,rollout:r.rollout,prerequisites:r.prerequisites,rules:r.rules,metadata:r.metadata,registeredAt:r.registeredAt});}
    record(type,details){const e=Object.freeze({type,timestamp:this.now(),...details});this.history.push(e);if(this.history.length>this.historyLimit)this.history.splice(0,this.history.length-this.historyLimit);}
}

function evaluateRollout(record,context){ const key=String(context.subjectKey??context.userId??context.toolId??stableKey(context)); const bucket=hash(`${record.id}:${key}`)%10000/100; if(record.type==='boolean')return bucket<record.rollout.percentage; let cumulative=0; for(const item of record.rollout.variants){cumulative+=item.percentage;if(bucket<cumulative)return item.value;} return record.defaultValue; }
function matchesRule(rule,context){return Object.entries(rule.when).every(([k,v])=>context[k]===v);}
function normalizeRule(v){if(!v||typeof v!=='object'||!v.when||!('value'in v))throw new TypeError('feature rule requires when and value.');return Object.freeze({when:Object.freeze({...v.when}),value:v.value});}
function normalizePrerequisite(v){if(typeof v==='string')return Object.freeze({id:v,value:true});if(!v||typeof v!=='object')throw new TypeError('prerequisite must be string or object.');return Object.freeze({id:requiredText(v.id,'prerequisite.id'),value:'value'in v?v.value:true});}
function normalizeRollout(v){if(v===undefined||v===null)return null;if(typeof v==='number')return Object.freeze({percentage:bounded(v),variants:Object.freeze([])});if(typeof v!=='object')throw new TypeError('rollout must be number or object.');return Object.freeze({percentage:bounded(v.percentage??0),variants:Object.freeze([...(v.variants??[])].map(x=>Object.freeze({value:x.value,percentage:bounded(x.percentage)})))});}
function bounded(v){if(!Number.isFinite(v)||v<0||v>100)throw new TypeError('percentage must be between 0 and 100.');return v;}
function inferType(v){return typeof v==='boolean'?'boolean':'variant';}
function overrideKey(id,toolId,environment){return `${id}|${optionalText(toolId)}|${optionalText(environment)}`;}
function stableKey(v){try{return JSON.stringify(v,Object.keys(v).sort());}catch{return String(v);}}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function requiredText(v,f){const t=String(v??'').trim();if(!t)throw new TypeError(`${f} is required.`);return t;}
function optionalText(v){return String(v??'').trim();}
function positiveInteger(v,d,f){if(v===undefined)return d;if(!Number.isFinite(v)||v<1)throw new TypeError(`${f} must be positive.`);return Math.trunc(v);}

export { ToolFeatureFlagError, ToolRuntimeFeatureFlags };
// END OF FILE
