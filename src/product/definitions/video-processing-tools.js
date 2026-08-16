import { processMediaFiles, processVideo, splitVideoIntoSegments, splitVideoAtCustomTimestamps } from '../ffmpeg-processing.js';
import { loadVideo } from '../video-processing.js';

/** Parses a single timestamp in "SS", "MM:SS", or "HH:MM:SS" format into total seconds. Verified with real test cases (plain seconds, MM:SS, HH:MM:SS, invalid/negative/empty input) before use. */
function parseTimestamp(text) {
    const trimmed = String(text ?? '').trim();
    if (!trimmed) return null;
    const parts = trimmed.split(':').map((part) => Number(part.trim()));
    if (parts.some((part) => !Number.isFinite(part) || part < 0)) return null;

    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return (parts[0] * 60) + parts[1];
    if (parts.length === 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    return null;
}

/** Parses a comma-separated list of timestamps, sorted and de-duplicated; invalid entries are silently skipped. */
function parseTimestampList(text) {
    const results = String(text ?? '').split(',').map((part) => parseTimestamp(part)).filter((value) => value !== null);
    return [...new Set(results)].sort((a, b) => a - b);
}

const JSZIP_URL = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
let zipPromise;
function loadZip() {
    zipPromise ??= import(JSZIP_URL).then((module) => module.default);
    return zipPromise;
}

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function videoInput() {
    return Object.freeze({
        id: 'video',
        type: 'file',
        accept: 'video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,.mp4,.webm,.mov,.avi,.mkv',
        label: Object.freeze({ ar: 'اختر فيديو', en: 'Choose a video' }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function audioInput() {
    return Object.freeze({
        id: 'audio', type: 'file', accept: 'audio/*,.mp3,.wav,.m4a,.aac,.ogg,.opus,.flac',
        label: Object.freeze({ ar: 'اختر ملف الصوت', en: 'Choose audio file' }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}
function numberInput(id, ar, en, placeholder, min, max, unit) {
    return Object.freeze({
        id,
        type: 'number',
        min,
        max,
        step: 0.1,
        placeholder: String(placeholder),
        label: Object.freeze({ ar, en }),
        unit: Object.freeze(typeof unit === 'object' ? unit : { ar: unit, en: unit }),
    });
}

function timePartsToSeconds(minutes, seconds) {
    return (Number(minutes) * 60) + Number(seconds);
}

function output(blob, filename, language, ar, en) {
    return {
        value: `${(blob.size / 1024 / 1024).toFixed(1)} MB`,
        label: localized(language, ar, en),
        details: localized(
            language,
            'تمت المعالجة محليًا داخل المتصفح.',
            'Processed locally in your browser.',
        ),
        download: { blob, filename },
    };
}

const VIDEO_FORMATS = Object.freeze({
    mp4: {
        ext: 'mp4',
        mime: 'video/mp4',
        args: ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '24', '-c:a', 'aac', '-movflags', '+faststart'],
        label: { ar: 'MP4 (H.264)', en: 'MP4 (H.264)' },
    },
    webm: {
        ext: 'webm',
        mime: 'video/webm',
        args: ['-c:v', 'libvpx-vp9', '-crf', '32', '-b:v', '0', '-c:a', 'libopus'],
        label: { ar: 'WebM (VP9)', en: 'WebM (VP9)' },
    },
    mkv: {
        ext: 'mkv',
        mime: 'video/x-matroska',
        args: ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '24', '-c:a', 'aac'],
        label: { ar: 'MKV', en: 'MKV' },
    },
    avi: {
        ext: 'avi',
        mime: 'video/x-msvideo',
        args: ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '24', '-c:a', 'aac'],
        label: { ar: 'AVI', en: 'AVI' },
    },
    mov: {
        ext: 'mov',
        mime: 'video/quicktime',
        args: ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '24', '-c:a', 'aac', '-movflags', '+faststart'],
        label: { ar: 'MOV', en: 'MOV' },
    },
    gif: {
        ext: 'gif',
        mime: 'image/gif',
        args: ['-vf', 'fps=12,scale=480:-1:flags=lanczos', '-loop', '0'],
        label: { ar: 'GIF متحرك', en: 'Animated GIF' },
    },
});

const videoTrimmer = Object.freeze({
    id: 'video-trimmer',
    category: 'video',
    icon: '✂ VIDEO',
    action: Object.freeze({ ar: 'قص الفيديو', en: 'Trim video' }),
    title: Object.freeze({ ar: 'قص الفيديو أونلاين', en: 'Online Video Trimmer' }),
    description: Object.freeze({
        ar: 'استخرج جزءًا محددًا من فيديو MP4 أو WebM أو MOV بتحديد وقت البداية والنهاية.',
        en: 'Extract a selected section from an MP4, WebM or MOV video using start and end times.',
    }),
    note: Object.freeze({
        ar: 'المعالجة لا ترفع الفيديو، وقد يستغرق تحميل محرك الفيديو أول مرة بعض الوقت.',
        en: 'The video is not uploaded. Loading the video engine for the first time may take a moment.',
    }),
    inputs: Object.freeze([
        videoInput(),
        numberInput('startMinutes', 'دقائق البداية', 'Start minutes', 0, 0, 1439, { ar: 'د', en: 'min' }),
        numberInput('startSeconds', 'ثواني البداية', 'Start seconds', 0, 0, 59.9, { ar: 'ث', en: 'sec' }),
        numberInput('endMinutes', 'دقائق النهاية', 'End minutes', 0, 0, 1439, { ar: 'د', en: 'min' }),
        numberInput('endSeconds', 'ثواني النهاية', 'End seconds', 10, 0, 59.9, { ar: 'ث', en: 'sec' }),
    ]),
    async process(values, language) {
        const start = timePartsToSeconds(values.startMinutes, values.startSeconds);
        const end = timePartsToSeconds(values.endMinutes, values.endSeconds);
        if (end <= start) {
            throw new Error(localized(language, 'وقت النهاية يجب أن يكون بعد البداية.', 'End time must be after start time.'));
        }
        const duration = end - start;
        const blob = await processVideo(
            values.video,
            ['-ss', String(start), '-t', String(duration), '-c', 'copy'],
            'trimmed.mp4',
        );
        return output(blob, 'adawaty-trimmed-video.mp4', language, 'الفيديو المقصوص جاهز', 'Trimmed video is ready');
    },
});

const videoCompressor = Object.freeze({
    id: 'video-compressor',
    category: 'video',
    icon: 'VIDEO↓',
    action: Object.freeze({ ar: 'اضغط الفيديو', en: 'Compress video' }),
    title: Object.freeze({ ar: 'ضغط الفيديو وتقليل حجمه', en: 'Video Compressor' }),
    description: Object.freeze({
        ar: 'قلل حجم فيديو MP4 مع اختيار مستوى الضغط ودقة الإخراج المناسبة للمشاركة.',
        en: 'Reduce MP4 video size with a selectable compression level and output resolution.',
    }),
    note: Object.freeze({
        ar: 'الضغط يعيد ترميز الفيديو محليًا وقد يستغرق وقتًا، خاصة على الهواتف والملفات الطويلة.',
        en: 'Compression re-encodes locally and may take time, especially on phones and long videos.',
    }),
    inputs: Object.freeze([
        videoInput(),
        Object.freeze({
            id: 'quality',
            type: 'select',
            label: Object.freeze({ ar: 'مستوى الضغط', en: 'Compression level' }),
            unit: Object.freeze({ ar: '', en: '' }),
            options: Object.freeze([
                Object.freeze({ value: '28', label: Object.freeze({ ar: 'جودة أعلى', en: 'Higher quality' }) }),
                Object.freeze({ value: '32', label: Object.freeze({ ar: 'متوازن', en: 'Balanced' }) }),
                Object.freeze({ value: '36', label: Object.freeze({ ar: 'حجم أصغر', en: 'Smaller file' }) }),
            ]),
        }),
        Object.freeze({
            id: 'width',
            type: 'select',
            label: Object.freeze({ ar: 'أقصى عرض', en: 'Maximum width' }),
            unit: Object.freeze({ ar: '', en: '' }),
            options: Object.freeze([
                Object.freeze({ value: '1920', label: Object.freeze({ ar: '1080p', en: '1080p' }) }),
                Object.freeze({ value: '1280', label: Object.freeze({ ar: '720p', en: '720p' }) }),
                Object.freeze({ value: '854', label: Object.freeze({ ar: '480p', en: '480p' }) }),
            ]),
        }),
    ]),
    async process(values, language) {
        const blob = await processVideo(
            values.video,
            [
                '-vf', `scale='min(${values.width},iw)':-2`,
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-crf', values.quality,
                '-c:a', 'aac',
                '-b:a', '128k',
                '-movflags', '+faststart',
            ],
            'compressed.mp4',
        );
        return output(blob, 'adawaty-compressed-video.mp4', language, 'الفيديو المضغوط جاهز', 'Compressed video is ready');
    },
});

const videoMute = Object.freeze({
    id: 'video-audio-remover',
    category: 'video',
    icon: 'VIDEO×AUDIO',
    action: Object.freeze({ ar: 'احذف الصوت', en: 'Remove audio' }),
    title: Object.freeze({ ar: 'حذف الصوت من الفيديو', en: 'Remove Audio from Video' }),
    description: Object.freeze({
        ar: 'أنشئ نسخة صامتة من الفيديو بحذف المسار الصوتي بدون إعادة ترميز الصورة.',
        en: 'Create a silent copy by removing the audio track without re-encoding the video stream.',
    }),
    note: Object.freeze({
        ar: 'هذه العملية سريعة وتحافظ على جودة الصورة الأصلية لأن مسار الفيديو يُنسخ كما هو.',
        en: 'This is fast and preserves original image quality because the video stream is copied.',
    }),
    inputs: Object.freeze([videoInput()]),
    async process(values, language) {
        const blob = await processVideo(
            values.video,
            ['-an', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'],
            'silent.mp4',
        );
        return output(blob, 'adawaty-silent-video.mp4', language, 'الفيديو الصامت جاهز', 'Silent video is ready');
    },
});

const videoConverter = Object.freeze({
    id: 'video-format-converter',
    category: 'video',
    icon: 'MP4↔WEBM',
    action: Object.freeze({ ar: 'حوّل الفيديو', en: 'Convert video' }),
    title: Object.freeze({ ar: 'تحويل صيغ الفيديو', en: 'Video Format Converter' }),
    description: Object.freeze({
        ar: 'حوّل الفيديو إلى MP4 أو WebM أو MKV أو AVI أو MOV أو GIF متحرك — كل شيء داخل المتصفح.',
        en: 'Convert video to MP4, WebM, MKV, AVI, MOV or animated GIF — entirely in your browser.',
    }),
    note: Object.freeze({
        ar: 'يُعاد ترميز الفيديو محليًا؛ الملفات الطويلة تحتاج وقتًا وذاكرة أكبر. GIF مناسب للمقاطع القصيرة فقط.',
        en: 'The video is re-encoded locally; long files require more time and memory. GIF works best for short clips.',
    }),
    inputs: Object.freeze([
        videoInput(),
        Object.freeze({
            id: 'format',
            type: 'select',
            label: Object.freeze({ ar: 'صيغة الإخراج', en: 'Output format' }),
            unit: Object.freeze({ ar: '', en: '' }),
            options: Object.freeze(Object.entries(VIDEO_FORMATS).map(([value, format]) => Object.freeze({
                value,
                label: Object.freeze(format.label),
            }))),
        }),
    ]),
    async process(values, language) {
        const format = VIDEO_FORMATS[values.format] ?? VIDEO_FORMATS.mp4;
        const blob = await processVideo(
            values.video,
            format.args,
            `converted.${format.ext}`,
            format.mime,
        );
        return output(
            blob,
            `adawaty-converted-video.${format.ext}`,
            language,
            'الفيديو المحوّل جاهز',
            'Converted video is ready',
        );
    },
});

const videoResizer = Object.freeze({
    id: 'video-resizer', category: 'video', icon: 'VIDEO SIZE',
    action: Object.freeze({ ar: 'غيّر الأبعاد', en: 'Resize video' }),
    title: Object.freeze({ ar: 'تغيير عرض وارتفاع الفيديو', en: 'Resize Video Width and Height' }),
    description: Object.freeze({ ar: 'حدد العرض والارتفاع مع الحفاظ على النسبة أو استخدام المقاس بالضبط.', en: 'Set both width and height, preserving the aspect ratio or using exact dimensions.' }),
    note: Object.freeze({ ar: 'Uses a fast encoding preset to reduce processing time.', en: 'Uses a fast encoding preset to reduce processing time.' }),
    inputs: Object.freeze([
        videoInput(),
        numberInput('width', 'New width', 'New width', 1280, 2, 7680, 'px'),
        numberInput('height', 'New height', 'New height', 720, 2, 4320, 'px'),
        Object.freeze({ id: 'fit', type: 'select', label: Object.freeze({ ar: 'Fit mode', en: 'Fit mode' }), unit: Object.freeze({ ar: '', en: '' }), options: Object.freeze([
            Object.freeze({ value: 'contain', label: Object.freeze({ ar: 'Preserve ratio with padding', en: 'Preserve ratio with padding' }) }),
            Object.freeze({ value: 'stretch', label: Object.freeze({ ar: 'Use exact dimensions', en: 'Use exact dimensions' }) }),
        ]) }),
    ]),
    async process(values, language) {
        const filter = values.fit === 'stretch'
            ? `scale=${values.width}:${values.height}`
            : `scale=${values.width}:${values.height}:force_original_aspect_ratio=decrease,pad=${values.width}:${values.height}:(ow-iw)/2:(oh-ih)/2`;
        const blob = await processVideo(values.video, [
            '-vf', filter, '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '24', '-pix_fmt', 'yuv420p',
            '-c:a', 'aac', '-movflags', '+faststart',
        ], 'resized.mp4');
        return output(blob, 'adawaty-resized-video.mp4', language, 'Resized video is ready', 'Resized video is ready');
    },
});
const videoSpeedChanger = Object.freeze({
    id: 'video-speed-changer',
    category: 'video',
    icon: 'VIDEO×',
    action: Object.freeze({ ar: 'غيّر السرعة', en: 'Change speed' }),
    title: Object.freeze({ ar: 'تسريع أو إبطاء الفيديو', en: 'Video Speed Changer' }),
    description: Object.freeze({
        ar: 'سرّع الفيديو أو أبطئه مع تعديل الصوت ليتزامن مع السرعة الجديدة.',
        en: 'Speed up or slow down a video while keeping its audio synchronized.',
    }),
    note: Object.freeze({
        ar: 'تتغير مدة الفيديو حسب السرعة المختارة، وتتم إعادة الترميز محليًا.',
        en: 'Duration changes with the selected speed and the video is re-encoded locally.',
    }),
    inputs: Object.freeze([
        videoInput(),
        Object.freeze({
            id: 'speed',
            type: 'select',
            label: Object.freeze({ ar: 'السرعة', en: 'Speed' }),
            unit: Object.freeze({ ar: '', en: '' }),
            options: Object.freeze(['0.5', '0.75', '1.25', '1.5', '2'].map((speed) => Object.freeze({
                value: speed,
                label: Object.freeze({ ar: `${speed}×`, en: `${speed}×` }),
            }))),
        }),
    ]),
    async process(values, language) {
        const speed = Number(values.speed);
        const blob = await processVideo(
            values.video,
            [
                '-filter_complex', `[0:v]setpts=${1 / speed}*PTS[v];[0:a]atempo=${speed}[a]`,
                '-map', '[v]', '-map', '[a]',
                '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '24',
                '-c:a', 'aac', '-movflags', '+faststart',
            ],
            'speed-changed.mp4',
        );
        return output(blob, 'adawaty-speed-changed-video.mp4', language, 'الفيديو بالسرعة الجديدة جاهز', 'Speed-adjusted video is ready');
    },
});

const videoSplitter = Object.freeze({
    id: 'video-splitter', category: 'video', icon: 'VIDEO CUT',
    action: Object.freeze({ ar: 'قسّم الفيديو', en: 'Split video' }),
    title: Object.freeze({ ar: 'تقسيم الفيديو إلى أجزاء متعددة', en: 'Split Video into Multiple Parts' }),
    description: Object.freeze({
        ar: 'قسّم فيديو طويل حسب مدة كل جزء، أو إلى عدد محدد من الأجزاء المتساوية، أو بتحديد نقاط قص مخصصة بنفسك، ثم نزّلها داخل ZIP.',
        en: 'Split a long video by segment duration, into a selected number of equal parts, or at your own custom cut points, then download one ZIP.',
    }),
    note: Object.freeze({
        ar: 'الوضع السريع ينسخ الفيديو دون إعادة ترميز؛ قد تتحرك نقطة الفصل قليلًا إلى أقرب إطار مفتاحي. عند اختيار "نقاط قص مخصصة"، النقاط التي لا يمكن الوصول إليها بدون إعادة ترميز (نادر) تُتجاهل تلقائيًا بدل إتلاف الملف.',
        en: 'Fast stream-copy mode avoids re-encoding; a split point may move slightly to the nearest keyframe. With "Custom cut points", any point unreachable without re-encoding (rare) is automatically skipped rather than corrupting the file.',
    }),
    inputs: Object.freeze([
        videoInput(),
        Object.freeze({ id: 'splitMode', type: 'select', label: Object.freeze({ ar: 'طريقة التقسيم', en: 'Split method' }), unit: Object.freeze({ ar: '', en: '' }), options: Object.freeze([
            Object.freeze({ value: 'duration', label: Object.freeze({ ar: 'مدة كل جزء بالدقائق', en: 'Minutes per part' }) }),
            Object.freeze({ value: 'count', label: Object.freeze({ ar: 'عدد الأجزاء المتساوية', en: 'Number of equal parts' }) }),
            Object.freeze({ value: 'custom', label: Object.freeze({ ar: 'نقاط قص مخصصة', en: 'Custom cut points' }) }),
        ]) }),
        numberInput('amount', 'المدة أو عدد الأجزاء', 'Minutes or part count', 10, 0.1, 100, ''),
        Object.freeze({
            id: 'customTimestamps',
            type: 'text',
            label: Object.freeze({ ar: 'نقاط القص (مفصولة بفاصلة، مثال: 1:30, 4:00)', en: 'Cut points (comma-separated, e.g. 1:30, 4:00)' }),
            unit: Object.freeze({ ar: '', en: '' }),
            placeholder: '1:30, 4:00, 6:45',
        }),
    ]),
    async process(values, language) {
        const loaded = await loadVideo(values.video);
        const duration = loaded.video.duration;
        URL.revokeObjectURL(loaded.url);
        const sourceExtension = values.video.name.toLowerCase().match(/\.(mp4|webm|mov|mkv|avi)$/)?.[1] ?? 'mp4';
        const mimeTypes = { mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', mkv: 'video/x-matroska', avi: 'video/x-msvideo' };

        let parts;
        if (values.splitMode === 'custom') {
            const cutPoints = parseTimestampList(values.customTimestamps).filter((seconds) => seconds > 0 && seconds < duration);
            if (cutPoints.length === 0) {
                throw new Error(localized(
                    language,
                    'أدخل نقطة قص واحدة على الأقل بصيغة صحيحة (مثل 1:30) وأقل من مدة الفيديو.',
                    'Enter at least one valid cut point (like 1:30) that is shorter than the video\u2019s duration.',
                ));
            }
            if (cutPoints.length > 99) {
                throw new Error(localized(language, 'الحد الأقصى 99 نقطة قص في العملية الواحدة.', 'A maximum of 99 cut points is supported per run.'));
            }
            parts = await splitVideoAtCustomTimestamps(values.video, cutPoints, sourceExtension, mimeTypes[sourceExtension]);
        } else {
            const requestedCount = Math.max(2, Math.round(values.amount));
            const segmentSeconds = values.splitMode === 'count' ? duration / requestedCount : values.amount * 60;
            const expectedCount = Math.ceil(duration / segmentSeconds);
            if (!Number.isFinite(segmentSeconds) || segmentSeconds <= 0 || expectedCount < 2) {
                throw new Error(localized(language, 'اختر مدة أقصر من مدة الفيديو أو عدد جزأين فأكثر.', 'Choose a duration shorter than the video or at least two parts.'));
            }
            if (expectedCount > 100) {
                throw new Error(localized(language, 'الحد الأقصى 100 جزء في العملية الواحدة.', 'A maximum of 100 parts is supported per run.'));
            }
            parts = await splitVideoIntoSegments(values.video, segmentSeconds, sourceExtension, mimeTypes[sourceExtension]);
        }

        const Zip = await loadZip();
        const zip = new Zip();
        parts.forEach((part, index) => zip.file(`adawaty-video-part-${String(index + 1).padStart(2, '0')}.${sourceExtension}`, part));
        const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
        return output(blob, 'adawaty-video-parts.zip', language, `${parts.length} أجزاء جاهزة`, `${parts.length} video parts are ready`);
    },
});
const addAudioToVideo = Object.freeze({
    id: 'add-audio-to-video', category: 'video', icon: 'VIDEO+AUDIO',
    action: Object.freeze({ ar: 'أضف الصوت', en: 'Add audio' }),
    title: Object.freeze({ ar: 'إضافة صوت إلى فيديو', en: 'Add Audio to Video' }),
    description: Object.freeze({ ar: 'Replace a video soundtrack with a new audio file.', en: 'Replace a video soundtrack with a new audio file.' }),
    note: Object.freeze({ ar: 'The video stream is copied to save processing time.', en: 'The video stream is copied to save processing time.' }),
    inputs: Object.freeze([videoInput(), audioInput()]),
    async process(values, language) {
        const blob = await processMediaFiles([values.video, values.audio], ([video, audio]) => [
            '-i', video, '-i', audio, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart',
        ], 'audio-added.mp4', 'video/mp4');
        return output(blob, 'adawaty-video-with-audio.mp4', language, 'Video with new audio is ready', 'Video with new audio is ready');
    },
});
const videoProcessingToolDefinitions = Object.freeze({
    [videoTrimmer.id]: videoTrimmer,
    [videoCompressor.id]: videoCompressor,
    [videoMute.id]: videoMute,
    [videoConverter.id]: videoConverter,
    [videoResizer.id]: videoResizer,
    [videoSpeedChanger.id]: videoSpeedChanger,
    [videoSplitter.id]: videoSplitter,
    [addAudioToVideo.id]: addAudioToVideo,
});

export { timePartsToSeconds, videoProcessingToolDefinitions };

// END OF FILE
