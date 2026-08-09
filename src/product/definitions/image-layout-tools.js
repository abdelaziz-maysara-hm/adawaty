function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function multiFileInput(id, ar, en) {
    return Object.freeze({
        id,
        type: 'file',
        multiple: true,
        accept: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function twoFileInputs() {
    return [
        Object.freeze({
            id: 'imageBefore',
            type: 'file',
            accept: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
            label: Object.freeze({ ar: 'الصورة الأولى (قبل)', en: 'First image (before)' }),
            unit: Object.freeze({ ar: '', en: '' }),
        }),
        Object.freeze({
            id: 'imageAfter',
            type: 'file',
            accept: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
            label: Object.freeze({ ar: 'الصورة الثانية (بعد)', en: 'Second image (after)' }),
            unit: Object.freeze({ ar: '', en: '' }),
        }),
    ];
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
        unit: Object.freeze(typeof unit === 'object' ? unit : { ar: unit, en: unit }),
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

/** Computes a cover-fit crop box so an image fills its cell without distortion. */
function computeCoverCropBox(sourceWidth, sourceHeight, targetWidth, targetHeight) {
    const sourceRatio = sourceWidth / sourceHeight;
    const targetRatio = targetWidth / targetHeight;

    if (sourceRatio > targetRatio) {
        const cropWidth = sourceHeight * targetRatio;
        return {
            x: (sourceWidth - cropWidth) / 2, y: 0, width: cropWidth, height: sourceHeight,
        };
    }
    const cropHeight = sourceWidth / targetRatio;
    return {
        x: 0, y: (sourceHeight - cropHeight) / 2, width: sourceWidth, height: cropHeight,
    };
}

async function drawImagesInGrid(files, columns, cellSize, gap, backgroundColor) {
    const rows = Math.ceil(files.length / columns);
    const canvasWidth = columns * cellSize + (columns - 1) * gap;
    const canvasHeight = rows * cellSize + (rows - 1) * gap;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const context = canvas.getContext('2d');
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    for (let index = 0; index < files.length; index += 1) {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const x = column * (cellSize + gap);
        const y = row * (cellSize + gap);

        // eslint-disable-next-line no-await-in-loop -- sequential draw keeps memory bounded for many images
        const bitmap = await createImageBitmap(files[index]);
        const cropBox = computeCoverCropBox(bitmap.width, bitmap.height, cellSize, cellSize);
        context.drawImage(
            bitmap,
            cropBox.x, cropBox.y, cropBox.width, cropBox.height,
            x, y, cellSize, cellSize,
        );
        bitmap.close();
    }

    return canvas;
}

async function canvasToPngBlob(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode failed'))), 'image/png');
    });
}

const gridMaker = imageTool({
    id: 'grid-maker',
    icon: 'GRID',
    action: Object.freeze({ ar: 'أنشئ الشبكة', en: 'Create grid' }),
    title: Object.freeze({ ar: 'ترتيب الصور في شبكة', en: 'Image Grid Maker' }),
    description: Object.freeze({
        ar: 'رتّب عدة صور في شبكة منتظمة بعدد أعمدة تختاره، كل صورة تُقص لتملأ خليتها دون تمديد.',
        en: 'Arrange several images into a uniform grid with a chosen number of columns, each image cover-cropped to fill its cell without stretching.',
    }),
    note: Object.freeze({
        ar: 'اختر الصور بالترتيب الذي تريد ظهورها به، من أعلى اليسار للأسفل صفًا بصف.',
        en: 'Select images in the order you want them to appear, from top-left downward row by row.',
    }),
    inputs: Object.freeze([
        multiFileInput('images', 'اختر الصور (اثنتان على الأقل)', 'Choose images (at least two)'),
        numberInput('columns', 'عدد الأعمدة', 'Columns', 3, 1, 10, ''),
        numberInput('cellSize', 'حجم كل خلية', 'Cell size', 300, 50, 1000, { ar: 'بكسل', en: 'px' }),
    ]),
    async process(values, language) {
        if (!Array.isArray(values.images) || values.images.length < 2) {
            throw new Error(localized(language, 'اختر صورتين على الأقل.', 'Choose at least two images.'));
        }

        const canvas = await drawImagesInGrid(values.images, Math.round(values.columns), Math.round(values.cellSize), 8, '#ffffff');
        const blob = await canvasToPngBlob(canvas);

        return {
            value: `${canvas.width} × ${canvas.height}`,
            label: localized(language, 'شبكة الصور جاهزة', 'The image grid is ready'),
            details: `${values.images.length} ${localized(language, 'صورة', 'images')}`,
            download: { blob, filename: 'adawaty-image-grid.png' },
            preview: blob,
        };
    },
});

async function drawLabeledContactSheet(files, columns, cellSize, gap, language) {
    const labelHeight = Math.round(cellSize * 0.12);
    const rows = Math.ceil(files.length / columns);
    const canvasWidth = columns * cellSize + (columns - 1) * gap;
    const canvasHeight = rows * (cellSize + labelHeight) + (rows - 1) * gap;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const context = canvas.getContext('2d');
    context.fillStyle = '#111111';
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    for (let index = 0; index < files.length; index += 1) {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const x = column * (cellSize + gap);
        const y = row * (cellSize + labelHeight + gap);

        // eslint-disable-next-line no-await-in-loop -- sequential draw keeps memory bounded
        const bitmap = await createImageBitmap(files[index]);
        const cropBox = computeCoverCropBox(bitmap.width, bitmap.height, cellSize, cellSize);
        context.drawImage(
            bitmap,
            cropBox.x, cropBox.y, cropBox.width, cropBox.height,
            x, y, cellSize, cellSize,
        );
        bitmap.close();

        context.fillStyle = '#ffffff';
        context.font = `${Math.round(labelHeight * 0.6)}px monospace`;
        context.textAlign = 'center';
        const label = `${index + 1}. ${files[index].name.slice(0, 20)}`;
        context.fillText(label, x + cellSize / 2, y + cellSize + labelHeight * 0.7);
    }

    return canvas;
}

const imageContactSheet = imageTool({
    id: 'image-contact-sheet',
    icon: 'SHEET',
    action: Object.freeze({ ar: 'أنشئ ورقة المصغرات', en: 'Create contact sheet' }),
    title: Object.freeze({ ar: 'إنشاء ورقة مصغّرات (Contact Sheet)', en: 'Image Contact Sheet' }),
    description: Object.freeze({
        ar: 'رتّب عدة صور في شبكة مع اسم كل ملف مكتوبًا أسفلها، على طراز أوراق المصغّرات التقليدية للمصورين.',
        en: 'Arrange several images into a grid with each file\u2019s name printed below it, in the style of a traditional photographer\u2019s contact sheet.',
    }),
    note: Object.freeze({
        ar: 'أسماء الملفات الطويلة تُقتطع تلقائيًا لتناسب عرض الخلية.',
        en: 'Long file names are automatically truncated to fit the cell width.',
    }),
    inputs: Object.freeze([
        multiFileInput('images', 'اختر الصور (اثنتان على الأقل)', 'Choose images (at least two)'),
        numberInput('columns', 'عدد الأعمدة', 'Columns', 4, 1, 10, ''),
        numberInput('cellSize', 'حجم كل خلية', 'Cell size', 200, 50, 600, { ar: 'بكسل', en: 'px' }),
    ]),
    async process(values, language) {
        if (!Array.isArray(values.images) || values.images.length < 2) {
            throw new Error(localized(language, 'اختر صورتين على الأقل.', 'Choose at least two images.'));
        }

        const canvas = await drawLabeledContactSheet(values.images, Math.round(values.columns), Math.round(values.cellSize), 6, language);
        const blob = await canvasToPngBlob(canvas);

        return {
            value: `${canvas.width} × ${canvas.height}`,
            label: localized(language, 'ورقة المصغّرات جاهزة', 'The contact sheet is ready'),
            details: `${values.images.length} ${localized(language, 'صورة', 'images')}`,
            download: { blob, filename: 'adawaty-contact-sheet.png' },
            preview: blob,
        };
    },
});

const photoStrip = imageTool({
    id: 'photo-strip',
    icon: 'STRIP',
    action: Object.freeze({ ar: 'أنشئ الشريط', en: 'Create strip' }),
    title: Object.freeze({ ar: 'إنشاء شريط صور (فوتوبوث)', en: 'Photo Strip Maker' }),
    description: Object.freeze({
        ar: 'اجمع عدة صور في شريط عمودي واحد بإطار أبيض، على طراز شرائط الفوتوبوث الكلاسيكية.',
        en: 'Combine several images into one vertical strip with a white frame, in the style of a classic photobooth strip.',
    }),
    note: Object.freeze({
        ar: 'يدعم من 2 إلى 6 صور في الشريط الواحد.',
        en: 'Supports 2 to 6 images in a single strip.',
    }),
    inputs: Object.freeze([
        multiFileInput('images', 'اختر الصور (من 2 إلى 6)', 'Choose images (2 to 6)'),
    ]),
    async process(values, language) {
        if (!Array.isArray(values.images) || values.images.length < 2 || values.images.length > 6) {
            throw new Error(localized(language, 'اختر من صورتين إلى 6 صور.', 'Choose between 2 and 6 images.'));
        }

        const cellWidth = 400;
        const cellHeight = 300;
        const border = 20;
        const gap = 16;
        const canvas = document.createElement('canvas');
        canvas.width = cellWidth + border * 2;
        canvas.height = (cellHeight * values.images.length) + (gap * (values.images.length - 1)) + border * 2;
        const context = canvas.getContext('2d');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        for (let index = 0; index < values.images.length; index += 1) {
            const y = border + index * (cellHeight + gap);
            // eslint-disable-next-line no-await-in-loop -- sequential draw keeps memory bounded
            const bitmap = await createImageBitmap(values.images[index]);
            const cropBox = computeCoverCropBox(bitmap.width, bitmap.height, cellWidth, cellHeight);
            context.drawImage(
                bitmap,
                cropBox.x, cropBox.y, cropBox.width, cropBox.height,
                border, y, cellWidth, cellHeight,
            );
            bitmap.close();
        }

        const blob = await canvasToPngBlob(canvas);
        return {
            value: `${canvas.width} × ${canvas.height}`,
            label: localized(language, 'شريط الصور جاهز', 'The photo strip is ready'),
            details: `${values.images.length} ${localized(language, 'صورة', 'images')}`,
            download: { blob, filename: 'adawaty-photo-strip.png' },
            preview: blob,
        };
    },
});

const imageComparisonSlider = imageTool({
    id: 'image-slider',
    icon: 'A|B',
    action: Object.freeze({ ar: 'أنشئ المقارنة', en: 'Create comparison' }),
    title: Object.freeze({ ar: 'مقارنة صورتين جنبًا إلى جنب', en: 'Before/After Image Comparison' }),
    description: Object.freeze({
        ar: 'ادمج صورتين (قبل وبعد) في صورة واحدة جنبًا إلى جنب مع تسمية كل جانب، لمشاركة مقارنة واضحة في مكان واحد.',
        en: 'Combine two images (before and after) side by side into one labeled image, for sharing a clear comparison in one place.',
    }),
    note: Object.freeze({
        ar: 'الصورتان تُقصّان تلقائيًا لتكونا بنفس الأبعاد قبل الدمج.',
        en: 'Both images are automatically cropped to the same dimensions before combining.',
    }),
    inputs: Object.freeze(twoFileInputs()),
    async process(values, language) {
        const [beforeBitmap, afterBitmap] = await Promise.all([
            createImageBitmap(values.imageBefore),
            createImageBitmap(values.imageAfter),
        ]);

        const cellHeight = 500;
        const cellWidth = 500;
        const labelHeight = 50;
        const divider = 4;

        const canvas = document.createElement('canvas');
        canvas.width = cellWidth * 2 + divider;
        canvas.height = cellHeight + labelHeight;
        const context = canvas.getContext('2d');
        context.fillStyle = '#000000';
        context.fillRect(0, 0, canvas.width, canvas.height);

        const beforeCrop = computeCoverCropBox(beforeBitmap.width, beforeBitmap.height, cellWidth, cellHeight);
        context.drawImage(
            beforeBitmap,
            beforeCrop.x, beforeCrop.y, beforeCrop.width, beforeCrop.height,
            0, labelHeight, cellWidth, cellHeight,
        );
        beforeBitmap.close();

        const afterCrop = computeCoverCropBox(afterBitmap.width, afterBitmap.height, cellWidth, cellHeight);
        context.drawImage(
            afterBitmap,
            afterCrop.x, afterCrop.y, afterCrop.width, afterCrop.height,
            cellWidth + divider, labelHeight, cellWidth, cellHeight,
        );
        afterBitmap.close();

        context.fillStyle = '#ffffff';
        context.font = 'bold 28px sans-serif';
        context.textAlign = 'center';
        context.fillText(localized(language, 'قبل', 'Before'), cellWidth / 2, labelHeight * 0.65);
        context.fillText(localized(language, 'بعد', 'After'), cellWidth + divider + cellWidth / 2, labelHeight * 0.65);

        const blob = await canvasToPngBlob(canvas);
        return {
            value: `${canvas.width} × ${canvas.height}`,
            label: localized(language, 'صورة المقارنة جاهزة', 'The comparison image is ready'),
            details: '',
            download: { blob, filename: 'adawaty-before-after.png' },
            preview: blob,
        };
    },
});

const imageLayoutToolDefinitions = Object.freeze({
    [gridMaker.id]: gridMaker,
    [imageContactSheet.id]: imageContactSheet,
    [photoStrip.id]: photoStrip,
    [imageComparisonSlider.id]: imageComparisonSlider,
});

export { imageLayoutToolDefinitions };

// END OF FILE
