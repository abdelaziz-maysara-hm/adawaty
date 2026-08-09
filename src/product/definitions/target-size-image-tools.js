import { canvasToBlob, decodeImage } from '../image-processing.js';

const TARGET_PRESETS = Object.freeze([20, 50, 100, 200, 500]);
function localized(language, ar, en) { return language === 'ar' ? ar : en; }
function imageInput() { return Object.freeze({ id: 'image', type: 'file', accept: 'image/jpeg,image/png,image/webp,image/avif,image/bmp,.jpg,.jpeg,.png,.webp,.avif,.bmp', label: Object.freeze({ ar: 'اختر صورة', en: 'Choose an image' }), unit: Object.freeze({ ar: '', en: '' }) }); }
function targetInput() { return Object.freeze({ id: 'targetKb', type: 'number', min: 5, max: 5000, step: 1, defaultValue: 100, placeholder: '100', label: Object.freeze({ ar: 'الحجم الأقصى المطلوب', en: 'Maximum target size' }), unit: Object.freeze({ ar: 'KB', en: 'KB' }) }); }
function normalizeTargetKb(value) { return Math.max(5, Math.min(5000, Math.round(Number(value) || 100))); }
function nextImageScale(targetBytes, currentBytes) { return currentBytes <= 0 || targetBytes >= currentBytes ? 1 : Math.max(0.35, Math.min(0.9, Math.sqrt(targetBytes / currentBytes) * 0.92)); }

async function compressImageToTarget(file, targetKb) {
    if (!(file instanceof File) || !file.type.startsWith('image/')) throw new Error('Choose a valid JPG, PNG, WebP, AVIF or BMP image.');
    const targetBytes = normalizeTargetKb(targetKb) * 1024;
    const image = await decodeImage(file);
    let scale = 1;
    let best;
    for (let resizeAttempt = 0; resizeAttempt < 6; resizeAttempt += 1) {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw new Error('Image compression is unavailable in this browser.');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        let low = 0.05;
        let high = 0.95;
        let fitting;
        let smallest;
        for (let qualityAttempt = 0; qualityAttempt < 9; qualityAttempt += 1) {
            const quality = (low + high) / 2;
            const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
            if (!smallest || blob.size < smallest.blob.size) smallest = { blob, quality };
            if (blob.size <= targetBytes) { fitting = { blob, quality }; low = quality; } else { high = quality; }
        }
        const candidate = fitting ?? smallest;
        best = { ...candidate, width: canvas.width, height: canvas.height };
        if (fitting) return best;
        scale *= nextImageScale(targetBytes, candidate.blob.size);
    }
    return best;
}

function resultFor(processed, file, targetKb, language) {
    const actualKb = processed.blob.size / 1024;
    const base = file.name.replace(/\.[^.]+$/, '') || 'image';
    return { value: `${actualKb.toFixed(1)} KB`, label: localized(language, 'الصورة المضغوطة جاهزة', 'Compressed image is ready'), details: localized(language, `${processed.width} × ${processed.height} بكسل · الهدف ${targetKb} KB`, `${processed.width} × ${processed.height} px · ${targetKb} KB target`), preview: processed.blob, download: { blob: processed.blob, filename: `adawaty-${base}-${targetKb}kb.jpg` } };
}

function toolDefinition(targetKb) {
    const flexible = targetKb === undefined;
    const id = flexible ? 'compress-image-to-target-size' : `compress-image-to-${targetKb}kb`;
    return Object.freeze({
        id, category: 'image', icon: flexible ? 'KB' : `${targetKb}KB`,
        action: Object.freeze({ ar: 'اضغط الصورة', en: 'Compress image' }),
        title: Object.freeze({ ar: flexible ? 'ضغط الصورة إلى حجم محدد' : `ضغط الصورة إلى ${targetKb}KB`, en: flexible ? 'Compress Image to Target Size' : `Compress Image to ${targetKb}KB` }),
        description: Object.freeze({ ar: flexible ? 'حدد الحد الأقصى بالكيلوبايت واضغط الصورة تلقائيًا بالجودة والأبعاد المناسبة.' : `اضغط الصورة تلقائيًا لتصبح ${targetKb}KB أو أقل قدر الإمكان.`, en: flexible ? 'Set a maximum size in kilobytes and automatically optimize image quality and dimensions.' : `Automatically compress an image to ${targetKb}KB or less whenever possible.` }),
        note: Object.freeze({ ar: 'يكون الناتج JPG وتُستبدل الشفافية بخلفية بيضاء. قد تُخفّض الأبعاد للوصول إلى الملفات الصغيرة جدًا.', en: 'Output is JPG; transparency becomes white. Dimensions may be reduced for very small targets.' }),
        tags: Object.freeze(['image compressor', 'target size', `${targetKb ?? 'custom'}kb`, 'jpg', 'form upload', 'processing']),
        inputs: Object.freeze(flexible ? [imageInput(), targetInput()] : [imageInput()]),
        async process(values, language) { const target = normalizeTargetKb(flexible ? values.targetKb : targetKb); return resultFor(await compressImageToTarget(values.image, target), values.image, target, language); },
    });
}

const definitions = [toolDefinition(), ...TARGET_PRESETS.map(toolDefinition)];
const targetSizeImageToolDefinitions = Object.freeze(Object.fromEntries(definitions.map((definition) => [definition.id, definition])));
export { nextImageScale, normalizeTargetKb, TARGET_PRESETS, targetSizeImageToolDefinitions };

// END OF FILE
