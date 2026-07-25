/**
 * @file Runtime state persistence and recovery integration verification.
 */

import assert from 'node:assert/strict';

import {
    MemoryToolStateAdapter,
    RuntimeToolLoader,
    ToolDirectory,
    ToolRegistry,
    ToolRuntimeHost,
    ToolRuntimeStateStore,
    ToolStateError,
} from '../../src/tools/index.js';

let clock = 1_000;
const adapter = new MemoryToolStateAdapter();
const store = new ToolRuntimeStateStore({
    adapter,
    namespace: 'tests',
    version: 2,
    maxBytes: 4_096,
    ttlMs: 100,
    now: () => clock,
    migrations: {
        1(state) {
            return {
                ...state,
                migrated: true,
            };
        },
    },
});

const saved = await store.save(
    'editor',
    'main',
    {
        value: 'draft',
    },
    {
        metadata: {
            locale: 'ar',
        },
    },
);

assert.equal(saved.version, 2);
assert.equal(saved.state.value, 'draft');
assert.equal(Object.isFrozen(saved.state), true);

const loaded = await store.load('editor', 'main');
assert.deepEqual(loaded.state, {
    value: 'draft',
});
assert.equal(loaded.metadata.locale, 'ar');

await adapter.set('tests:legacy:default', {
    toolId: 'legacy',
    slot: 'default',
    version: 1,
    savedAt: clock,
    expiresAt: null,
    metadata: {},
    state: {
        value: 1,
    },
});

const migrated = await store.load('legacy', 'default');
assert.equal(migrated.version, 2);
assert.equal(migrated.state.migrated, true);

await assert.rejects(
    store.save('oversized', 'default', {
        value: 'x'.repeat(10_000),
    }),
    (error) =>
        error instanceof ToolStateError &&
        error.code === 'TOOL_STATE_TOO_LARGE',
);

clock += 101;
assert.equal(await store.load('editor', 'main'), null);

await store.save('alpha', 'main', {
    count: 1,
});
await store.save('beta', 'side', {
    count: 2,
});

const exported = await store.exportSnapshot();
assert.equal(exported.recordCount, 3);

const importedStore = new ToolRuntimeStateStore({
    namespace: 'imported',
});
const imported = await importedStore.importSnapshot(exported, {
    replace: true,
});
assert.equal(imported.importedCount, 3);
assert.equal((await importedStore.getSnapshot()).recordCount, 3);

const registry = new ToolRegistry();
const target = {
    value: '',
};

registry.register({
    id: 'stateful-tool',
    name: 'Stateful Tool',
    description: 'State lifecycle verification.',
    category: 'tests',
    loader: async () => ({
        default: {
            mount(context) {
                context.target.value =
                    context.state.value?.value ?? 'fresh';
            },
            captureState(context) {
                return {
                    value: context.target.value,
                };
            },
            unmount(context) {
                context.target.value = '';
            },
        },
    }),
});

const hostStore = new ToolRuntimeStateStore({
    namespace: 'host',
});
await hostStore.save('stateful-tool', 'main', {
    value: 'restored',
});

const loader = new RuntimeToolLoader({
    toolRegistry: registry,
});
const host = new ToolRuntimeHost({
    loader,
    stateStore: hostStore,
});

await host.mount('stateful-tool', target, {
    slot: 'main',
});
assert.equal(target.value, 'restored');

target.value = 'updated';
await host.unmount('main', {
    reason: 'navigation',
});
assert.equal(target.value, '');
assert.equal(
    (await hostStore.load('stateful-tool', 'main')).state.value,
    'updated',
);

const directory = new ToolDirectory({
    state: {
        namespace: 'directory',
    },
});

directory.initialize({
    categories: [
        {
            id: 'tests',
            name: 'Tests',
            description: 'State tests.',
        },
    ],
    tools: [
        {
            id: 'directory-state',
            name: 'Directory State',
            description: 'Directory state verification.',
            category: 'tests',
            loader: async () => ({
                default(context) {
                    context.target.value =
                        context.state.value?.value ?? 'empty';

                    return () => {
                        context.target.value = '';
                    };
                },
            }),
        },
    ],
});

await directory.saveToolState(
    'directory-state',
    'workspace',
    {
        value: 'persisted',
    },
);

const directoryTarget = {
    value: '',
};

await directory.mountTool('directory-state', directoryTarget, {
    slot: 'workspace',
});
assert.equal(directoryTarget.value, 'persisted');
assert.equal(
    (await directory.getStateSnapshot()).recordCount,
    1,
);

const directoryExport = await directory.exportToolState();
assert.equal(directoryExport.recordCount, 1);
assert.equal(
    await directory.clearToolState(
        'directory-state',
        'workspace',
    ),
    true,
);
assert.equal(
    await directory.loadToolState(
        'directory-state',
        'workspace',
    ),
    null,
);

await directory.importToolState(directoryExport);
assert.equal(
    (
        await directory.loadToolState(
            'directory-state',
            'workspace',
        )
    ).state.value,
    'persisted',
);

await directory.clearAsync();

console.log('Sprint 5 Batch 10 runtime state persistence verification passed.');

// END OF FILE
