import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const mediaRuntime = await readFile('src/product/ffmpeg-processing.js', 'utf8');
const deployWorkflow = await readFile('.github/workflows/deploy.yml', 'utf8');
const prepareScript = await readFile('scripts/prepare-media-runtime.mjs', 'utf8');

assert.match(mediaRuntime, /new URL\('\.\.\/vendor\/ffmpeg\/index\.js', import\.meta\.url\)/);
assert.match(mediaRuntime, /new URL\('\.\.\/vendor\/ffmpeg-util\/index\.js', import\.meta\.url\)/);
assert.doesNotMatch(mediaRuntime, /@ffmpeg\/ffmpeg@[^']+\/\+esm/);
assert.match(deployWorkflow, /npm ci --ignore-scripts/);
assert.match(deployWorkflow, /npm run prepare:media-runtime/);
assert.match(prepareScript, /node_modules\/@ffmpeg\/ffmpeg\/dist\/esm/);
assert.match(prepareScript, /node_modules\/@ffmpeg\/util\/dist\/esm/);

for (const runtimeFile of [
    'src/vendor/ffmpeg/index.js',
    'src/vendor/ffmpeg/worker.js',
    'src/vendor/ffmpeg-util/index.js',
]) {
    await access(runtimeFile);
}

console.log('Same-origin FFmpeg deployment contract passed.');

// END OF FILE