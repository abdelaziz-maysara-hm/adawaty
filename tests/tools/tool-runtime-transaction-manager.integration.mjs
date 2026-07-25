import assert from 'node:assert/strict';

import {
    ToolRuntimeTransactionManager,
    ToolTransactionError,
} from '../../src/tools/tool-runtime-transaction-manager.js';

let clock = 1_000;
let sequence = 0;
const manager = new ToolRuntimeTransactionManager({
    historyLimit: 2,
    now: () => clock,
    createId: () => `transaction-${++sequence}`,
});

const committed = [];
const result = await manager.run(
    {
        label: 'commit-example',
        metadata: { toolId: 'bmi-calculator' },
    },
    async (transaction) => {
        assert.equal(transaction.id, 'transaction-1');
        assert.equal(transaction.metadata.toolId, 'bmi-calculator');
        transaction.deferCommit(() => committed.push('first'));
        transaction.deferCommit(() => committed.push('second'));
        clock += 5;
        return 42;
    },
);

assert.equal(result, 42);
assert.deepEqual(committed, ['first', 'second']);

const rolledBack = [];

await assert.rejects(
    manager.run({ id: 'failing-transaction' }, async (transaction) => {
        transaction.deferRollback(() => rolledBack.push('first'));
        transaction.deferRollback(() => rolledBack.push('second'));
        clock += 3;
        throw new Error('operation failed');
    }),
    (error) => {
        assert.ok(error instanceof ToolTransactionError);
        assert.equal(error.code, 'TOOL_TRANSACTION_ROLLED_BACK');
        assert.equal(error.transactionId, 'failing-transaction');
        assert.equal(error.cause.message, 'operation failed');
        return true;
    },
);

assert.deepEqual(rolledBack, ['second', 'first']);

let release;
const pending = manager.run({ id: 'pending' }, async (transaction) => {
    transaction.deferRollback(() => rolledBack.push('aborted'));
    await new Promise((resolve) => {
        release = resolve;
    });
});

await Promise.resolve();
assert.equal(manager.getSnapshot().activeCount, 1);
assert.equal(manager.abort('pending'), true);
release();
await assert.rejects(pending, ToolTransactionError);

const snapshot = manager.getSnapshot();
assert.equal(snapshot.activeCount, 0);
assert.equal(snapshot.started, 3);
assert.equal(snapshot.committed, 1);
assert.equal(snapshot.rolledBack, 2);
assert.equal(snapshot.failed, 2);
assert.equal(manager.getHistory().length, 2);

assert.equal(manager.clearHistory(), 2);
assert.equal(manager.getHistory().length, 0);

console.log('Sprint 5 Batch 22 runtime transaction verification passed.');

// END OF FILE
