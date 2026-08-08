function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function fileInput(accept = 'image/jpeg,image/png,image/webp,image/gif,image/bmp,.jpg,.jpeg,.png,.webp,.gif,.bmp') {
    return Object.freeze({
        id: 'image',
        type: 'file',
        accept,
        label: Object.freeze({ ar: 'اختر صورة', en: 'Choose an image' }),
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

function textFieldInput(id, ar, en, placeholder) {
    return Object.freeze({
        id,
        type: 'text',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
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

function imageTool(config) {
    return Object.freeze({
        category: 'image',
        ...config,
    });
}

/** Finds the single most common color by binning pixels into coarse RGB buckets. */
function findDominantColor(pixelData) {
    const bins = new Map();
    const quantize = (value) => Math.min(255, Math.round(value / 32) * 32);

    for (let index = 0; index < pixelData.length; index += 4) {
        const red = quantize(pixelData[index]);
        const green = quantize(pixelData[index + 1]);
        const blue = quantize(pixelData[index + 2]);
        const key = `${red},${green},${blue}`;
        bins.set(key, (bins.get(key) || 0) + 1);
    }

    let bestKey = '0,0,0';
    let bestCount = 0;
    for (const [key, count] of bins) {
        if (count > bestCount) {
            bestCount = count;
            bestKey = key;
        }
    }

    const [red, green, blue] = bestKey.split(',').map(Number);
    const toHex = (value) => value.toString(16).padStart(2, '0');
    return { red, green, blue, hex: `#${toHex(red)}${toHex(green)}${toHex(blue)}` };
}

const dominantColorFinder = imageTool({
    id: 'dominant-color',
    icon: 'DOM',
    action: Object.freeze({ ar: 'استخرج اللون', en: 'Extract color' }),
    title: Object.freeze({ ar: 'استخراج اللون الأساسي من الصورة', en: 'Dominant Color Finder' }),
    description: Object.freeze({
        ar: 'حدد اللون الأكثر تكرارًا في صورة، مفيد لاختيار لون خلفية أو تصميم متناسق مع الصورة.',
        en: 'Find the single most common color in an image, useful for picking a matching background or design color.',
    }),
    note: Object.freeze({
        ar: 'يعتمد على تجميع الألوان المتقاربة معًا، فقد يختلف قليلًا عن اللون الدقيق لأي بكسل واحد.',
        en: 'Works by grouping similar colors together, so it may differ slightly from any single exact pixel color.',
    }),
    inputs: Object.freeze([fileInput()]),
    async process(values, language) {
        const bitmap = await createImageBitmap(values.image);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        context.drawImage(bitmap, 0, 0);
        bitmap.close();

        const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
        const { hex, red, green, blue } = findDominantColor(data);

        return {
            value: hex.toUpperCase(),
            label: localized(language, 'اللون الأساسي جاهز', 'The dominant color is ready'),
            details: `RGB(${red}, ${green}, ${blue})`,
        };
    },
});

const imageSizeAnalyzer = imageTool({
    id: 'image-size',
    icon: 'SIZE?',
    action: Object.freeze({ ar: 'حلّل الصورة', en: 'Analyze image' }),
    title: Object.freeze({ ar: 'تحليل أبعاد وحجم الصورة', en: 'Image Size Analyzer' }),
    description: Object.freeze({
        ar: 'اعرض أبعاد الصورة بالبكسل، حجم الملف، نسبة العرض إلى الارتفاع، وصيغة الملف دفعة واحدة.',
        en: 'View an image\u2019s pixel dimensions, file size, aspect ratio, and format all at once.',
    }),
    note: Object.freeze({
        ar: '',
        en: '',
    }),
    inputs: Object.freeze([fileInput()]),
    async process(values, language) {
        const bitmap = await createImageBitmap(values.image);
        const { width, height } = bitmap;
        bitmap.close();

        const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
        const divisor = gcd(width, height) || 1;
        const aspectRatio = `${width / divisor}:${height / divisor}`;

        return {
            value: `${width} × ${height}`,
            label: localized(language, 'تحليل الصورة جاهز', 'Image analysis is ready'),
            details: [
                `${localized(language, 'حجم الملف', 'File size')}: ${(values.image.size / 1024).toFixed(1)} KB`,
                `${localized(language, 'نسبة الأبعاد', 'Aspect ratio')}: ${aspectRatio}`,
                `${localized(language, 'الصيغة', 'Format')}: ${values.image.type || localized(language, 'غير معروفة', 'unknown')}`,
            ].join('\n'),
        };
    },
});

const compressionAnalyzer = imageTool({
    id: 'compression-analysis',
    icon: 'ANLZ',
    action: Object.freeze({ ar: 'حلّل الضغط', en: 'Analyze compression' }),
    title: Object.freeze({ ar: 'تحليل إمكانية ضغط الصورة', en: 'Compression Analyzer' }),
    description: Object.freeze({
        ar: 'أعد ترميز الصورة بجودات مختلفة واعرض حجم الملف الناتج ونسبة التوفير المحتملة عند كل جودة، لمساعدتك تختار أفضل توازن قبل الضغط الفعلي.',
        en: 'Re-encode the image at several quality levels and show the resulting file size and potential savings at each, helping you pick the best balance before actually compressing.',
    }),
    note: Object.freeze({
        ar: 'التحليل تقريبي ومبني على إعادة الترميز بصيغة JPEG بغض النظر عن صيغة الملف الأصلية.',
        en: 'The analysis is approximate and based on re-encoding as JPEG regardless of the original file format.',
    }),
    inputs: Object.freeze([fileInput()]),
    async process(values, language) {
        const bitmap = await createImageBitmap(values.image);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        context.drawImage(bitmap, 0, 0);
        bitmap.close();

        const qualities = [0.9, 0.7, 0.5, 0.3];
        const results = [];
        for (const quality of qualities) {
            // eslint-disable-next-line no-await-in-loop -- sequential encode keeps memory bounded
            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('encode failed'))), 'image/jpeg', quality);
            });
            const savingsPercent = ((values.image.size - blob.size) / values.image.size) * 100;
            results.push({ quality, size: blob.size, savingsPercent });
        }

        const report = results
            .map(({ quality, size, savingsPercent }) => `${Math.round(quality * 100)}% ${localized(language, 'جودة', 'quality')}: ${(size / 1024).toFixed(1)} KB (${savingsPercent >= 0 ? '-' : '+'}${Math.abs(savingsPercent).toFixed(1)}%)`)
            .join('\n');

        return {
            value: `${(values.image.size / 1024).toFixed(1)} KB`,
            label: localized(language, 'تحليل الضغط جاهز', 'Compression analysis is ready'),
            details: report,
        };
    },
});

const IMAGE_SIGNATURES = Object.freeze({
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]],
    'image/bmp': [[0x42, 0x4D]],
});

function checkImageSignature(bytes, claimedType) {
    const signatures = IMAGE_SIGNATURES[claimedType];
    if (!signatures) return { valid: false, reason: 'unknown-type' };

    for (const signature of signatures) {
        if (signature.every((byte, index) => bytes[index] === byte)) {
            if (claimedType === 'image/webp') {
                const marker = String.fromCharCode(...bytes.slice(8, 12));
                if (marker !== 'WEBP') return { valid: false, reason: 'riff-not-webp' };
            }
            return { valid: true };
        }
    }
    return { valid: false, reason: 'signature-mismatch' };
}

const imageValidator = imageTool({
    id: 'image-validator',
    icon: 'VALID',
    action: Object.freeze({ ar: 'تحقق من الصورة', en: 'Validate image' }),
    title: Object.freeze({ ar: 'التحقق من صحة ملف الصورة', en: 'Image File Validator' }),
    description: Object.freeze({
        ar: 'تأكد أن ملف الصورة سليم فعليًا ويطابق صيغته المُعلنة، بفحص بصمة الملف الحقيقية وليس فقط امتداد الاسم.',
        en: 'Confirm an image file is genuinely intact and matches its claimed format, by checking the file\u2019s real signature rather than just its filename extension.',
    }),
    note: Object.freeze({
        ar: 'يفحص أول بايتات الملف (Magic Bytes) للتأكد من الصيغة الحقيقية، وهي طريقة موثوقة أكثر من الاعتماد على امتداد الاسم فقط.',
        en: 'Checks the file\u2019s first bytes (magic bytes) to confirm the real format, more reliable than trusting the filename extension alone.',
    }),
    inputs: Object.freeze([fileInput()]),
    async process(values, language) {
        const buffer = await values.image.slice(0, 16).arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const result = checkImageSignature(bytes, values.image.type);

        return {
            value: result.valid ? localized(language, 'صحيح', 'Valid') : localized(language, 'غير صحيح', 'Invalid'),
            label: result.valid
                ? localized(language, 'الملف سليم ومطابق لصيغته', 'The file is intact and matches its format')
                : localized(language, 'الملف قد يكون تالفًا أو مصنّفًا بصيغة خاطئة', 'The file may be corrupted or mislabeled'),
            details: `${localized(language, 'الصيغة المُعلنة', 'Claimed type')}: ${values.image.type || localized(language, 'غير معروفة', 'unknown')}`,
        };
    },
});

const TEXT_WATERMARK_POSITIONS = Object.freeze({
    bottomRight: (width, height, textWidth) => ({ x: width - textWidth - 20, y: height - 20 }),
    bottomLeft: () => ({ x: 20, useBottomAnchor: true }),
    topRight: (width, height, textWidth) => ({ x: width - textWidth - 20, y: 40 }),
    topLeft: () => ({ x: 20, y: 40 }),
    center: (width, height, textWidth) => ({ x: (width - textWidth) / 2, y: height / 2 }),
});

const textWatermark = imageTool({
    id: 'text-watermark',
    icon: 'TXT+',
    action: Object.freeze({ ar: 'أضف النص', en: 'Add text' }),
    title: Object.freeze({ ar: 'إضافة علامة مائية نصية', en: 'Text Watermark' }),
    description: Object.freeze({
        ar: 'أضف نصًا (اسمك، اسم موقعك، أو أي عبارة) كعلامة مائية فوق صورة، بدون الحاجة لتحضير صورة شعار جاهزة.',
        en: 'Add text (your name, site name, or any phrase) as a watermark over an image, without needing a prepared logo image.',
    }),
    note: Object.freeze({
        ar: 'النص يُرسم بلون أبيض شبه شفاف مع حدود سوداء خفيفة ليبقى مقروءًا فوق أي خلفية.',
        en: 'The text is drawn semi-transparent white with a subtle black outline to stay readable over any background.',
    }),
    inputs: Object.freeze([
        fileInput(),
        textFieldInput('text', 'نص العلامة المائية', 'Watermark text', '© Adawaty'),
        selectInput('position', 'الموضع', 'Position', [
            ['bottomRight', 'أسفل اليمين', 'Bottom-right'],
            ['bottomLeft', 'أسفل اليسار', 'Bottom-left'],
            ['topRight', 'أعلى اليمين', 'Top-right'],
            ['topLeft', 'أعلى اليسار', 'Top-left'],
            ['center', 'المنتصف', 'Center'],
        ]),
    ]),
    async process(values, language) {
        if (!values.text.trim()) {
            throw new Error(localized(language, 'أدخل نص العلامة المائية.', 'Enter the watermark text.'));
        }

        const bitmap = await createImageBitmap(values.image);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        context.drawImage(bitmap, 0, 0);
        bitmap.close();

        const fontSize = Math.max(16, Math.round(canvas.width / 25));
        context.font = `bold ${fontSize}px sans-serif`;
        const textWidth = context.measureText(values.text).width;

        const placeFn = TEXT_WATERMARK_POSITIONS[values.position] ?? TEXT_WATERMARK_POSITIONS.bottomRight;
        const placement = placeFn(canvas.width, canvas.height, textWidth);
        const x = placement.x;
        const y = placement.useBottomAnchor ? canvas.height - 20 : placement.y;

        context.globalAlpha = 0.85;
        context.lineWidth = Math.max(1, fontSize / 16);
        context.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        context.fillStyle = '#ffffff';
        context.strokeText(values.text, x, y);
        context.fillText(values.text, x, y);
        context.globalAlpha = 1;

        const type = values.image.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('encode failed'))), type, 0.92);
        });

        return {
            value: `${(blob.size / 1024).toFixed(1)} KB`,
            label: localized(language, 'الصورة مع العلامة المائية جاهزة', 'The watermarked image is ready'),
            details: '',
            download: { blob, filename: `adawaty-text-watermarked.${type === 'image/png' ? 'png' : 'jpg'}` },
            preview: blob,
        };
    },
});

const imageAnalysisExtraToolDefinitions = Object.freeze({
    [dominantColorFinder.id]: dominantColorFinder,
    [imageSizeAnalyzer.id]: imageSizeAnalyzer,
    [compressionAnalyzer.id]: compressionAnalyzer,
    [imageValidator.id]: imageValidator,
    [textWatermark.id]: textWatermark,
});

export { imageAnalysisExtraToolDefinitions };

// END OF FILE
