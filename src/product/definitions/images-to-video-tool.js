import { imagesToVideo } from '../ffmpeg-processing.js';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function imagesInput() {
    return Object.freeze({
        id: 'images',
        type: 'file',
        accept: 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp',
        multiple: true,
        label: Object.freeze({ ar: 'اختر الصور بالترتيب المطلوب', en: 'Choose images in the order you want' }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function audioInput() {
    return Object.freeze({
        id: 'audio',
        type: 'file',
        accept: 'audio/*,.mp3,.wav,.m4a,.aac,.ogg,.opus,.flac',
        label: Object.freeze({ ar: 'ملف صوت (اختياري)', en: 'Audio file (optional)' }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function numberInput(id, ar, en, placeholder, min, max, unit) {
    return Object.freeze({
        id,
        type: 'number',
        min,
        max,
        step: 0.5,
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

function output(blob, filename, language) {
    return {
        value: `${(blob.size / 1024 / 1024).toFixed(1)} MB`,
        label: localized(language, 'الفيديو الناتج', 'Resulting video'),
        details: localized(
            language,
            'تمت المعالجة محليًا داخل متصفحك؛ لم تُرفع صورك أو ملف الصوت لأي خادم.',
            'Processed locally in your browser; your images and audio file were never uploaded anywhere.',
        ),
        download: { blob, filename },
    };
}

const RESOLUTIONS = Object.freeze({
    '1280x720': [1280, 720],
    '1920x1080': [1920, 1080],
    '1080x1080': [1080, 1080],
    '1080x1920': [1080, 1920],
});

const imagesToVideoTool = Object.freeze({
    id: 'images-to-video',
    category: 'video',
    icon: 'IMG→MP4',
    title: Object.freeze({
        ar: 'تحويل الصور إلى فيديو',
        en: 'Images to Video',
    }),
    description: Object.freeze({
        ar: 'حوّل مجموعة صور إلى فيديو (عرض شرائح) بترتيبك المختار، مع إمكانية إضافة موسيقى أو صوت.',
        en: 'Turn a set of images into a slideshow video in your chosen order, with an optional music or audio track.',
    }),
    note: Object.freeze({
        ar: 'مدة الفيديو الناتج تساوي دائمًا مدة الصور مجتمعة (عدد الصور × المدة لكل صورة)، بغض النظر عن طول ملف الصوت؛ لو الصوت أقصر، يكمل الفيديو بصمت، ولو أطول، يُقصّ عند نهاية الصور. الصور بأحجام مختلفة تُعرض كاملة بدون تمديد أو تشويه، مع إطار محايد حول أي صورة أصغر من مقاس الفيديو. المعالجة لا ترفع صورك أو الصوت، وقد يستغرق تحميل محرك الفيديو أول مرة بعض الوقت.',
        en: "The resulting video's length always equals the images' combined duration (number of images × seconds each), regardless of the audio length; if the audio is shorter the video continues silently, and if longer it's cut off when the images end. Differently-sized images are shown in full without stretching or distortion, letterboxed with a neutral frame where an image is smaller than the video size. Processing doesn't upload your images or audio, and the video engine may take a moment to load the first time.",
    }),
    inputs: Object.freeze([
        imagesInput(),
        numberInput('secondsPerImage', 'المدة لكل صورة', 'Seconds per image', '3', 0.5, 30, { ar: 'ثانية', en: 'sec' }),
        audioInput(),
        selectInput('resolution', 'دقة الفيديو', 'Video resolution', [
            ['1280x720', '1280×720 (أفقي، جودة قياسية)', '1280×720 (landscape, standard)'],
            ['1920x1080', '1920×1080 (أفقي، جودة عالية)', '1920×1080 (landscape, HD)'],
            ['1080x1080', '1080×1080 (مربع)', '1080×1080 (square)'],
            ['1080x1920', '1080×1920 (رأسي، للستوري/الريلز)', '1080×1920 (portrait, for Stories/Reels)'],
        ]),
    ]),
    async process(values, language) {
        const images = values.images;
        if (!Array.isArray(images) || images.length === 0) {
            throw new Error(localized(language, 'اختر صورة واحدة على الأقل.', 'Choose at least one image.'));
        }
        if (images.length > 200) {
            throw new Error(localized(language, 'الحد الأقصى 200 صورة في المرة الواحدة.', 'Maximum 200 images at a time.'));
        }

        const secondsPerImage = Number(values.secondsPerImage);
        if (!Number.isFinite(secondsPerImage) || secondsPerImage < 0.5 || secondsPerImage > 30) {
            throw new Error(localized(language, 'المدة لكل صورة يجب أن تكون بين 0.5 و30 ثانية.', 'Seconds per image must be between 0.5 and 30.'));
        }

        const [width, height] = RESOLUTIONS[values.resolution] ?? RESOLUTIONS['1280x720'];
        const blob = await imagesToVideo(images, secondsPerImage, values.audio || null, width, height);
        return output(blob, 'slideshow.mp4', language);
    },
});

const imagesToVideoToolDefinitions = Object.freeze({
    [imagesToVideoTool.id]: imagesToVideoTool,
});

export { imagesToVideoToolDefinitions };

// END OF FILE
