import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Skip prepare step when running inside Vercel build to avoid bundling
// large browser runtimes into serverless function packages (which causes
// "bundle size exceeds maximum function size" errors).
// Vercel sets the environment variable VERCEL=1 during build.
if (process.env.VERCEL === '1' || process.env.SKIP_PREPARE_MEDIA_RUNTIME === '1') {
    console.log('Skipping prepare-media-runtime in Vercel build (VERCEL=%s, SKIP_PREPARE_MEDIA_RUNTIME=%s)', process.env.VERCEL, process.env.SKIP_PREPARE_MEDIA_RUNTIME);
    process.exit(0);
}

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
