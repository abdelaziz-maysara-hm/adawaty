const FFMPEG_LOCAL = new URL('../vendor/ffmpeg/index.js', import.meta.url).href;
const UTIL_LOCAL = new URL('../vendor/ffmpeg-util/index.js', import.meta.url).href;
const FFMPEG_CDN = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js';
const UTIL_CDN = 'https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/esm/index.js';
const CORE_BASE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';

let runtimePromise;

async function createRuntime() {
    // Try to load a same-origin (local) vendor copy first (best for local dev).
    // If that fails (e.g., not present in production builds), fall back to CDN modules.
    try {
        const [{ FFmpeg }, { fetchFile, toBlobURL }] = await Promise.all([
            import(FFMPEG_LOCAL),
            import(UTIL_LOCAL),
        ]);
        const ffmpeg = new FFmpeg();
        await ffmpeg.load({
            coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        return { ffmpeg, fetchFile };
    } catch (localErr) {
        // Fallback to CDN modules (no local vendor required in production)
        // Use CDN-hosted core URLs directly.
        const [{ FFmpeg }, { fetchFile }] = await Promise.all([
            import(FFMPEG_CDN),
            import(UTIL_CDN),
        ]);
        const ffmpeg = new FFmpeg();
        await ffmpeg.load({
            coreURL: `${CORE_BASE}/ffmpeg-core.js`,
            wasmURL: `${CORE_BASE}/ffmpeg-core.wasm`,
        });
        return { ffmpeg, fetchFile };
    }
}

function getRuntime() {
    runtimePromise ??= createRuntime().catch((error) => {
        runtimePromise = undefined;
        throw new Error(`Unable to load the media engine: ${error.message}`);
    });
    return runtimePromise;
}

function assertVideoFile(file) {
    if (!(file instanceof File) || !file.type.startsWith('video/')) {
        throw new Error('Please choose a valid video file.');
    }
}

function assertAudioFile(file) {
    if (!(file instanceof File)) {
        throw new Error('Please choose a valid audio file.');
    }
    const name = file.name.toLowerCase();
    const isAudio = file.type.startsWith('audio/')
        || /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|wma|aiff|aif|webm)$/i.test(name);
    if (!isAudio) {
        throw new Error('Please choose a valid audio file.');
    }
}

function assertMediaFile(file) {
    if (!(file instanceof File)) {
        throw new Error('Please choose a valid media file.');
    }
}

function extension(file) {
    const match = file.name.toLowerCase().match(/\.([a-z0-9]+)$/);
    return match?.[1] ?? 'bin';
}

async function processMedia(file, args, outputFilename, mimeType = 'application/octet-stream') {
    assertMediaFile(file);
    const { ffmpeg, fetchFile } = await getRuntime();
    const inputFilename = `input-${crypto.randomUUID()}.${extension(file)}`;
    const outputPath = `output-${crypto.randomUUID()}-${outputFilename}`;

    try {
        await ffmpeg.writeFile(inputFilename, await fetchFile(file));
        const exitCode = await ffmpeg.exec([
            '-i', inputFilename,
            ...args,
            outputPath,
        ]);
        if (exitCode !== 0) {
            throw new Error('Media processing failed for this codec or file.');
        }
        const bytes = await ffmpeg.readFile(outputPath);
        return new Blob([bytes], { type: mimeType });
    } finally {
        await Promise.allSettled([
            ffmpeg.deleteFile(inputFilename),
            ffmpeg.deleteFile(outputPath),
        ]);
    }
}

async function processVideo(file, args, outputFilename, mimeType = 'video/mp4') {
    assertVideoFile(file);
    return processMedia(file, args, outputFilename, mimeType);
}

async function processAudio(file, args, outputFilename, mimeType = 'audio/mpeg') {
    assertAudioFile(file);
    return processMedia(file, args, outputFilename, mimeType);
}

export {
    assertAudioFile,
    assertMediaFile,
    assertVideoFile,
    processAudio,
    processMedia,
    processVideo,
};
