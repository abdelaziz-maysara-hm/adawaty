import { readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoots = [
    path.join(projectRoot, 'src'),
    path.join(projectRoot, 'scripts'),
    path.join(projectRoot, 'tests'),
];

async function collectJavaScriptFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const entryPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            files.push(...await collectJavaScriptFiles(entryPath));
        } else if (entry.isFile() && /\.(?:mjs|js)$/.test(entry.name)) {
            files.push(entryPath);
        }
    }

    return files;
}

function checkFile(filePath) {
    return new Promise((resolve) => {
        const child = spawn(process.execPath, ['--check', filePath], {
            cwd: projectRoot,
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        let stderr = '';

        child.stderr.on('data', (chunk) => {
            stderr += chunk;
        });

        child.once('error', (error) => {
            resolve({ filePath, exitCode: 1, stderr: error.message });
        });

        child.once('exit', (exitCode) => {
            resolve({ filePath, exitCode: exitCode ?? 1, stderr });
        });
    });
}

const files = (await Promise.all(sourceRoots.map(collectJavaScriptFiles)))
    .flat()
    .sort((left, right) => left.localeCompare(right));
const failures = [];

for (const filePath of files) {
    const result = await checkFile(filePath);

    if (result.exitCode !== 0) {
        failures.push(result);
    }
}

if (failures.length > 0) {
    process.stderr.write(`Syntax check failed for ${failures.length} of ${files.length} files.\n`);

    for (const failure of failures) {
        process.stderr.write(`\n${path.relative(projectRoot, failure.filePath)}\n${failure.stderr}`);
    }

    process.exitCode = 1;
} else {
    process.stdout.write(`Syntax check passed for ${files.length} JavaScript files.\n`);
}

// END OF FILE
