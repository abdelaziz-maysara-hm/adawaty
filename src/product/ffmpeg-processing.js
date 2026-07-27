const FFMPEG_URL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/+esm';
const UTIL_URL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/+esm';
const CORE_BASE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';

let runtimePromise;

async function createRuntime() {
    const [{ FFmpeg }, { fetchFile, toBlobURL }] = await Promise.all([
        import(FFMPEG_URL),
        import(UTIL_URL),
    ]);
    const ffmpeg = new FFmpeg();
    await ffmpeg.load({
        coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    return { ffmpeg, fetchFile };
}

function getRuntime() {
    runtimePromise ??= createRuntime().catch((error) => {
        runtimePromise = undefined;
        throw new Error(`Unable to load the video engine: ${error.message}`);
    });
    return runtimePromise;
}

function assertVideoFile(file) {
    if (!(file instanceof File) || !file.type.startsWith('video/')) {
        throw new Error('Please choose a valid video file.');
    }
}

function extension(file) {
    const match = file.name.toLowerCase().match(/\.([a-z0-9]+)$/);
    return match?.[1] ?? 'mp4';
}

async function processVideo(file, args, outputFilename, mimeType = 'video/mp4') {
    assertVideoFile(file);
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
            throw new Error('Video processing failed for this codec or file.');
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

export {
    assertVideoFile,
    processVideo,
};

// END OF FILE
