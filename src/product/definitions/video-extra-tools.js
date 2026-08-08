import { processMediaFiles } from '../ffmpeg-processing.js';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function videoInput(id = 'video', ar = 'اختر فيديو', en = 'Choose a video') {
    return Object.freeze({
        id,
        type: 'file',
        accept: 'video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,.mp4,.webm,.mov,.avi,.mkv',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function imageInput(id, ar, en) {
    return Object.freeze({
        id,
        type: 'file',
        accept: 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp',
        label: Object.freeze({ ar, en }),
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

function selectInput(id, ar, en, options) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map(([value, optAr, optEn]) => Object.freeze({
            value,
            label: Object.freeze({ ar: optAr, en: optEn }),
        }))),
    });
}

function output(blob, filename, language, ar, en, details) {
    return {
        value: `${(blob.size / 1024 / 1024).toFixed(1)} MB`,
        label: localized(language, ar, en),
        details: details ?? '',
        download: { blob, filename },
    };
}

function videoTool(config) {
    return Object.freeze({
        category: 'video',
        ...config,
    });
}

const ROTATION_FILTERS = Object.freeze({
    cw90: 'transpose=1',
    ccw90: 'transpose=2',
    deg180: 'hflip,vflip',
});

const videoRotator = videoTool({
    id: 'video-rotate',
    icon: 'ROT',
    action: Object.freeze({ ar: 'دوّر الفيديو', en: 'Rotate video' }),
    title: Object.freeze({ ar: 'تدوير الفيديو', en: 'Video Rotator' }),
    description: Object.freeze({
        ar: 'دوّر فيديو بزاوية 90 درجة (يمين أو يسار) أو 180 درجة، مفيد لتصحيح فيديو مسجّل بالاتجاه الخاطئ.',
        en: 'Rotate a video 90 degrees (clockwise or counter-clockwise) or 180 degrees, useful for fixing footage recorded in the wrong orientation.',
    }),
    note: Object.freeze({
        ar: 'المعالجة لا ترفع الفيديو، وقد يستغرق تحميل محرك الفيديو أول مرة بعض الوقت.',
        en: 'The video is not uploaded. Loading the video engine for the first time may take a moment.',
    }),
    inputs: Object.freeze([
        videoInput(),
        selectInput('direction', 'اتجاه التدوير', 'Rotation', [
            ['cw90', '90° يمين', '90° clockwise'],
            ['ccw90', '90° يسار', '90° counter-clockwise'],
            ['deg180', '180°', '180°'],
        ]),
    ]),
    async process(values, language) {
        const filter = ROTATION_FILTERS[values.direction] ?? ROTATION_FILTERS.cw90;
        const blob = await processMediaFiles([values.video], ([video]) => [
            '-i', video,
            '-vf', filter,
            '-c:a', 'copy',
            '-movflags', '+faststart',
        ], 'rotated.mp4', 'video/mp4');

        return output(
            blob,
            'adawaty-rotated-video.mp4',
            language,
            'الفيديو المُدوَّر جاهز',
            'The rotated video is ready',
        );
    },
});

const videoCropper = videoTool({
    id: 'video-crop',
    icon: 'CROP',
    action: Object.freeze({ ar: 'قصّ إطار الفيديو', en: 'Crop video' }),
    title: Object.freeze({ ar: 'قص إطار الفيديو (Crop)', en: 'Video Cropper' }),
    description: Object.freeze({
        ar: 'اقتطع منطقة مستطيلة محددة من إطار الفيديو بتحديد العرض والارتفاع ونقطة البداية، لإزالة حواف غير مرغوبة أو التركيز على جزء معيّن.',
        en: 'Cut a specific rectangular region out of the video frame by width, height, and a starting point, to remove unwanted edges or focus on a specific part.',
    }),
    note: Object.freeze({
        ar: 'تأكد أن منطقة القص بالكامل داخل حدود الفيديو الأصلي، وإلا فشلت المعالجة.',
        en: 'Make sure the crop region is fully within the original video\u2019s bounds, or processing will fail.',
    }),
    inputs: Object.freeze([
        videoInput(),
        numberInput('width', 'عرض المنطقة', 'Crop width', 640, 2, 7680, 'px'),
        numberInput('height', 'ارتفاع المنطقة', 'Crop height', 480, 2, 4320, 'px'),
        numberInput('x', 'الإزاحة الأفقية (من اليسار)', 'Horizontal offset (from left)', 0, 0, 7680, 'px'),
        numberInput('y', 'الإزاحة الرأسية (من الأعلى)', 'Vertical offset (from top)', 0, 0, 4320, 'px'),
    ]),
    async process(values, language) {
        const filter = `crop=${values.width}:${values.height}:${values.x}:${values.y}`;
        const blob = await processMediaFiles([values.video], ([video]) => [
            '-i', video,
            '-vf', filter,
            '-c:a', 'copy',
            '-movflags', '+faststart',
        ], 'cropped.mp4', 'video/mp4');

        return output(
            blob,
            'adawaty-cropped-video.mp4',
            language,
            'الفيديو المقصوص جاهز',
            'The cropped video is ready',
        );
    },
});

const videoMerger = videoTool({
    id: 'video-merge',
    icon: 'MERGE',
    action: Object.freeze({ ar: 'ادمج الفيديوهات', en: 'Merge videos' }),
    title: Object.freeze({ ar: 'دمج مقطعي فيديو في ملف واحد', en: 'Video Merger' }),
    description: Object.freeze({
        ar: 'اربط مقطعي فيديو بالترتيب في ملف واحد متصل.',
        en: 'Join two video clips in order into one continuous file.',
    }),
    note: Object.freeze({
        ar: 'الناتج بدون صوت حتى لو كان المقطعان يحتويان على صوت، لتجنب مشاكل التوافق بين مسارات صوت مختلفة أو غير موجودة. لإضافة صوت للناتج، استخدم أداة إضافة صوت إلى فيديو بعد الدمج.',
        en: 'The output has no audio even if both clips have sound, to avoid mismatches between different or missing audio tracks. To add sound afterward, use the Add Audio to Video tool on the merged result.',
    }),
    inputs: Object.freeze([
        videoInput('videoFirst', 'الفيديو الأول', 'First video'),
        videoInput('videoSecond', 'الفيديو الثاني', 'Second video'),
    ]),
    async process(values, language) {
        const blob = await processMediaFiles(
            [values.videoFirst, values.videoSecond],
            ([first, second]) => [
                '-i', first,
                '-i', second,
                '-filter_complex', '[0:v][1:v]concat=n=2:v=1:a=0[outv]',
                '-map', '[outv]',
                '-an',
                '-movflags', '+faststart',
            ],
            'merged.mp4',
            'video/mp4',
        );

        return output(
            blob,
            'adawaty-merged-video.mp4',
            language,
            'الفيديو المدموج جاهز',
            'The merged video is ready',
        );
    },
});

const WATERMARK_POSITION_FILTERS = Object.freeze({
    topLeft: '10:10',
    topRight: 'W-w-10:10',
    bottomLeft: '10:H-h-10',
    bottomRight: 'W-w-10:H-h-10',
    center: '(W-w)/2:(H-h)/2',
});

const videoWatermark = videoTool({
    id: 'video-watermark',
    icon: 'WM',
    action: Object.freeze({ ar: 'أضف علامة مائية', en: 'Add watermark' }),
    title: Object.freeze({ ar: 'إضافة علامة مائية للفيديو', en: 'Video Watermark' }),
    description: Object.freeze({
        ar: 'أضف صورة (شعار أو علامة مائية) فوق الفيديو في أحد الأركان أو المنتصف.',
        en: 'Overlay an image (a logo or watermark) on top of the video in a corner or the center.',
    }),
    note: Object.freeze({
        ar: 'يُفضّل استخدام صورة PNG بخلفية شفافة للحصول على أفضل نتيجة.',
        en: 'A PNG image with a transparent background gives the best result.',
    }),
    inputs: Object.freeze([
        videoInput(),
        imageInput('watermarkImage', 'صورة العلامة المائية', 'Watermark image'),
        selectInput('position', 'الموضع', 'Position', [
            ['bottomRight', 'أسفل اليمين', 'Bottom-right'],
            ['bottomLeft', 'أسفل اليسار', 'Bottom-left'],
            ['topRight', 'أعلى اليمين', 'Top-right'],
            ['topLeft', 'أعلى اليسار', 'Top-left'],
            ['center', 'المنتصف', 'Center'],
        ]),
    ]),
    async process(values, language) {
        const position = WATERMARK_POSITION_FILTERS[values.position] ?? WATERMARK_POSITION_FILTERS.bottomRight;
        const blob = await processMediaFiles(
            [values.video, values.watermarkImage],
            ([video, watermark]) => [
                '-i', video,
                '-i', watermark,
                '-filter_complex', `overlay=${position}`,
                '-c:a', 'copy',
                '-movflags', '+faststart',
            ],
            'watermarked.mp4',
            'video/mp4',
        );

        return output(
            blob,
            'adawaty-watermarked-video.mp4',
            language,
            'الفيديو مع العلامة المائية جاهز',
            'The watermarked video is ready',
        );
    },
});

const videoExtraToolDefinitions = Object.freeze({
    [videoRotator.id]: videoRotator,
    [videoCropper.id]: videoCropper,
    [videoMerger.id]: videoMerger,
    [videoWatermark.id]: videoWatermark,
});

export { videoExtraToolDefinitions };

// END OF FILE
