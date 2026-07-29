import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packages = [
    { source: 'node_modules/@ffmpeg/ffmpeg/dist/esm', target: 'src/vendor/ffmpeg' },
    { source: 'node_modules/@ffmpeg/util/dist/esm', target: 'src/vendor/ffmpeg-util' },
];

for (const { source, target } of packages) {
    const sourcePath = resolve(root, source);
    const targetPath = resolve(root, target);

    await rm(targetPath, { recursive: true, force: true });
    await mkdir(targetPath, { recursive: true });
    await cp(sourcePath, targetPath, {
        recursive: true,
        filter: (path) => !path.endsWith('.d.ts') && !path.endsWith('.d.mts'),
    });
}

console.log('Prepared the same-origin FFmpeg browser runtime.');

// END OF FILE