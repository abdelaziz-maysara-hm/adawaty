import { canvasToBlob } from '../image-processing.js';
import { processVideo } from '../ffmpeg-processing.js';
import {
    captureVideoFrame,
    drawVideoFrame,
    loadVideo,
    seekVideo,
} from '../video-processing.js';

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
        accept: 'video/mp4,video/webm,video/quicktime',
        label: Object.freeze({ ar: 'اختر الفيديو', en: 'Choose video' }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function numberInput(id, ar, en, placeholder, min, max, unit = '') {
    return Object.freeze({
        id,
        type: 'number',
        min,
        max,
        step: 1,
        placeholder: String(placeholder),
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: unit, en: unit }),
    });
}

function videoBase(config) {
    return Object.freeze({
        category: 'video',
        ...config,
    });
}

const thumbnailExtractor = videoBase({
    id: 'video-thumbnail-extractor',
    icon: 'FRAME',
    action: Object.freeze({ ar: 'استخرج الصورة', en: 'Extract thumbnail' }),
    title: Object.freeze({
        ar: 'استخراج صورة مصغرة من الفيديو',
        en: 'Video Thumbnail Extractor',
    }),
    description: Object.freeze({
        ar: 'اختر أي ثانية من الفيديو واستخرج منها صورة JPG عالية الجودة قابلة للتنزيل.',
        en: 'Choose any second in a video and export it as a high-quality downloadable JPG.',
    }),
    note: Object.freeze({
        ar: 'الفيديو لا يغادر جهازك. يجب أن يدعم المتصفح ترميز الملف المختار.',
        en: 'The video never leaves your device. Its codec must be supported by your browser.',
    }),
    inputs: Object.freeze([
        videoInput(),
        numberInput('timestamp', 'الوقت المطلوب', 'Timestamp', 1, 0, 86400, 'sec'),
        numberInput('width', 'عرض الصورة', 'Thumbnail width', 1280, 160, 3840, 'px'),
    ]),
    async process(values, language) {
        const loaded = await loadVideo(values.video);
        try {
            if (values.timestamp > loaded.video.duration) {
                throw new Error(localized(
                    language,
                    `مدة الفيديو ${loaded.video.duration.toFixed(1)} ثانية فقط.`,
                    `The video is only ${loaded.video.duration.toFixed(1)} seconds long.`,
                ));
            }
            await seekVideo(loaded.video, values.timestamp);
            const frame = await captureVideoFrame(loaded.video, {
                width: values.width,
            });
            return {
                value: `${frame.width} × ${frame.height}`,
                label: localized(
                    language,
                    'الصورة المصغرة جاهزة',
                    'Video thumbnail is ready',
                ),
                details: localized(
                    language,
                    `تم التقاطها عند الثانية ${values.timestamp}.`,
                    `Captured at ${values.timestamp} seconds.`,
                ),
                preview: frame.blob,
                download: {
                    blob: frame.blob,
                    filename: 'adawaty-video-thumbnail.jpg',
                },
            };
        } finally {
            URL.revokeObjectURL(loaded.url);
        }
    },
});

const contactSheetGenerator = videoBase({
    id: 'video-contact-sheet-generator',
    icon: 'SHEET',
    action: Object.freeze({
        ar: 'أنشئ لوحة اللقطات',
        en: 'Create contact sheet',
    }),
    title: Object.freeze({
        ar: 'مولّد لوحة لقطات الفيديو',
        en: 'Video Contact Sheet Generator',
    }),
    description: Object.freeze({
        ar: 'أنشئ صورة واحدة تلخص الفيديو بعدة لقطات موزعة تلقائيًا على مدته.',
        en: 'Create one overview image with frames distributed automatically across the video.',
    }),
    note: Object.freeze({
        ar: 'مفيد لمراجعة المحتوى واختيار الصور المصغرة بسرعة، وتتم العملية محليًا.',
        en: 'Useful for reviewing footage and choosing thumbnails quickly; processing stays local.',
    }),
    inputs: Object.freeze([
        videoInput(),
        numberInput('frameCount', 'عدد اللقطات', 'Number of frames', 9, 4, 16),
        numberInput('columns', 'عدد الأعمدة', 'Columns', 3, 2, 4),
        numberInput('frameWidth', 'عرض كل لقطة', 'Frame width', 480, 160, 960, 'px'),
    ]),
    async process(values, language) {
        const loaded = await loadVideo(values.video);
        try {
            const frameCount = values.frameCount;
            const columns = Math.min(values.columns, frameCount);
            const rows = Math.ceil(frameCount / columns);
            const frameWidth = values.frameWidth;
            const frameHeight = Math.round(
                frameWidth * loaded.video.videoHeight / loaded.video.videoWidth,
            );
            const gap = 10;
            const canvas = document.createElement('canvas');
            canvas.width = columns * frameWidth + (columns + 1) * gap;
            canvas.height = rows * frameHeight + (rows + 1) * gap;
            const context = canvas.getContext('2d');
            if (!context) {
                throw new Error(localized(
                    language,
                    'معالجة الفيديو غير متاحة في هذا المتصفح.',
                    'Video processing is unavailable in this browser.',
                ));
            }
            context.fillStyle = '#07111f';
            context.fillRect(0, 0, canvas.width, canvas.height);
            for (let index = 0; index < frameCount; index += 1) {
                const time = loaded.video.duration
                    * (index + 1) / (frameCount + 1);
                await seekVideo(loaded.video, time);
                drawVideoFrame(loaded.video, canvas, {
                    x: gap + (index % columns) * (frameWidth + gap),
                    y: gap + Math.floor(index / columns) * (frameHeight + gap),
                    width: frameWidth,
                    height: frameHeight,
                });
            }
            const blob = await canvasToBlob(canvas, 'image/jpeg', 0.9);
            return {
                value: `${frameCount} ${localized(language, 'لقطة', 'frames')}`,
                label: localized(
                    language,
                    'لوحة اللقطات جاهزة',
                    'Video contact sheet is ready',
                ),
                details: `${canvas.width} × ${canvas.height}`,
                preview: blob,
                download: {
                    blob,
                    filename: 'adawaty-video-contact-sheet.jpg',
                },
            };
        } finally {
            URL.revokeObjectURL(loaded.url);
        }
    },
});

const frameSequenceExtractor = videoBase({
    id: 'video-frame-sequence-extractor',
    icon: 'ZIP',
    action: Object.freeze({
        ar: 'استخرج اللقطات',
        en: 'Extract frames',
    }),
    title: Object.freeze({
        ar: 'استخراج لقطات الفيديو إلى ZIP',
        en: 'Video Frame Sequence Extractor',
    }),
    description: Object.freeze({
        ar: 'استخرج عدة لقطات JPG موزعة على مدة الفيديو ونزّلها معًا داخل ملف ZIP واحد.',
        en: 'Extract multiple JPG frames distributed across a video and download them together in one ZIP.',
    }),
    note: Object.freeze({
        ar: 'تتم قراءة الفيديو وإنشاء الصور على جهازك. يحتاج إنشاء ZIP إلى اتصال بالإنترنت لتحميل مكتبة الضغط.',
        en: 'The video and frames stay on your device. ZIP creation needs internet access to load the compression library.',
    }),
    inputs: Object.freeze([
        videoInput(),
        numberInput('frameCount', 'عدد اللقطات', 'Number of frames', 12, 2, 30),
        numberInput('width', 'عرض كل لقطة', 'Frame width', 1280, 160, 1920, 'px'),
    ]),
    async process(values, language) {
        const loaded = await loadVideo(values.video);

        try {
            const JSZip = await loadZip();
            const zip = new JSZip();
            const digits = String(values.frameCount).length;

            for (let index = 0; index < values.frameCount; index += 1) {
                const time = loaded.video.duration
                    * (index + 1) / (values.frameCount + 1);
                await seekVideo(loaded.video, time);
                const frame = await captureVideoFrame(loaded.video, {
                    width: values.width,
                    quality: 0.9,
                });
                const position = String(index + 1).padStart(digits, '0');
                zip.file(`frame-${position}.jpg`, frame.blob);
            }

            const blob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 },
            });

            return {
                value: `${values.frameCount} ${localized(language, 'لقطة', 'frames')}`,
                label: localized(
                    language,
                    'حزمة لقطات الفيديو جاهزة',
                    'Video frame package is ready',
                ),
                details: localized(
                    language,
                    `${(blob.size / 1024 / 1024).toFixed(1)} ميجابايت داخل ملف ZIP واحد.`,
                    `${(blob.size / 1024 / 1024).toFixed(1)} MB in one ZIP file.`,
                ),
                download: {
                    blob,
                    filename: 'adawaty-video-frames.zip',
                },
            };
        } finally {
            URL.revokeObjectURL(loaded.url);
        }
    },
});

const videoAudioExtractor = videoBase({
    id: 'video-audio-extractor',
    icon: 'WAV',
    action: Object.freeze({
        ar: 'استخرج الصوت',
        en: 'Extract audio',
    }),
    title: Object.freeze({
        ar: 'استخراج الصوت من الفيديو',
        en: 'Extract Audio from Video',
    }),
    description: Object.freeze({
        ar: 'استخرج المسار الصوتي من ملف فيديو وحوّله إلى WAV متوافق مع برامج التحرير والتشغيل.',
        en: 'Extract a video audio track as a WAV file compatible with common editors and players.',
    }),
    note: Object.freeze({
        ar: 'تتم العملية بالكامل داخل المتصفح. قد تحتاج الملفات الطويلة إلى ذاكرة كبيرة، ويجب أن يدعم المتصفح ترميز الصوت المستخدم.',
        en: 'Processing stays in the browser. Long files may need substantial memory, and the audio codec must be browser-supported.',
    }),
    inputs: Object.freeze([videoInput(), Object.freeze({
        id: 'format', type: 'select',
        label: Object.freeze({ ar: 'صيغة الصوت', en: 'Audio format' }), unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze([
            Object.freeze({ value: 'wav', label: Object.freeze({ ar: 'WAV', en: 'WAV' }) }),
            Object.freeze({ value: 'mp3', label: Object.freeze({ ar: 'MP3', en: 'MP3' }) }),
            Object.freeze({ value: 'aac', label: Object.freeze({ ar: 'AAC', en: 'AAC' }) }),
            Object.freeze({ value: 'ogg', label: Object.freeze({ ar: 'OGG', en: 'OGG' }) }),
        ]),
    })]),
    async process(values, language) {
        const formats = {
            wav: { args: ['-vn', '-c:a', 'pcm_s16le'], mime: 'audio/wav' },
            mp3: { args: ['-vn', '-c:a', 'libmp3lame', '-q:a', '2'], mime: 'audio/mpeg' },
            aac: { args: ['-vn', '-c:a', 'aac', '-b:a', '192k'], mime: 'audio/aac' },
            ogg: { args: ['-vn', '-c:a', 'libopus', '-b:a', '160k'], mime: 'audio/ogg' },
        };
        const selected = values.format || 'wav';
        const format = formats[selected] ?? formats.wav;
        const blob = await processVideo(values.video, format.args, `audio.${selected}`, format.mime);
        return {
            value: `${(blob.size / 1024 / 1024).toFixed(1)} MB`,
            label: localized(language, 'ملف الصوت جاهز', 'Audio file is ready'),
            details: localized(language, 'تم الاستخراج محليًا داخل المتصفح.', 'Extracted locally in your browser.'),
            download: { blob, filename: `adawaty-extracted-audio.${selected}` },
        };
    },
});

const videoFileToolDefinitions = Object.freeze({
    [thumbnailExtractor.id]: thumbnailExtractor,
    [contactSheetGenerator.id]: contactSheetGenerator,
    [frameSequenceExtractor.id]: frameSequenceExtractor,
    [videoAudioExtractor.id]: videoAudioExtractor,
});

export { videoFileToolDefinitions };

// END OF FILE
