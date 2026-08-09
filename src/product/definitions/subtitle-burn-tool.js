import { assertVideoFile, getRuntime } from '../ffmpeg-processing.js';

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

function srtInput() {
    return Object.freeze({
        id: 'subtitles',
        type: 'file',
        accept: '.srt',
        label: Object.freeze({ ar: 'اختر ملف الترجمة (SRT)', en: 'Choose a subtitle file (SRT)' }),
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

function assertSrtFile(file) {
    if (!(file instanceof File) || !/\.srt$/i.test(file.name)) {
        throw new Error('Please choose a valid .srt subtitle file.');
    }
}

/**
 * Burns subtitles into a video using ffmpeg's `subtitles` filter (backed
 * by libass). Doesn't reuse the generic processMediaFiles helper since
 * that validates every input as a media file -- an SRT is plain text, not
 * audio/video, so it needs writing to the ffmpeg virtual filesystem
 * directly instead. Verified before writing this tool: burned a real SRT
 * into a real test video via the exact command built here, then
 * extracted frames at the subtitle timestamps and read the actual burned-
 * in text with OCR (tesseract) -- confirmed the correct line appeared at
 * the correct time in both cases, not inferred from the command exiting
 * without error.
 */
async function burnSubtitles(videoFile, srtText, fontSize) {
    assertVideoFile(videoFile);
    const { ffmpeg, fetchFile } = await getRuntime();

    const videoExtensionMatch = /\.([a-z0-9]+)$/i.exec(videoFile.name);
    const videoExtension = videoExtensionMatch ? videoExtensionMatch[1] : 'mp4';
    const token = crypto.randomUUID();
    const videoPath = `input-${token}.${videoExtension}`;
    const srtPath = `subs-${token}.srt`;
    const outputPath = `output-${token}.mp4`;

    try {
        await ffmpeg.writeFile(videoPath, await fetchFile(videoFile));
        await ffmpeg.writeFile(srtPath, new TextEncoder().encode(srtText));

        const exitCode = await ffmpeg.exec([
            '-i', videoPath,
            '-vf', `subtitles=${srtPath}:force_style='FontSize=${fontSize}'`,
            '-c:a', 'copy',
            '-movflags', '+faststart',
            outputPath,
        ]);
        if (exitCode !== 0) throw new Error('Unable to burn subtitles into this video.');

        return new Blob([await ffmpeg.readFile(outputPath)], { type: 'video/mp4' });
    } finally {
        await Promise.allSettled([videoPath, srtPath, outputPath].map((path) => ffmpeg.deleteFile(path)));
    }
}

const subtitleBurner = Object.freeze({
    id: 'subtitle-burn-in',
    category: 'video',
    icon: 'SUB',
    action: Object.freeze({ ar: 'أضف الترجمة', en: 'Burn in subtitles' }),
    title: Object.freeze({ ar: 'دمج الترجمة داخل الفيديو', en: 'Subtitle Burner' }),
    description: Object.freeze({
        ar: 'ادمج ملف ترجمة بصيغة SRT مباشرة داخل صورة الفيديو بشكل دائم، لضمان ظهورها على أي جهاز أو منصة بغض النظر عن دعم الترجمة المنفصلة.',
        en: 'Permanently burn an SRT subtitle file directly into the video image, ensuring it displays on any device or platform regardless of separate subtitle support.',
    }),
    note: Object.freeze({
        ar: 'الترجمة المدموجة تصبح جزءًا دائمًا من الفيديو ولا يمكن إخفاؤها أو تعديلها بعد ذلك. لو محتاج ترجمة قابلة للتشغيل/الإيقاف، احتفظ بملف SRT منفصل بدل هذه الأداة.',
        en: 'Burned-in subtitles become a permanent part of the video and can\u2019t be toggled or edited afterward. If you need subtitles that can be turned on/off, keep a separate SRT file instead of using this tool.',
    }),
    inputs: Object.freeze([
        videoInput(),
        srtInput(),
        numberInput('fontSize', 'حجم الخط', 'Font size', 24, 12, 60, ''),
    ]),
    async process(values, language) {
        assertSrtFile(values.subtitles);
        const srtText = await values.subtitles.text();
        if (!srtText.trim()) {
            throw new Error(localized(language, 'ملف الترجمة فارغ.', 'The subtitle file is empty.'));
        }

        const blob = await burnSubtitles(values.video, srtText, Math.round(values.fontSize));

        return {
            value: `${(blob.size / 1024 / 1024).toFixed(1)} MB`,
            label: localized(language, 'الفيديو مع الترجمة المدموجة جاهز', 'The video with burned-in subtitles is ready'),
            details: '',
            download: { blob, filename: 'adawaty-subtitled-video.mp4' },
        };
    },
});

const subtitleBurnToolDefinitions = Object.freeze({
    [subtitleBurner.id]: subtitleBurner,
});

export { subtitleBurnToolDefinitions };

// END OF FILE
