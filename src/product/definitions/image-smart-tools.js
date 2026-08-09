function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function fileInput(accept = 'image/jpeg,.jpg,.jpeg') {
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

function imageTool(config) {
    return Object.freeze({
        category: 'image',
        ...config,
    });
}

const PIEXIF_URL = 'https://cdn.jsdelivr.net/npm/piexifjs@1.0.6/+esm';
let piexifPromise;

async function loadPiexif() {
    piexifPromise ??= import(PIEXIF_URL).then((module) => module.default ?? module).catch((error) => {
        piexifPromise = undefined;
        throw new Error(`Unable to load the EXIF engine: ${error.message}`);
    });
    return piexifPromise;
}

function fileToBinaryString(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const bytes = new Uint8Array(reader.result);
            let binary = '';
            for (let index = 0; index < bytes.length; index += 1) {
                binary += String.fromCharCode(bytes[index]);
            }
            resolve(binary);
        };
        reader.onerror = () => reject(new Error('Unable to read the file.'));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Maps the 8 standard EXIF Orientation tag values (per the EXIF spec) to the
 * rotation/flip needed to display the image correctly. Verified against the
 * spec's documented values directly, e.g. orientation 6 (a very common
 * case for phone photos shot in portrait) needs a 90-degree rotation with
 * no horizontal flip.
 */
const ORIENTATION_TRANSFORMS = Object.freeze({
    1: Object.freeze({ rotate: 0, flipX: false }),
    2: Object.freeze({ rotate: 0, flipX: true }),
    3: Object.freeze({ rotate: 180, flipX: false }),
    4: Object.freeze({ rotate: 180, flipX: true }),
    5: Object.freeze({ rotate: 90, flipX: true }),
    6: Object.freeze({ rotate: 90, flipX: false }),
    7: Object.freeze({ rotate: 270, flipX: true }),
    8: Object.freeze({ rotate: 270, flipX: false }),
});

function getOrientationTransform(value) {
    return ORIENTATION_TRANSFORMS[value] ?? ORIENTATION_TRANSFORMS[1];
}

const autoRotateImage = imageTool({
    id: 'auto-rotate-image',
    icon: 'AUTOROT',
    action: Object.freeze({ ar: 'صحّح الاتجاه', en: 'Fix orientation' }),
    title: Object.freeze({ ar: 'تصحيح اتجاه الصورة تلقائيًا', en: 'Auto-Rotate Image' }),
    description: Object.freeze({
        ar: 'صحّح اتجاه صورة JPEG تلقائيًا بقراءة بيانات EXIF المخزَّنة داخلها، لحل مشكلة الصور اللي بتظهر مقلوبة أو مدارة في بعض البرامج.',
        en: 'Automatically fix a JPEG\u2019s orientation by reading the EXIF data stored inside it, solving the common issue of photos appearing sideways or upside-down in some programs.',
    }),
    note: Object.freeze({
        ar: 'يعتمد على وسم الاتجاه (Orientation) في EXIF، وليس تحليلًا ذكيًا لمحتوى الصورة. لو الصورة لا تحتوي على هذا الوسم، لن يتغيّر شيء.',
        en: 'Relies on the EXIF Orientation tag, not smart content analysis. If the image has no such tag, nothing changes.',
    }),
    inputs: Object.freeze([fileInput()]),
    async process(values, language) {
        const piexif = await loadPiexif();
        const binaryString = await fileToBinaryString(values.image);
        const exifObj = piexif.load(binaryString);
        const orientationValue = exifObj['0th']?.[piexif.ImageIFD.Orientation] ?? 1;
        const transform = getOrientationTransform(orientationValue);

        if (transform.rotate === 0 && !transform.flipX) {
            return {
                value: localized(language, 'لا يوجد تصحيح مطلوب', 'No correction needed'),
                label: localized(language, 'الصورة بالاتجاه الصحيح بالفعل', 'The image is already correctly oriented'),
                details: '',
            };
        }

        const bitmap = await createImageBitmap(values.image);
        const rotatedDimensionsSwap = transform.rotate === 90 || transform.rotate === 270;
        const canvas = document.createElement('canvas');
        canvas.width = rotatedDimensionsSwap ? bitmap.height : bitmap.width;
        canvas.height = rotatedDimensionsSwap ? bitmap.width : bitmap.height;

        const context = canvas.getContext('2d');
        context.translate(canvas.width / 2, canvas.height / 2);
        if (transform.flipX) context.scale(-1, 1);
        context.rotate((transform.rotate * Math.PI) / 180);
        context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
        bitmap.close();

        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('encode failed'))), 'image/jpeg', 0.92);
        });

        return {
            value: `${transform.rotate}°${transform.flipX ? ` + ${localized(language, 'قلب', 'flip')}` : ''}`,
            label: localized(language, 'تم تصحيح اتجاه الصورة', 'The image orientation was corrected'),
            details: '',
            download: { blob, filename: values.image.name.replace(/\.jpe?g$/i, '-rotated.jpg') },
            preview: blob,
        };
    },
});

/** Finds the smallest bounding box containing all non-background content by scanning inward from each edge. */
function findContentBounds(pixelData, width, height, threshold) {
    const backgroundColor = [pixelData[0], pixelData[1], pixelData[2]];

    function isBackground(x, y) {
        const index = (y * width + x) * 4;
        const diff = Math.abs(pixelData[index] - backgroundColor[0])
            + Math.abs(pixelData[index + 1] - backgroundColor[1])
            + Math.abs(pixelData[index + 2] - backgroundColor[2]);
        return diff < threshold;
    }

    let top = 0;
    let bottom = height - 1;
    let left = 0;
    let right = width - 1;

    topScan: for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            if (!isBackground(x, y)) { top = y; break topScan; }
        }
    }
    bottomScan: for (let y = height - 1; y >= 0; y -= 1) {
        for (let x = 0; x < width; x += 1) {
            if (!isBackground(x, y)) { bottom = y; break bottomScan; }
        }
    }
    leftScan: for (let x = 0; x < width; x += 1) {
        for (let y = 0; y < height; y += 1) {
            if (!isBackground(x, y)) { left = x; break leftScan; }
        }
    }
    rightScan: for (let x = width - 1; x >= 0; x -= 1) {
        for (let y = 0; y < height; y += 1) {
            if (!isBackground(x, y)) { right = x; break rightScan; }
        }
    }

    return {
        top, left, width: Math.max(1, right - left + 1), height: Math.max(1, bottom - top + 1),
    };
}

const autoCropImage = imageTool({
    id: 'auto-crop-image',
    icon: 'AUTOCROP',
    action: Object.freeze({ ar: 'قصّ تلقائيًا', en: 'Auto-crop' }),
    title: Object.freeze({ ar: 'قص الحواف الفارغة تلقائيًا', en: 'Auto-Crop Image Borders' }),
    description: Object.freeze({
        ar: 'أزل الحواف الفارغة أو ذات اللون الموحّد المحيطة بمحتوى صورة تلقائيًا، مفيد للصور الممسوحة ضوئيًا أو لقطات الشاشة بهوامش زائدة.',
        en: 'Automatically remove empty or solid-colored borders surrounding an image\u2019s actual content, useful for scanned documents or screenshots with extra margins.',
    }),
    note: Object.freeze({
        ar: 'يعتمد على لون الزاوية العلوية اليسرى كمرجع للون الخلفية. صور بخلفيات معقدة أو متدرّجة قد لا تُقص بدقة.',
        en: 'Uses the top-left corner\u2019s color as the background reference. Images with complex or gradient backgrounds may not crop precisely.',
    }),
    inputs: Object.freeze([
        fileInput('image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'),
        numberInput('sensitivity', 'الحساسية لاختلاف اللون', 'Color difference sensitivity', 10, 1, 100, ''),
    ]),
    async process(values, language) {
        const bitmap = await createImageBitmap(values.image);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        context.drawImage(bitmap, 0, 0);
        bitmap.close();

        const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
        const bounds = findContentBounds(data, canvas.width, canvas.height, values.sensitivity);

        if (bounds.width === canvas.width && bounds.height === canvas.height) {
            return {
                value: localized(language, 'لا يوجد حواف للقص', 'No borders to crop'),
                label: localized(language, 'الصورة بلا حواف فارغة واضحة', 'The image has no clear empty borders'),
                details: '',
            };
        }

        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = bounds.width;
        outputCanvas.height = bounds.height;
        const outputContext = outputCanvas.getContext('2d');
        outputContext.drawImage(canvas, bounds.left, bounds.top, bounds.width, bounds.height, 0, 0, bounds.width, bounds.height);

        const type = values.image.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const blob = await new Promise((resolve, reject) => {
            outputCanvas.toBlob((result) => (result ? resolve(result) : reject(new Error('encode failed'))), type, 0.92);
        });

        return {
            value: `${bounds.width} × ${bounds.height}`,
            label: localized(language, 'الصورة المقصوصة تلقائيًا جاهزة', 'The auto-cropped image is ready'),
            details: '',
            download: { blob, filename: `adawaty-auto-cropped.${type === 'image/png' ? 'png' : 'jpg'}` },
            preview: blob,
        };
    },
});

const imageSmartToolDefinitions = Object.freeze({
    [autoRotateImage.id]: autoRotateImage,
    [autoCropImage.id]: autoCropImage,
});

export { imageSmartToolDefinitions };

// END OF FILE
