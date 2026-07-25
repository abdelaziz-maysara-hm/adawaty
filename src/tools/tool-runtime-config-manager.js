/**
 * @file Runtime configuration manager.
 * @module tools/tool-runtime-config-manager
 */

const DEFAULT_HISTORY_LIMIT = 500;

class ToolConfigError extends Error {
    constructor(message, options = {}) {
        super(message, { cause: options.cause });
        this.name = 'ToolConfigError';
        this.code = options.code ?? 'TOOL_CONFIG_FAILED';
        this.path = options.path ?? '';
        this.toolId = options.toolId ?? '';
    }
}

class ToolRuntimeConfigManager {
    constructor(options = {}) {
        this.now = options.now ?? (() => Date.now());
        this.historyLimit = positiveInteger(options.historyLimit, DEFAULT_HISTORY_LIMIT, 'historyLimit');
        this.reporter = options.reporter === undefined ? null : requireFunction(options.reporter, 'reporter');
        this.global = deepClone(options.defaults ?? {});
        this.environment = deepClone(options.environment ?? {});
        this.runtime = {};
        this.tools = new Map();
        this.schemas = new Map();
        this.history = [];
        this.version = 0;
    }

    set(path, value, options = {}) {
        const normalizedPath = normalizePath(path);
        const toolId = optionalText(options.toolId);
        const layer = normalizeLayer(options.layer);
        const target = this.getMutableTarget(layer, toolId);
        setPath(target, normalizedPath, deepClone(value));
        this.validateTarget(toolId);
        this.version += 1;
        this.record('set', { path: normalizedPath, toolId, layer, version: this.version });
        return value;
    }

    get(path, options = {}) {
        const normalizedPath = normalizePath(path);
        const snapshot = this.snapshot(options.toolId);
        const value = getPath(snapshot.values, normalizedPath);
        if (value === undefined && options.required === true) {
            throw new ToolConfigError(`Configuration path "${normalizedPath}" is required.`, {
                code: 'TOOL_CONFIG_REQUIRED', path: normalizedPath, toolId: optionalText(options.toolId),
            });
        }
        return value === undefined ? options.fallback : deepClone(value);
    }

    has(path, options = {}) {
        return getPath(this.snapshot(options.toolId).values, normalizePath(path)) !== undefined;
    }

    remove(path, options = {}) {
        const normalizedPath = normalizePath(path);
        const toolId = optionalText(options.toolId);
        const layer = normalizeLayer(options.layer);
        const target = this.getMutableTarget(layer, toolId);
        const removed = deletePath(target, normalizedPath);
        if (removed) {
            this.validateTarget(toolId);
            this.version += 1;
            this.record('removed', { path: normalizedPath, toolId, layer, version: this.version });
        }
        return removed;
    }

    registerSchema(schemaId, schema, options = {}) {
        const id = requiredText(schemaId, 'schemaId');
        if (!schema || typeof schema !== 'object') throw new TypeError('schema must be an object.');
        const toolId = optionalText(options.toolId);
        this.schemas.set(`${toolId}:${id}`, { id, toolId, schema: deepClone(schema) });
        this.validateTarget(toolId);
        this.record('schema-registered', { schemaId: id, toolId });
        return Object.freeze({ id, toolId });
    }

    snapshot(toolId = '') {
        const id = optionalText(toolId);
        const values = deepMerge({}, this.global, this.environment, this.runtime, this.tools.get(id) ?? {});
        return Object.freeze({ version: this.version, toolId: id, values: deepFreeze(values) });
    }

    getHistory() { return Object.freeze([...this.history]); }
    clearHistory() { const n=this.history.length; this.history=[]; return n; }
    clear() { this.global={}; this.environment={}; this.runtime={}; this.tools.clear(); this.schemas.clear(); this.clearHistory(); this.version=0; }

    getMutableTarget(layer, toolId) {
        if (layer === 'global') return this.global;
        if (layer === 'environment') return this.environment;
        if (layer === 'runtime') return this.runtime;
        if (!toolId) throw new ToolConfigError('Tool layer requires toolId.', { code:'TOOL_CONFIG_TOOL_REQUIRED' });
        if (!this.tools.has(toolId)) this.tools.set(toolId, {});
        return this.tools.get(toolId);
    }

    validateTarget(toolId) {
        const snapshot = deepMerge({}, this.global, this.environment, this.runtime, this.tools.get(toolId) ?? {});
        for (const entry of this.schemas.values()) {
            if (entry.toolId && entry.toolId !== toolId) continue;
            validateSchema(snapshot, entry.schema, '', toolId);
        }
    }

    record(type, details) {
        const entry=Object.freeze({type,timestamp:this.now(),...details});
        this.history.push(entry);
        if (this.history.length>this.historyLimit) this.history.splice(0,this.history.length-this.historyLimit);
        if (this.reporter) Promise.resolve(this.reporter(entry)).catch(()=>undefined);
    }
}

function validateSchema(value, schema, path, toolId) {
    if (schema.required === true && value === undefined) throw new ToolConfigError(`Missing required configuration "${path || '<root>'}".`, {code:'TOOL_CONFIG_SCHEMA_REQUIRED',path,toolId});
    if (value === undefined) return;
    if (schema.type && !matchesType(value, schema.type)) throw new ToolConfigError(`Invalid type for configuration "${path || '<root>'}".`, {code:'TOOL_CONFIG_SCHEMA_TYPE',path,toolId});
    if (schema.properties && value && typeof value === 'object' && !Array.isArray(value)) {
        for (const [key, child] of Object.entries(schema.properties)) validateSchema(value[key], child, path ? `${path}.${key}` : key, toolId);
    }
}
function matchesType(value,type){ if(type==='array') return Array.isArray(value); if(type==='null') return value===null; if(type==='integer') return Number.isInteger(value); return typeof value===type; }
function normalizeLayer(value){ const v=value??'runtime'; if(['global','environment','runtime','tool'].includes(v))return v; throw new TypeError('layer must be global, environment, runtime or tool.'); }
function normalizePath(value){ const p=requiredText(value,'path'); if(!/^[a-z0-9_-]+(?:\.[a-z0-9_-]+)*$/i.test(p)) throw new TypeError(`Invalid configuration path "${p}".`); return p; }
function getPath(obj,path){ return path.split('.').reduce((v,k)=>v==null?undefined:v[k],obj); }
function setPath(obj,path,value){ const keys=path.split('.'); let cur=obj; for(const key of keys.slice(0,-1)){ if(!cur[key]||typeof cur[key]!=='object'||Array.isArray(cur[key]))cur[key]={}; cur=cur[key]; } cur[keys.at(-1)]=value; }
function deletePath(obj,path){ const keys=path.split('.'); let cur=obj; for(const key of keys.slice(0,-1)){ if(!cur[key]||typeof cur[key]!=='object')return false; cur=cur[key]; } return delete cur[keys.at(-1)]; }
function deepMerge(target,...sources){ for(const src of sources){ if(!src||typeof src!=='object')continue; for(const [k,v] of Object.entries(src)){ if(v&&typeof v==='object'&&!Array.isArray(v)) target[k]=deepMerge(target[k]&&typeof target[k]==='object'?target[k]:{},v); else target[k]=deepClone(v); } } return target; }
function deepClone(v){ if(v===undefined)return undefined; if(typeof structuredClone==='function')return structuredClone(v); return JSON.parse(JSON.stringify(v)); }
function deepFreeze(v){ if(!v||typeof v!=='object'||Object.isFrozen(v))return v; Object.freeze(v); for(const x of Object.values(v))deepFreeze(x); return v; }
function requiredText(v,f){const t=String(v??'').trim(); if(!t)throw new TypeError(`${f} is required.`); return t;}
function optionalText(v){return String(v??'').trim();}
function requireFunction(v,f){if(typeof v!=='function')throw new TypeError(`${f} must be a function.`);return v;}
function positiveInteger(v,d,f){if(v===undefined)return d;if(!Number.isFinite(v)||v<1)throw new TypeError(`${f} must be positive.`);return Math.trunc(v);}

export { ToolConfigError, ToolRuntimeConfigManager };
// END OF FILE
