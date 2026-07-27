import { processVideo } from '../ffmpeg-processing.js';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function videoInput() {
    return Object.freeze({
        id: 'video',
        type: 'file',
        accept: 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov',
        label: Object.freeze({ ar: 'اختر فيديو', en: 'Choose a video' }),
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
        unit: Object.freeze({ ar: unit, en: unit }),
    });
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
        numberInput('start', 'وقت البداية', 'Start time', 0, 0, 86400, 'ث'),
        numberInput('end', 'وقت النهاية', 'End time', 10, 0.1, 86400, 'ث'),
    ]),
    async process(values, language) {
        if (values.end <= values.start) {
            throw new Error(localized(language, 'وقت النهاية يجب أن يكون بعد البداية.', 'End time must be after start time.'));
        }
        const duration = values.end - values.start;
        const blob = await processVideo(
            values.video,
            ['-ss', String(values.start), '-t', String(duration), '-c', 'copy'],
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
                '-preset', 'veryfast',
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
            ['-c:v', 'copy', '-an'],
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
    title: Object.freeze({ ar: 'تحويل صيغة الفيديو MP4 وWebM', en: 'MP4 and WebM Video Converter' }),
    description: Object.freeze({
        ar: 'حوّل ملفات الفيديو إلى MP4 المتوافق على نطاق واسع أو WebM المناسب للويب.',
        en: 'Convert videos to widely compatible MP4 or web-optimized WebM.',
    }),
    note: Object.freeze({
        ar: 'يُعاد ترميز الفيديو محليًا؛ الملفات الطويلة تحتاج وقتًا وذاكرة أكبر.',
        en: 'The video is re-encoded locally; long files require more time and memory.',
    }),
    inputs: Object.freeze([
        videoInput(),
        Object.freeze({
            id: 'format',
            type: 'select',
            label: Object.freeze({ ar: 'صيغة الإخراج', en: 'Output format' }),
            unit: Object.freeze({ ar: '', en: '' }),
            options: Object.freeze([
                Object.freeze({ value: 'mp4', label: Object.freeze({ ar: 'MP4', en: 'MP4' }) }),
                Object.freeze({ value: 'webm', label: Object.freeze({ ar: 'WebM', en: 'WebM' }) }),
            ]),
        }),
    ]),
    async process(values, language) {
        const webm = values.format === 'webm';
        const args = webm
            ? ['-c:v', 'libvpx-vp9', '-crf', '32', '-b:v', '0', '-c:a', 'libopus']
            : ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-c:a', 'aac', '-movflags', '+faststart'];
        const blob = await processVideo(
            values.video,
            args,
            `converted.${webm ? 'webm' : 'mp4'}`,
            webm ? 'video/webm' : 'video/mp4',
        );
        return output(
            blob,
            `adawaty-converted-video.${webm ? 'webm' : 'mp4'}`,
            language,
            'الفيديو المحوّل جاهز',
            'Converted video is ready',
        );
    },
});

const videoResizer = Object.freeze({
    id: 'video-resizer',
    category: 'video',
    icon: 'VIDEO↔',
    action: Object.freeze({ ar: 'غيّر الأبعاد', en: 'Resize video' }),
    title: Object.freeze({ ar: 'تغيير أبعاد ودقة الفيديو', en: 'Resize Video Resolution' }),
    description: Object.freeze({
        ar: 'غيّر عرض الفيديو إلى دقة مناسبة للموبايل أو الويب مع الحفاظ على نسبة الأبعاد.',
        en: 'Resize video width for mobile or web while preserving its aspect ratio.',
    }),
    note: Object.freeze({
        ar: 'لن يتم تكبير الفيديو إذا كان عرضه الأصلي أقل من القيمة المختارة.',
        en: 'The video will not be enlarged when its original width is below the selected value.',
    }),
    inputs: Object.freeze([
        videoInput(),
        Object.freeze({
            id: 'width',
            type: 'select',
            label: Object.freeze({ ar: 'العرض الجديد', en: 'New width' }),
            unit: Object.freeze({ ar: '', en: '' }),
            options: Object.freeze([
                Object.freeze({ value: '1920', label: Object.freeze({ ar: '1920 بكسل', en: '1920 px' }) }),
                Object.freeze({ value: '1280', label: Object.freeze({ ar: '1280 بكسل', en: '1280 px' }) }),
                Object.freeze({ value: '854', label: Object.freeze({ ar: '854 بكسل', en: '854 px' }) }),
                Object.freeze({ value: '640', label: Object.freeze({ ar: '640 بكسل', en: '640 px' }) }),
            ]),
        }),
    ]),
    async process(values, language) {
        const blob = await processVideo(
            values.video,
            [
                '-vf', `scale='min(${values.width},iw)':-2`,
                '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24',
                '-c:a', 'aac', '-movflags', '+faststart',
            ],
            'resized.mp4',
        );
        return output(blob, 'adawaty-resized-video.mp4', language, 'الفيديو بالأبعاد الجديدة جاهز', 'Resized video is ready');
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
                '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24',
                '-c:a', 'aac', '-movflags', '+faststart',
            ],
            'speed-changed.mp4',
        );
        return output(blob, 'adawaty-speed-changed-video.mp4', language, 'الفيديو بالسرعة الجديدة جاهز', 'Speed-adjusted video is ready');
    },
});

const videoProcessingToolDefinitions = Object.freeze({
    [videoTrimmer.id]: videoTrimmer,
    [videoCompressor.id]: videoCompressor,
    [videoMute.id]: videoMute,
    [videoConverter.id]: videoConverter,
    [videoResizer.id]: videoResizer,
    [videoSpeedChanger.id]: videoSpeedChanger,
});

export { videoProcessingToolDefinitions };

// END OF FILE
