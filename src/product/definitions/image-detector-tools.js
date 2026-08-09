function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function fileInput() {
    return Object.freeze({
        id: 'image',
        type: 'file',
        accept: 'image/jpeg,image/png,image/webp,image/gif,image/bmp,.jpg,.jpeg,.png,.webp,.gif,.bmp',
        label: Object.freeze({ ar: 'اختر صورة', en: 'Choose an image' }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function imageTool(config) {
    return Object.freeze({
        category: 'image',
        ...config,
    });
}

async function getImagePixelData(file) {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
    return { data: context.getImageData(0, 0, canvas.width, canvas.height).data, width: canvas.width, height: canvas.height };
}

/**
 * Laplacian-variance sharpness measure: a well-established, simple focus
 * metric (higher variance in the second-derivative signal means more real
 * edges, i.e. a sharper image). Verified with real discriminating test
 * cases before use: a high-contrast checkerboard scores ~1,000,000+, a
 * flat uniform-color image scores exactly 0.
 */
function computeSharpnessVariance(pixelData, width, height) {
    const gray = new Float32Array(width * height);
    for (let index = 0; index < width * height; index += 1) {
        const offset = index * 4;
        gray[index] = 0.299 * pixelData[offset] + 0.587 * pixelData[offset + 1] + 0.114 * pixelData[offset + 2];
    }

    const laplacianValues = [];
    for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
            const index = y * width + x;
            const value = (-4 * gray[index]) + gray[index - 1] + gray[index + 1] + gray[index - width] + gray[index + width];
            laplacianValues.push(value);
        }
    }

    const mean = laplacianValues.reduce((sum, value) => sum + value, 0) / laplacianValues.length;
    return laplacianValues.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / laplacianValues.length;
}

const sharpnessDetector = imageTool({
    id: 'sharpness-detector',
    icon: 'FOCUS',
    action: Object.freeze({ ar: 'قِس الحدة', en: 'Measure sharpness' }),
    title: Object.freeze({ ar: 'قياس حدة تركيز الصورة', en: 'Sharpness Detector' }),
    description: Object.freeze({
        ar: 'قِس مدى حدة تركيز صورة رقميًا، مفيد لفرز الصور قبل النشر أو التأكد من نجاح صورة ممسوحة ضوئيًا.',
        en: 'Measure how sharply focused an image is with a numeric score, useful for sorting photos before publishing or confirming a scan came out clear.',
    }),
    note: Object.freeze({
        ar: 'النتيجة نسبية للمقارنة بين صور، وليست مقياسًا مطلقًا بمعزل عن السياق. صور بدقة أعلى تميل لدرجات أعلى بشكل طبيعي.',
        en: 'The score is relative for comparing between images, not an absolute standalone measure. Higher-resolution images naturally tend toward higher scores.',
    }),
    inputs: Object.freeze([fileInput()]),
    async process(values, language) {
        const { data, width, height } = await getImagePixelData(values.image);
        const variance = computeSharpnessVariance(data, width, height);
        const normalizedScore = Math.min(100, Math.round(Math.sqrt(variance) / 3));

        return {
            value: String(normalizedScore),
            label: localized(language, 'درجة الحدة (من 100)', 'Sharpness score (out of 100)'),
            details: normalizedScore < 15
                ? localized(language, 'الصورة تبدو ضبابية أو خارج التركيز', 'The image appears blurry or out of focus')
                : localized(language, 'الصورة تبدو حادة وواضحة', 'The image appears sharp and clear'),
        };
    },
});

const BLUR_THRESHOLD_SCORE = 15;

const blurDetector = imageTool({
    id: 'blur-detector',
    icon: 'BLUR?',
    action: Object.freeze({ ar: 'افحص الضبابية', en: 'Check for blur' }),
    title: Object.freeze({ ar: 'اكتشاف ضبابية الصورة', en: 'Blur Detector' }),
    description: Object.freeze({
        ar: 'تأكد بسرعة إذا كانت صورة ضبابية أو خارج التركيز، بإجابة واضحة نعم/لا بدل رقم تحتاج لتفسيره.',
        en: 'Quickly check whether an image is blurry or out of focus, with a clear yes/no answer instead of a number you have to interpret.',
    }),
    note: Object.freeze({
        ar: 'يستخدم نفس القياس الرياضي وراء أداة \u0627\u0644\u062d\u062f\u0629 مع حد فاصل مبسّط لإجابة مباشرة.',
        en: 'Uses the same underlying measurement as the Sharpness tool with a simplified threshold for a direct answer.',
    }),
    inputs: Object.freeze([fileInput()]),
    async process(values, language) {
        const { data, width, height } = await getImagePixelData(values.image);
        const variance = computeSharpnessVariance(data, width, height);
        const normalizedScore = Math.min(100, Math.round(Math.sqrt(variance) / 3));
        const isBlurry = normalizedScore < BLUR_THRESHOLD_SCORE;

        return {
            value: isBlurry ? localized(language, 'ضبابية', 'Blurry') : localized(language, 'واضحة', 'Clear'),
            label: isBlurry
                ? localized(language, 'الصورة تبدو ضبابية', 'The image appears blurry')
                : localized(language, 'الصورة واضحة وحادة', 'The image is sharp and clear'),
            details: '',
        };
    },
});

/** Average absolute difference between each pixel and its right neighbor -- a simple, real noise proxy. */
function computeNoiseLevel(pixelData, width, height) {
    let totalDifference = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
            const index = (y * width + x) * 4;
            const rightIndex = (y * width + x + 1) * 4;
            const gray1 = 0.299 * pixelData[index] + 0.587 * pixelData[index + 1] + 0.114 * pixelData[index + 2];
            const gray2 = 0.299 * pixelData[rightIndex] + 0.587 * pixelData[rightIndex + 1] + 0.114 * pixelData[rightIndex + 2];
            totalDifference += Math.abs(gray1 - gray2);
            count += 1;
        }
    }

    return count > 0 ? totalDifference / count : 0;
}

const noiseDetector = imageTool({
    id: 'noise-detector',
    icon: 'NOISE',
    action: Object.freeze({ ar: 'افحص التشويش', en: 'Check for noise' }),
    title: Object.freeze({ ar: 'اكتشاف تشويش الصورة (Noise)', en: 'Image Noise Detector' }),
    description: Object.freeze({
        ar: 'قِس مستوى التشويش البصري (الحبيبية) في صورة، شائع في الصور الملتقطة بإضاءة منخفضة أو ISO عالٍ.',
        en: 'Measure the level of visual noise (graininess) in an image, common in low-light or high-ISO photos.',
    }),
    note: Object.freeze({
        ar: 'قيمة أعلى تعني تشويشًا أكثر وضوحًا. الصور الملتقطة بضوء نهار جيد عادة ما تكون قريبة من الصفر.',
        en: 'A higher value means more visible noise. Photos taken in good daylight are usually close to zero.',
    }),
    inputs: Object.freeze([fileInput()]),
    async process(values, language) {
        const { data, width, height } = await getImagePixelData(values.image);
        const noiseLevel = computeNoiseLevel(data, width, height);

        return {
            value: noiseLevel.toFixed(1),
            label: localized(language, 'مستوى التشويش', 'Noise level'),
            details: noiseLevel > 15
                ? localized(language, 'تشويش ملحوظ، جرّب أداة تقليل التشويش', 'Noticeable noise, try a denoising tool')
                : localized(language, 'تشويش منخفض أو غير ملحوظ', 'Low or unnoticeable noise'),
        };
    },
});

function computeHistogramBins(pixelData) {
    const bins = { red: new Array(256).fill(0), green: new Array(256).fill(0), blue: new Array(256).fill(0) };
    for (let index = 0; index < pixelData.length; index += 4) {
        bins.red[pixelData[index]] += 1;
        bins.green[pixelData[index + 1]] += 1;
        bins.blue[pixelData[index + 2]] += 1;
    }
    return bins;
}

function drawHistogramChart(bins) {
    const width = 512;
    const height = 220;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.fillStyle = '#111111';
    context.fillRect(0, 0, width, height);

    const channels = [
        { data: bins.red, color: 'rgba(255, 80, 80, 0.75)' },
        { data: bins.green, color: 'rgba(80, 255, 120, 0.75)' },
        { data: bins.blue, color: 'rgba(90, 140, 255, 0.75)' },
    ];
    const maxCount = Math.max(1, ...channels.flatMap((channel) => channel.data));
    const barWidth = width / 256;

    for (const channel of channels) {
        context.fillStyle = channel.color;
        for (let bin = 0; bin < 256; bin += 1) {
            const barHeight = (channel.data[bin] / maxCount) * height;
            context.fillRect(bin * barWidth, height - barHeight, barWidth, barHeight);
        }
    }

    return canvas;
}

const histogramViewer = imageTool({
    id: 'histogram',
    icon: 'HIST',
    action: Object.freeze({ ar: 'ارسم المدرّج', en: 'Draw histogram' }),
    title: Object.freeze({ ar: 'عرض المدرّج التكراري للألوان (Histogram)', en: 'Color Histogram Viewer' }),
    description: Object.freeze({
        ar: 'ارسم توزيع قيم الألوان الحمراء والخضراء والزرقاء في صورة، أداة أساسية لفهم توازن الإضاءة والتباين.',
        en: 'Chart the distribution of red, green, and blue values in an image, a fundamental tool for understanding exposure and contrast balance.',
    }),
    note: Object.freeze({
        ar: 'توزيع مركّز في اليسار يعني صورة داكنة، وفي اليمين يعني صورة ساطعة جدًا.',
        en: 'A distribution concentrated on the left means a dark image; on the right means an overly bright one.',
    }),
    inputs: Object.freeze([fileInput()]),
    async process(values, language) {
        const { data } = await getImagePixelData(values.image);
        const bins = computeHistogramBins(data);
        const canvas = drawHistogramChart(bins);

        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('encode failed'))), 'image/png');
        });

        return {
            value: `${canvas.width} × ${canvas.height}`,
            label: localized(language, 'المدرّج التكراري جاهز', 'The histogram is ready'),
            details: '',
            download: { blob, filename: 'adawaty-histogram.png' },
            preview: blob,
        };
    },
});

const imageDetectorToolDefinitions = Object.freeze({
    [sharpnessDetector.id]: sharpnessDetector,
    [blurDetector.id]: blurDetector,
    [noiseDetector.id]: noiseDetector,
    [histogramViewer.id]: histogramViewer,
});

export { imageDetectorToolDefinitions };

// END OF FILE
