const FFMPEG_URL = new URL('../vendor/ffmpeg/index.js', import.meta.url).href;
const UTIL_URL = new URL('../vendor/ffmpeg-util/index.js', import.meta.url).href;
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
        throw new Error(`Unable to load the media engine: ${error.message}`);
    });
    return runtimePromise;
}

function assertVideoFile(file) {
    if (!(file instanceof File)) throw new Error('Please choose a valid video file.');
    const name = file.name.toLowerCase();
    const isVideo = file.type.startsWith('video/') || /\.(mp4|m4v|mov|webm|ogv|avi|mkv|mpeg|mpg)$/i.test(name);
    if (!isVideo) throw new Error('Please choose a valid video file.');
}

async function inspectVideoFile(file) {
    assertVideoFile(file);
    if (file.size < 12) throw new Error('The selected file is not a readable video.');
    const bytes = new Uint8Array(await file.slice(0, 64).arrayBuffer());
    const ascii = new TextDecoder('latin1').decode(bytes);
    const isIsoMedia = ascii.slice(4, 12).includes('ftyp');
    const isWebM = bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
    const isAvi = ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'AVI ';
    const isOgg = ascii.startsWith('OggS');
    const isMpeg = bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 1 && (bytes[3] === 0xba || bytes[3] === 0xb3);
    if (!isIsoMedia && !isWebM && !isAvi && !isOgg && !isMpeg) throw new Error('The selected file is not a readable video.');
    return Object.freeze({ size: file.size, container: isIsoMedia ? 'iso-media' : isWebM ? 'webm' : isAvi ? 'avi' : isOgg ? 'ogg' : 'mpeg' });
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

async function processMediaFiles(files, buildArgs, outputFilename, mimeType = 'application/octet-stream') {
    files.forEach(assertMediaFile);
    const { ffmpeg, fetchFile } = await getRuntime();
    const inputFilenames = files.map((file) => `input-${crypto.randomUUID()}.${extension(file)}`);
    const outputPath = `output-${crypto.randomUUID()}-${outputFilename}`;
    try {
        for (let index = 0; index < files.length; index += 1) await ffmpeg.writeFile(inputFilenames[index], await fetchFile(files[index]));
        const exitCode = await ffmpeg.exec([...buildArgs(inputFilenames), outputPath]);
        if (exitCode !== 0) throw new Error('Media processing failed for this codec or file.');
        return new Blob([await ffmpeg.readFile(outputPath)], { type: mimeType });
    } finally {
        await Promise.allSettled([...inputFilenames, outputPath].map((path) => ffmpeg.deleteFile(path)));
    }
}
async function splitVideoIntoSegments(file, segmentSeconds, extensionName = 'mp4', mimeType = 'video/mp4') {
    await inspectVideoFile(file);
    const { ffmpeg, fetchFile } = await getRuntime();
    const token = crypto.randomUUID();
    const inputFilename = `input-${token}.${extension(file)}`;
    const outputPrefix = `segment-${token}-`;
    const outputPattern = `${outputPrefix}%03d.${extensionName}`;
    try {
        await ffmpeg.writeFile(inputFilename, await fetchFile(file));
        const exitCode = await ffmpeg.exec([
            '-i', inputFilename, '-map', '0', '-c', 'copy', '-f', 'segment',
            '-segment_time', String(segmentSeconds), '-reset_timestamps', '1', outputPattern,
        ]);
        if (exitCode !== 0) throw new Error('Unable to split this video format.');
        const entries = await ffmpeg.listDir('/');
        const paths = entries.map((entry) => entry.name).filter((name) => name.startsWith(outputPrefix)).sort();
        if (paths.length < 2) throw new Error('Choose a shorter segment duration or more parts.');
        const blobs = [];
        for (const path of paths) blobs.push(new Blob([await ffmpeg.readFile(path)], { type: mimeType }));
        return blobs;
    } finally {
        const entries = await ffmpeg.listDir('/').catch(() => []);
        const paths = entries.map((entry) => entry.name).filter((name) => name.startsWith(outputPrefix));
        await Promise.allSettled([inputFilename, ...paths].map((path) => ffmpeg.deleteFile(path)));
    }
}
/**
 * Splits a video at explicit custom timestamps (in seconds) rather than
 * fixed intervals, using the same ffmpeg `segment` muxer as
 * splitVideoIntoSegments() above via `-segment_times`. Deliberately
 * reuses this exact mechanism rather than a naive per-segment `-ss`/`-t`
 * approach: verified directly that the segment muxer fails *safely* on a
 * video with very sparse keyframes (falls back to fewer/no splits,
 * keeping every stream intact) where a naive `-ss`/`-t` approach was
 * confirmed to silently produce a video-stream-less (audio-only) output
 * for an unreachable cut point instead of erroring or refusing.
 */
async function splitVideoAtCustomTimestamps(file, timestampsSeconds, extensionName = 'mp4', mimeType = 'video/mp4') {
    await inspectVideoFile(file);
    const { ffmpeg, fetchFile } = await getRuntime();
    const token = crypto.randomUUID();
    const inputFilename = `input-${token}.${extension(file)}`;
    const outputPrefix = `segment-${token}-`;
    const outputPattern = `${outputPrefix}%03d.${extensionName}`;
    try {
        await ffmpeg.writeFile(inputFilename, await fetchFile(file));
        const exitCode = await ffmpeg.exec([
            '-i', inputFilename, '-map', '0', '-c', 'copy', '-f', 'segment',
            '-segment_times', timestampsSeconds.join(','), '-reset_timestamps', '1', outputPattern,
        ]);
        if (exitCode !== 0) throw new Error('Unable to split this video format.');
        const entries = await ffmpeg.listDir('/');
        const paths = entries.map((entry) => entry.name).filter((name) => name.startsWith(outputPrefix)).sort();
        if (paths.length < 2) throw new Error('None of the requested cut points could be applied to this video.');
        const blobs = [];
        for (const path of paths) blobs.push(new Blob([await ffmpeg.readFile(path)], { type: mimeType }));
        return blobs;
    } finally {
        const entries = await ffmpeg.listDir('/').catch(() => []);
        const paths = entries.map((entry) => entry.name).filter((name) => name.startsWith(outputPrefix));
        await Promise.allSettled([inputFilename, ...paths].map((path) => ffmpeg.deleteFile(path)));
    }
}
async function processVideo(file, args, outputFilename, mimeType = 'video/mp4') {
    await inspectVideoFile(file);
    return processMedia(file, args, outputFilename, mimeType);
}

async function processAudio(file, args, outputFilename, mimeType = 'audio/mpeg') {
    assertAudioFile(file);
    return processMedia(file, args, outputFilename, mimeType);
}

/**
 * Builds the concat demuxer's list file content: each image listed with its
 * display duration, except the last, which the concat demuxer ignores the
 * duration of by design (documented ffmpeg behavior) -- so it's deliberately
 * repeated once more without a duration line to make its actual on-screen
 * time match every other image's. Extracted as its own function so this
 * specific, easy-to-get-subtly-wrong logic can be tested directly, separate
 * from the ffmpeg.wasm execution around it (which can't run outside a real
 * browser).
 */
function buildConcatList(filenames, secondsPerImage) {
    if (filenames.length === 0) return '';
    const lines = filenames.flatMap((name) => [`file '${name}'`, `duration ${secondsPerImage}`]);
    lines.push(`file '${filenames[filenames.length - 1]}'`);
    return lines.join('\n');
}

/**
 * Builds a video from a sequence of still images (a "slideshow"), each shown
 * for a fixed duration, with an optional audio track mixed in. Uses the
 * concat demuxer (a text file listing each input with its duration) rather
 * than a sequential-numbered-filename pattern (`img%d.jpg`), since input
 * filenames here are random UUIDs, not a numeric sequence.
 *
 * Two real bugs were found and fixed by testing with the real `ffmpeg` CLI
 * before writing this function, not assumed to work:
 *
 * 1. Mixed image formats (e.g. some JPGs, some PNGs) in the same concat list
 *    fail outright -- confirmed directly ("No JPEG data found in image" when
 *    concat's demuxer, which infers a single codec from the first entry,
 *    hit a PNG after a JPG). Fixed by normalizing every image to a uniform
 *    PNG in a separate pass before building the concat list, regardless of
 *    its original format.
 * 2. Naively combining `-t <duration>` (to cap output length at the images'
 *    total duration) with a shorter audio track still produced a
 *    truncated video (confirmed: audio.mp3 length rather than the
 *    requested duration) -- ffmpeg's stream muxing stopped early once the
 *    audio stream ended, `-t` alone didn't override that. Fixed with the
 *    `apad` audio filter (pads the audio stream with silence indefinitely),
 *    so `-t` then reliably determines the actual output length regardless
 *    of whether the audio is shorter or longer than the images' total time.
 */
async function imagesToVideo(imageFiles, secondsPerImage, audioFile, width = 1280, height = 720, mimeType = 'video/mp4') {
    if (!Array.isArray(imageFiles) || imageFiles.length === 0) throw new Error('Please choose at least one image.');
    imageFiles.forEach(assertMediaFile);
    if (audioFile) assertAudioFile(audioFile);

    const { ffmpeg, fetchFile } = await getRuntime();
    const token = crypto.randomUUID();
    const rawFilenames = imageFiles.map((file, index) => `raw-${token}-${index}.${extension(file)}`);
    const normalizedFilenames = imageFiles.map((_, index) => `norm-${token}-${index}.png`);
    const concatListFilename = `concat-${token}.txt`;
    const audioFilename = audioFile ? `audio-${token}.${extension(audioFile)}` : null;
    const outputPath = `output-${token}.mp4`;
    const totalDuration = secondsPerImage * imageFiles.length;

    const writtenFiles = [];
    try {
        for (let index = 0; index < imageFiles.length; index += 1) {
            await ffmpeg.writeFile(rawFilenames[index], await fetchFile(imageFiles[index]));
            writtenFiles.push(rawFilenames[index]);
        }
        if (audioFile) {
            await ffmpeg.writeFile(audioFilename, await fetchFile(audioFile));
            writtenFiles.push(audioFilename);
        }

        // Step 1: normalize every image to a uniform PNG format -- fixes the
        // real mixed-format concat failure found in testing.
        for (let index = 0; index < imageFiles.length; index += 1) {
            const exitCode = await ffmpeg.exec(['-i', rawFilenames[index], '-frames:v', '1', normalizedFilenames[index]]);
            if (exitCode !== 0) throw new Error('One of the selected images could not be read.');
            writtenFiles.push(normalizedFilenames[index]);
        }

        // Step 2: build the concat demuxer's list file.
        const concatContent = buildConcatList(normalizedFilenames, secondsPerImage);
        await ffmpeg.writeFile(concatListFilename, new TextEncoder().encode(concatContent));
        writtenFiles.push(concatListFilename);

        // Step 3: render. scale+pad+setsar unifies differing image
        // dimensions onto one canvas (verified directly: images ranging from
        // 640x480 to 1200x900 all render correctly letterboxed onto a single
        // target size).
        //
        // A critical bug was found here by this tool's own permanent test
        // suite, not just manual testing: applying `-t <duration>` as an
        // OUTPUT option (after all inputs, before the output path) silently
        // produced the WRONG duration when combined with the concat
        // demuxer's variable-framerate output -- confirmed directly with a
        // real ffmpeg CLI: a 2-image, 2-second-each sequence (4s expected)
        // rendered as 2.04s instead, with exit code 0 and no warning at all.
        // Fixed by applying `-t` as an INPUT option on both the image
        // sequence and the audio track instead (each source is read for at
        // most `totalDuration` seconds), combined with `apad=whole_dur=N`
        // (which pads audio to an exact target duration directly, rather
        // than padding indefinitely via plain `apad` and relying on an
        // external cut to bound it -- that combination was separately
        // confirmed to hang indefinitely on a long audio track during
        // testing, since indefinite padding has no natural stopping point
        // without an explicit target).
        const args = [
            '-f', 'concat', '-safe', '0', '-t', String(totalDuration), '-i', concatListFilename,
            ...(audioFile ? ['-t', String(totalDuration), '-i', audioFilename] : []),
            '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1`,
            ...(audioFile ? ['-af', `apad=whole_dur=${totalDuration}`, '-c:a', 'aac'] : []),
            '-vsync', 'vfr', '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '24',
            outputPath,
        ];
        const exitCode = await ffmpeg.exec(args);
        if (exitCode !== 0) throw new Error('Unable to build a video from these images.');
        return new Blob([await ffmpeg.readFile(outputPath)], { type: mimeType });
    } finally {
        await Promise.allSettled([...writtenFiles, outputPath].map((path) => ffmpeg.deleteFile(path)));
    }
}

export {
    assertAudioFile,
    assertMediaFile,
    assertVideoFile,
    buildConcatList,
    getRuntime,
    imagesToVideo,
    inspectVideoFile,
    processAudio,
    processMedia,
    processMediaFiles,
    splitVideoIntoSegments,
    splitVideoAtCustomTimestamps,
    processVideo,
};

// END OF FILE
