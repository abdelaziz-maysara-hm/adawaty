import {
    decodeImage,
    inspectImage,
    outputName,
    renderImage,
} from '../image-processing.js';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function fileInput() {
    return Object.freeze({
        id: 'image',
        type: 'file',
        accept: 'image/jpeg,image/png,image/webp,image/gif,image/bmp',
        label: Object.freeze({ ar: 'اختر صورة', en: 'Choose an image' }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function numberInput(id, ar, en, placeholder, options = {}) {
    return Object.freeze({
        id,
        type: 'number',
        min: options.min ?? 0,
        max: options.max ?? 100_000,
        step: options.step ?? 1,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze(options.unit ?? { ar: 'بكسل', en: 'px' }),
        placeholder: String(placeholder),
    });
}

function selectInput(id, ar, en, options) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map((option) => Object.freeze(option))),
    });
}

function outputType(file) {
    return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
        ? file.type
        : 'image/png';
}

function result(blob, filename, width, height, language, label) {
    return {
        value: `${width} × ${height}`,
        label: localized(language, label.ar, label.en),
        details: `${(blob.size / 1024).toFixed(1)} KB`,
        download: { blob, filename },
        preview: blob,
    };
}

function toHex(red, green, blue) {
    return `#${[red, green, blue]
        .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()}`;
}

function rgbToHsl(red, green, blue) {
    const normalized = [red, green, blue].map((channel) => channel / 255);
    const maximum = Math.max(...normalized);
    const minimum = Math.min(...normalized);
    const lightness = (maximum + minimum) / 2;
    const delta = maximum - minimum;

    if (delta === 0) {
        return Object.freeze({ hue: 0, saturation: 0, lightness: Math.round(lightness * 100) });
    }

    const saturation = delta / (1 - Math.abs((2 * lightness) - 1));
    let hue;
    if (maximum === normalized[0]) {
        hue = 60 * (((normalized[1] - normalized[2]) / delta) % 6);
    } else if (maximum === normalized[1]) {
        hue = 60 * (((normalized[2] - normalized[0]) / delta) + 2);
    } else {
        hue = 60 * (((normalized[0] - normalized[1]) / delta) + 4);
    }

    return Object.freeze({
        hue: Math.round((hue + 360) % 360),
        saturation: Math.round(saturation * 100),
        lightness: Math.round(lightness * 100),
    });
}

function normalizeSampleCoordinate(percentage, dimension) {
    const safePercentage = Math.min(100, Math.max(0, Number(percentage) || 0));
    return Math.min(dimension - 1, Math.floor((safePercentage / 100) * dimension));
}

async function sampleImageColor(file, xPercent, yPercent) {
    if (!(file instanceof File) || !file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file.');
    }

    const image = await decodeImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
        throw new Error('Image processing is unavailable in this browser.');
    }

    context.drawImage(image, 0, 0);
    const x = normalizeSampleCoordinate(xPercent, canvas.width);
    const y = normalizeSampleCoordinate(yPercent, canvas.height);
    const [red, green, blue, alpha] = context.getImageData(x, y, 1, 1).data;

    return Object.freeze({
        red,
        green,
        blue,
        alpha,
        x,
        y,
        hex: toHex(red, green, blue),
        hsl: rgbToHsl(red, green, blue),
    });
}

async function extractPalette(file, paletteSize) {
    if (!(file instanceof File) || !file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file.');
    }

    const image = await decodeImage(file);
    const maxSide = 160;
    const scale = Math.min(
        1,
        maxSide / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) {
        throw new Error('Image processing is unavailable in this browser.');
    }

    context.drawImage(image, 0, 0, width, height);
    const { data } = context.getImageData(0, 0, width, height);

    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let opaque = 0;
    const buckets = new Map();
    const step = 24;

    for (let index = 0; index < data.length; index += 4) {
        if (data[index + 3] < 128) {
            continue;
        }

        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        sumR += red;
        sumG += green;
        sumB += blue;
        opaque += 1;

        const key = `${Math.round(red / step) * step},${Math.round(green / step) * step},${Math.round(blue / step) * step}`;
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    if (opaque === 0) {
        throw new Error('No opaque pixels found in this image.');
    }

    const average = Object.freeze({
        red: Math.round(sumR / opaque),
        green: Math.round(sumG / opaque),
        blue: Math.round(sumB / opaque),
    });

    const dominant = [...buckets.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, Math.max(1, Math.min(12, paletteSize)))
        .map(([key, count]) => {
            const [red, green, blue] = key.split(',').map(Number);
            return Object.freeze({
                red,
                green,
                blue,
                hex: toHex(red, green, blue),
                share: Math.round((count / opaque) * 1000) / 10,
            });
        });

    return Object.freeze({
        average: Object.freeze({
            ...average,
            hex: toHex(average.red, average.green, average.blue),
        }),
        dominant,
        sampleWidth: width,
        sampleHeight: height,
        sourceWidth: image.naturalWidth,
        sourceHeight: image.naturalHeight,
    });
}

const cropper = Object.freeze({
    id: 'image-cropper',
    category: 'image',
    icon: 'CROP',
    action: Object.freeze({ ar: 'اقتص الصورة', en: 'Crop image' }),
    title: Object.freeze({ ar: 'قص الصور أونلاين', en: 'Online Image Cropper' }),
    description: Object.freeze({
        ar: 'حدد موضع وأبعاد الجزء المطلوب، ثم نزّل الصورة المقصوصة فورًا.',
        en: 'Choose the position and size, then download the cropped image instantly.',
    }),
    note: Object.freeze({
        ar: 'القيم بالبكسل وتبدأ نقطة القص من أعلى يسار الصورة. تتم المعالجة بالكامل على جهازك.',
        en: 'Values are in pixels from the top-left corner. Processing stays entirely on your device.',
    }),
    inputs: Object.freeze([
        fileInput(),
        numberInput('x', 'البداية الأفقية', 'Left position', 0),
        numberInput('y', 'البداية الرأسية', 'Top position', 0),
        numberInput('width', 'عرض القص', 'Crop width', 800, { min: 1 }),
        numberInput('height', 'ارتفاع القص', 'Crop height', 600, { min: 1 }),
    ]),
    async process(values, language) {
        const dimensions = await inspectImage(values.image);

        if (
            values.x + values.width > dimensions.width
            || values.y + values.height > dimensions.height
        ) {
            throw new Error(localized(
                language,
                `منطقة القص تتجاوز أبعاد الصورة (${dimensions.width} × ${dimensions.height}).`,
                `The crop exceeds the image dimensions (${dimensions.width} × ${dimensions.height}).`,
            ));
        }

        const type = outputType(values.image);
        const processed = await renderImage({
            file: values.image,
            width: values.width,
            height: values.height,
            type,
            source: {
                x: values.x,
                y: values.y,
                width: values.width,
                height: values.height,
            },
        });
        return result(
            processed.blob,
            outputName(values.image, 'cropped', type),
            processed.width,
            processed.height,
            language,
            { ar: 'الصورة المقصوصة جاهزة', en: 'Cropped image is ready' },
        );
    },
});

const rotator = Object.freeze({
    id: 'image-rotate-flip',
    category: 'image',
    icon: '↻',
    action: Object.freeze({ ar: 'طبّق التدوير', en: 'Apply transform' }),
    title: Object.freeze({ ar: 'تدوير وقلب الصور', en: 'Rotate and Flip Image' }),
    description: Object.freeze({
        ar: 'دوّر الصورة أو اعكسها أفقيًا ورأسيًا ثم نزّل النتيجة.',
        en: 'Rotate an image or flip it horizontally and vertically, then download the result.',
    }),
    note: Object.freeze({
        ar: 'تظل الصورة داخل متصفحك ولا تُرفع إلى أي خادم.',
        en: 'The image stays in your browser and is never uploaded.',
    }),
    inputs: Object.freeze([
        fileInput(),
        selectInput('rotation', 'زاوية التدوير', 'Rotation angle', [
            { value: '0', label: { ar: 'بدون تدوير', en: 'No rotation' } },
            { value: '90', label: { ar: '90° يمينًا', en: '90° clockwise' } },
            { value: '180', label: { ar: '180°', en: '180°' } },
            { value: '270', label: { ar: '90° يسارًا', en: '90° counterclockwise' } },
        ]),
        selectInput('flip', 'اتجاه القلب', 'Flip direction', [
            { value: 'none', label: { ar: 'بدون قلب', en: 'No flip' } },
            { value: 'horizontal', label: { ar: 'قلب أفقي', en: 'Flip horizontally' } },
            { value: 'vertical', label: { ar: 'قلب رأسي', en: 'Flip vertically' } },
            { value: 'both', label: { ar: 'قلب أفقي ورأسي', en: 'Flip both ways' } },
        ]),
    ]),
    async process(values, language) {
        const type = outputType(values.image);
        const processed = await renderImage({
            file: values.image,
            type,
            rotation: Number(values.rotation),
            flipX: ['horizontal', 'both'].includes(values.flip),
            flipY: ['vertical', 'both'].includes(values.flip),
        });
        return result(
            processed.blob,
            outputName(values.image, 'transformed', type),
            processed.width,
            processed.height,
            language,
            { ar: 'الصورة المعدّلة جاهزة', en: 'Transformed image is ready' },
        );
    },
});

const metadataRemover = Object.freeze({
    id: 'image-metadata-remover',
    category: 'image',
    icon: 'SAFE',
    action: Object.freeze({ ar: 'احذف البيانات الخفية', en: 'Remove metadata' }),
    title: Object.freeze({ ar: 'حذف بيانات الصور الخفية', en: 'Image Metadata Remover' }),
    description: Object.freeze({
        ar: 'أنشئ نسخة نظيفة من الصورة بدون بيانات EXIF مثل الموقع ونوع الكاميرا.',
        en: 'Create a clean copy without EXIF data such as location and camera details.',
    }),
    note: Object.freeze({
        ar: 'تُعاد كتابة وحدات البكسل فقط داخل المتصفح، لذلك لا تغادر الصورة جهازك.',
        en: 'Only the pixels are rewritten in-browser, so the image never leaves your device.',
    }),
    inputs: Object.freeze([fileInput()]),
    async process(values, language) {
        const type = outputType(values.image);
        const processed = await renderImage({
            file: values.image,
            type,
            quality: 0.95,
        });
        return result(
            processed.blob,
            outputName(values.image, 'clean', type),
            processed.width,
            processed.height,
            language,
            { ar: 'النسخة النظيفة جاهزة', en: 'Clean image is ready' },
        );
    },
});

const averageColorPicker = Object.freeze({
    id: 'image-average-color-picker',
    category: 'image',
    icon: '◉',
    action: Object.freeze({ ar: 'استخرج الألوان', en: 'Extract colors' }),
    title: Object.freeze({
        ar: 'استخراج اللون المتوسط والسائد من الصورة',
        en: 'Image Average & Dominant Color Picker',
    }),
    description: Object.freeze({
        ar: 'احسب اللون المتوسط ولوحة الألوان السائدة من أي صورة، مع نسب HEX وRGB جاهزة للنسخ.',
        en: 'Compute the average color and a dominant palette from any image, with ready HEX and RGB values.',
    }),
    note: Object.freeze({
        ar: 'التحليل يتم داخل المتصفح بعد تصغير عيّنة سريعة. لا تُرفع الصورة إلى أي سيرفر.',
        en: 'Analysis runs in your browser on a fast downscaled sample. The image is never uploaded.',
    }),
    inputs: Object.freeze([
        fileInput(),
        numberInput('paletteSize', 'عدد الألوان السائدة', 'Dominant colors', 6, {
            min: 1,
            max: 12,
            unit: { ar: '', en: '' },
        }),
    ]),
    async process(values, language) {
        const paletteSize = Number.isFinite(values.paletteSize)
            ? values.paletteSize
            : 6;

        try {
            const palette = await extractPalette(values.image, paletteSize);
            const { average, dominant } = palette;
            const paletteText = dominant
                .map((color, index) => `${index + 1}. ${color.hex} (${color.share}%)`)
                .join(language === 'ar' ? ' · ' : ' · ');

            return {
                value: average.hex,
                label: localized(
                    language,
                    `متوسط RGB ${average.red}, ${average.green}, ${average.blue}`,
                    `Average RGB ${average.red}, ${average.green}, ${average.blue}`,
                ),
                details: localized(
                    language,
                    `السائدة: ${paletteText}`,
                    `Dominant: ${paletteText}`,
                ),
            };
        } catch (error) {
            const message = error?.message ?? '';
            if (message.includes('opaque')) {
                throw new Error(localized(
                    language,
                    'لم يُعثر على بكسلات معتمة في هذه الصورة.',
                    'No opaque pixels found in this image.',
                ));
            }
            if (message.includes('valid image') || message.includes('decode')) {
                throw new Error(localized(
                    language,
                    'اختر ملف صورة صالحًا.',
                    'Please select a valid image file.',
                ));
            }
            throw new Error(localized(
                language,
                'تعذّر تحليل الصورة في هذا المتصفح.',
                'Unable to analyze this image in the current browser.',
            ));
        }
    },
});

const imageColorPicker = Object.freeze({
    id: 'image-color-picker',
    category: 'image',
    icon: 'PICK',
    action: Object.freeze({ ar: 'اختر لونًا من الصورة', en: 'Pick an image color' }),
    title: Object.freeze({ ar: 'منتقي لون من الصورة', en: 'Image Color Picker' }),
    description: Object.freeze({
        ar: 'اختر موضعًا أفقيًا ورأسيًا داخل الصورة واحصل على لون البكسل الدقيق بصيغ HEX وRGB وHSL.',
        en: 'Choose a horizontal and vertical position in an image and read the exact pixel color as HEX, RGB, and HSL.',
    }),
    note: Object.freeze({
        ar: 'النسب تبدأ من أعلى يسار الصورة. تتم قراءة الصورة محليًا داخل المتصفح ولا تُرفع إلى أي خادم.',
        en: 'Percentages start at the top-left corner. The image is read locally in your browser and is never uploaded.',
    }),
    tags: Object.freeze(['image', 'color', 'picker', 'hex', 'rgb', 'hsl', 'processing']),
    inputs: Object.freeze([
        fileInput(),
        numberInput('xPercent', 'الموضع الأفقي', 'Horizontal position', 50, {
            min: 0,
            max: 100,
            unit: { ar: '%', en: '%' },
        }),
        numberInput('yPercent', 'الموضع الرأسي', 'Vertical position', 50, {
            min: 0,
            max: 100,
            unit: { ar: '%', en: '%' },
        }),
    ]),
    async process(values, language) {
        try {
            const color = await sampleImageColor(
                values.image,
                values.xPercent ?? 50,
                values.yPercent ?? 50,
            );
            const alpha = (color.alpha / 255).toFixed(2);
            return {
                value: color.hex,
                label: `RGB ${color.red}, ${color.green}, ${color.blue} · Alpha ${alpha}`,
                details: `HSL ${color.hsl.hue}°, ${color.hsl.saturation}%, ${color.hsl.lightness}% · (${color.x}, ${color.y}) px`,
            };
        } catch (error) {
            throw new Error(localized(
                language,
                'تعذّر قراءة اللون. تأكد من اختيار صورة صالحة وموضع بين 0 و100%.',
                'Unable to read the color. Choose a valid image and a position between 0 and 100%.',
            ), { cause: error });
        }
    },
});

const imageEditingToolDefinitions = Object.freeze({
    [cropper.id]: cropper,
    [rotator.id]: rotator,
    [metadataRemover.id]: metadataRemover,
    [averageColorPicker.id]: averageColorPicker,
    [imageColorPicker.id]: imageColorPicker,
});

export { imageEditingToolDefinitions, normalizeSampleCoordinate, rgbToHsl };

// END OF FILE
