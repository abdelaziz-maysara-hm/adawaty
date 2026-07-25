import { readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const testsRoot = path.join(projectRoot, 'tests');

async function collectTests(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const entryPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            files.push(...await collectTests(entryPath));
        } else if (entry.isFile() && entry.name.endsWith('.mjs')) {
            files.push(entryPath);
        }
    }

    return files.sort((left, right) => left.localeCompare(right));
}

function runTest(testPath) {
    return new Promise((resolve) => {
        const relativePath = path.relative(projectRoot, testPath);
        const child = spawn(process.execPath, [testPath], {
            cwd: projectRoot,
            stdio: 'inherit',
        });

        child.once('error', (error) => {
            resolve({ relativePath, exitCode: 1, error });
        });

        child.once('exit', (exitCode, signal) => {
            resolve({
                relativePath,
                exitCode: exitCode ?? 1,
                signal,
            });
        });
    });
}

const tests = await collectTests(testsRoot);
const failures = [];

for (const testPath of tests) {
    const relativePath = path.relative(projectRoot, testPath);
    process.stdout.write(`\n[TEST] ${relativePath}\n`);

    const result = await runTest(testPath);

    if (result.exitCode !== 0) {
        failures.push(result);
    }
}

process.stdout.write(
    `\nTest summary: ${tests.length - failures.length} passed, ${failures.length} failed, ${tests.length} total.\n`,
);

if (failures.length > 0) {
    for (const failure of failures) {
        const detail = failure.error?.message
            ?? (failure.signal ? `terminated by ${failure.signal}` : `exit code ${failure.exitCode}`);
        process.stderr.write(`- ${failure.relativePath}: ${detail}\n`);
    }

    process.exitCode = 1;
}

// END OF FILE
