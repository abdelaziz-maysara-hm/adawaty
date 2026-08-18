import './site-navigation.js?v=pe1';
import { createEditorState } from './photo-editor/state.js';
import { renderEditedImage, decodeImage, inspectImage } from './photo-editor/engine.js';
import { buildFilterString } from './photo-editor/spec.js';
import {
    naturalToDisplayed, displayedToNatural, resizeBoxFromHandle, moveBox,
} from './photo-editor/crop-math.js';

const copy = Object.freeze({
    ar: Object.freeze({
        chooseFile: 'اختر صورة', dropHint: 'أو اسحب صورة وأفلتها هنا',
        crop: 'قص', rotate: 'تدوير', flipH: 'قلب أفقي', flipV: 'قلب رأسي',
        applyCrop: 'تطبيق القص', cancelCrop: 'إلغاء',
        adjustments: 'التعديلات', brightness: 'السطوع', contrast: 'التباين', saturation: 'التشبع',
        filters: 'الفلاتر', grayscale: 'رمادي', sepia: 'سيبيا', invert: 'عكس الألوان', blur: 'تمويه',
        watermark: 'علامة مائية', watermarkText: 'النص', watermarkPosition: 'الموضع', watermarkColor: 'اللون',
        watermarkOpacity: 'الشفافية', watermarkSize: 'حجم الخط', removeWatermark: 'إزالة العلامة المائية',
        posTopLeft: 'أعلى اليسار', posTopRight: 'أعلى اليمين', posCenter: 'المنتصف', posBottomLeft: 'أسفل اليسار', posBottomRight: 'أسفل اليمين',
        undo: 'تراجع', redo: 'إعادة', reset: 'بدء من جديد', download: 'تحميل',
        format: 'صيغة التحميل', exporting: 'جارٍ التجهيز...', invalidFile: 'اختر ملف صورة صالح.',
        statusReady: 'جاهز',
    }),
    en: Object.freeze({
        chooseFile: 'Choose an image', dropHint: 'or drag and drop an image here',
        crop: 'Crop', rotate: 'Rotate', flipH: 'Flip horizontal', flipV: 'Flip vertical',
        applyCrop: 'Apply Crop', cancelCrop: 'Cancel',
        adjustments: 'Adjustments', brightness: 'Brightness', contrast: 'Contrast', saturation: 'Saturation',
        filters: 'Filters', grayscale: 'Grayscale', sepia: 'Sepia', invert: 'Invert', blur: 'Blur',
        watermark: 'Watermark', watermarkText: 'Text', watermarkPosition: 'Position', watermarkColor: 'Color',
        watermarkOpacity: 'Opacity', watermarkSize: 'Font size', removeWatermark: 'Remove Watermark',
        posTopLeft: 'Top left', posTopRight: 'Top right', posCenter: 'Center', posBottomLeft: 'Bottom left', posBottomRight: 'Bottom right',
        undo: 'Undo', redo: 'Redo', reset: 'Start Over', download: 'Download',
        format: 'Download format', exporting: 'Preparing...', invalidFile: 'Please choose a valid image file.',
        statusReady: 'Ready',
    }),
});

function getUiLanguage() {
    return document.documentElement.dataset.language === 'en' ? 'en' : 'ar';
}

function t(key) {
    return copy[getUiLanguage()][key] ?? key;
}

const el = Object.freeze({
    uploadScreen: document.querySelector('#editor-upload'),
    workspace: document.querySelector('#editor-workspace'),
    fileInput: document.querySelector('#editor-file-input'),
    dropZone: document.querySelector('#editor-drop-zone'),
    canvasWrap: document.querySelector('#editor-canvas-wrap'),
    previewImage: document.querySelector('#editor-preview-image'),
    cropOverlay: document.querySelector('#editor-crop-overlay'),
    cropBox: document.querySelector('#editor-crop-box'),
    cropButton: document.querySelector('#editor-crop-button'),
    applyCropButton: document.querySelector('#editor-apply-crop'),
    cancelCropButton: document.querySelector('#editor-cancel-crop'),
    rotateButton: document.querySelector('#editor-rotate'),
    flipHButton: document.querySelector('#editor-flip-h'),
    flipVButton: document.querySelector('#editor-flip-v'),
    brightness: document.querySelector('#editor-brightness'),
    contrast: document.querySelector('#editor-contrast'),
    saturation: document.querySelector('#editor-saturation'),
    grayscale: document.querySelector('#editor-grayscale'),
    sepia: document.querySelector('#editor-sepia'),
    invert: document.querySelector('#editor-invert'),
    blur: document.querySelector('#editor-blur'),
    watermarkText: document.querySelector('#editor-watermark-text'),
    watermarkPosition: document.querySelector('#editor-watermark-position'),
    watermarkColor: document.querySelector('#editor-watermark-color'),
    watermarkOpacity: document.querySelector('#editor-watermark-opacity'),
    watermarkSize: document.querySelector('#editor-watermark-size'),
    removeWatermarkButton: document.querySelector('#editor-remove-watermark'),
    undoButton: document.querySelector('#editor-undo'),
    redoButton: document.querySelector('#editor-redo'),
    resetButton: document.querySelector('#editor-reset'),
    downloadButton: document.querySelector('#editor-download'),
    downloadFormat: document.querySelector('#editor-download-format'),
    statusMessage: document.querySelector('#editor-status'),
});

let currentFile = null;
let currentImage = null; // decoded HTMLImageElement, for natural dimensions
let state = null;
let isCropping = false;
let cropDragMode = null; // null | 'move' | a handle string like 'se'

function setStatus(message) {
    if (el.statusMessage) el.statusMessage.textContent = message;
}

/** Live preview via CSS filter/transform on the <img> itself -- instant, no re-encoding, matching how the Website Builder's preview stays lightweight. */
function updateLivePreview() {
    const spec = state.getSpec();
    el.previewImage.style.filter = buildFilterString(spec);
    const flipXScale = spec.flipX ? -1 : 1;
    const flipYScale = spec.flipY ? -1 : 1;
    el.previewImage.style.transform = `rotate(${spec.rotation}deg) scale(${flipXScale}, ${flipYScale})`;
}

function updateToolbarState() {
    el.undoButton.disabled = !state.canUndo();
    el.redoButton.disabled = !state.canRedo();
}

function refreshAll() {
    updateLivePreview();
    updateToolbarState();
    syncControlsFromState();
}

function syncControlsFromState() {
    const spec = state.getSpec();
    el.brightness.value = spec.brightness;
    el.contrast.value = spec.contrast;
    el.saturation.value = spec.saturation;
    el.grayscale.value = spec.grayscale;
    el.sepia.value = spec.sepia;
    el.invert.value = spec.invert;
    el.blur.value = spec.blur;
    if (spec.watermark) {
        el.watermarkText.value = spec.watermark.text;
        el.watermarkPosition.value = spec.watermark.position;
        el.watermarkColor.value = spec.watermark.color;
        el.watermarkOpacity.value = Math.round(spec.watermark.opacity * 100);
        el.watermarkSize.value = spec.watermark.fontSize;
    } else {
        // Keep the form visually in sync with the spec even when the
        // watermark was cleared indirectly (e.g. via undo), not just
        // through the dedicated remove button's own click handler.
        el.watermarkText.value = '';
    }
}

async function loadImageFile(file) {
    if (!(file instanceof File) || !file.type.startsWith('image/')) {
        window.alert(t('invalidFile'));
        return;
    }

    try {
        await inspectImage(file); // validates decodability up front, matching every other image tool's safety check
        const image = await decodeImage(file);
        currentFile = file;
        currentImage = image;
        state = createEditorState(image.naturalWidth, image.naturalHeight);
        state.subscribe(refreshAll);

        el.previewImage.src = URL.createObjectURL(file);
        el.uploadScreen.hidden = true;
        el.workspace.hidden = false;
        refreshAll();
        setStatus(t('statusReady'));
    } catch {
        window.alert(t('invalidFile'));
    }
}

function wireUpload() {
    el.fileInput.addEventListener('change', () => {
        const file = el.fileInput.files?.[0];
        if (file) loadImageFile(file);
    });

    ['dragover', 'dragenter'].forEach((eventName) => {
        el.dropZone.addEventListener(eventName, (event) => {
            event.preventDefault();
            el.dropZone.classList.add('is-dragover');
        });
    });
    ['dragleave', 'dragend'].forEach((eventName) => {
        el.dropZone.addEventListener(eventName, () => el.dropZone.classList.remove('is-dragover'));
    });
    el.dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        el.dropZone.classList.remove('is-dragover');
        const file = event.dataTransfer?.files?.[0];
        if (file) loadImageFile(file);
    });
    el.dropZone.addEventListener('click', () => el.fileInput.click());
}

/** The scale factor between the image's natural resolution and its current on-screen displayed size. */
function getDisplayScale() {
    return el.previewImage.clientWidth / currentImage.naturalWidth;
}

function startCropping() {
    isCropping = true;
    const spec = state.getSpec();
    const naturalBox = spec.crop ?? {
        x: 0, y: 0, width: currentImage.naturalWidth, height: currentImage.naturalHeight,
    };
    renderCropOverlay(naturalBox);
    el.cropOverlay.hidden = false;
    el.cropButton.hidden = true;
    el.applyCropButton.hidden = false;
    el.cancelCropButton.hidden = false;
}

function stopCropping() {
    isCropping = false;
    el.cropOverlay.hidden = true;
    el.cropButton.hidden = false;
    el.applyCropButton.hidden = true;
    el.cancelCropButton.hidden = true;
}

function renderCropOverlay(naturalBox) {
    const scale = getDisplayScale();
    const displayed = naturalToDisplayed(naturalBox, scale);
    el.cropBox.style.left = `${displayed.x}px`;
    el.cropBox.style.top = `${displayed.y}px`;
    el.cropBox.style.width = `${displayed.width}px`;
    el.cropBox.style.height = `${displayed.height}px`;
    el.cropBox.dataset.naturalBox = JSON.stringify(naturalBox);
}

function wireCropInteraction() {
    el.cropButton.addEventListener('click', startCropping);
    el.cancelCropButton.addEventListener('click', stopCropping);
    el.applyCropButton.addEventListener('click', () => {
        const naturalBox = JSON.parse(el.cropBox.dataset.naturalBox || '{}');
        state.setCrop(naturalBox);
        stopCropping();
    });

    let dragStartPointer = null;
    let dragStartBox = null;

    function onPointerDown(event) {
        if (!isCropping) return;
        const handle = event.target.dataset.handle;
        cropDragMode = handle || (event.target === el.cropBox ? 'move' : null);
        if (!cropDragMode) return;
        dragStartPointer = { x: event.clientX, y: event.clientY };
        dragStartBox = JSON.parse(el.cropBox.dataset.naturalBox || '{}');
        event.preventDefault();
    }

    function onPointerMove(event) {
        if (!cropDragMode || !dragStartPointer) return;
        const scale = getDisplayScale();
        const deltaX = (event.clientX - dragStartPointer.x) / scale;
        const deltaY = (event.clientY - dragStartPointer.y) / scale;

        const nextBox = cropDragMode === 'move'
            ? moveBox(dragStartBox, deltaX, deltaY, currentImage.naturalWidth, currentImage.naturalHeight)
            : resizeBoxFromHandle(dragStartBox, cropDragMode, deltaX, deltaY, currentImage.naturalWidth, currentImage.naturalHeight);

        renderCropOverlay(nextBox);
    }

    function onPointerUp() {
        cropDragMode = null;
        dragStartPointer = null;
        dragStartBox = null;
    }

    el.cropOverlay.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
}

function wireTransforms() {
    el.rotateButton.addEventListener('click', () => state.rotateClockwise());
    el.flipHButton.addEventListener('click', () => state.toggleFlipX());
    el.flipVButton.addEventListener('click', () => state.toggleFlipY());
}

function wireAdjustmentSliders() {
    const bindings = [
        [el.brightness, 'brightness'], [el.contrast, 'contrast'], [el.saturation, 'saturation'],
        [el.grayscale, 'grayscale'], [el.sepia, 'sepia'], [el.invert, 'invert'], [el.blur, 'blur'],
    ];
    for (const [input, key] of bindings) {
        // 'change' (not 'input') commits to undo history only once the
        // user releases the slider, so dragging a slider doesn't flood
        // the bounded undo stack with dozens of intermediate steps --
        // the live preview itself already updates continuously via the
        // 'input' listener below, independent of the committed history.
        input.addEventListener('input', () => {
            el.previewImage.style.filter = buildFilterString({ ...state.getSpec(), [key]: Number(input.value) });
        });
        input.addEventListener('change', () => {
            state.update({ [key]: Number(input.value) });
        });
    }
}

function readWatermarkFromForm() {
    const text = el.watermarkText.value.trim();
    if (!text) return null;
    return {
        text,
        position: el.watermarkPosition.value,
        color: el.watermarkColor.value,
        opacity: Number(el.watermarkOpacity.value) / 100,
        fontSize: Number(el.watermarkSize.value),
    };
}

function wireWatermark() {
    const fields = [el.watermarkText, el.watermarkPosition, el.watermarkColor, el.watermarkOpacity, el.watermarkSize];
    for (const field of fields) {
        field.addEventListener('change', () => {
            state.setWatermark(readWatermarkFromForm());
        });
    }
    el.removeWatermarkButton.addEventListener('click', () => {
        el.watermarkText.value = '';
        state.setWatermark(null);
    });
}

function wireToolbar() {
    el.undoButton.addEventListener('click', () => state.undo());
    el.redoButton.addEventListener('click', () => state.redo());
    el.resetButton.addEventListener('click', () => state.reset());

    el.downloadButton.addEventListener('click', async () => {
        el.downloadButton.disabled = true;
        const originalText = el.downloadButton.textContent;
        el.downloadButton.textContent = t('exporting');
        try {
            const type = el.downloadFormat.value || currentFile.type || 'image/png';
            const { blob } = await renderEditedImage(currentFile, state.getSpec(), { type });
            const url = URL.createObjectURL(blob);
            const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[type] ?? 'png';
            const baseName = currentFile.name.replace(/\.[^.]+$/, '') || 'image';
            const link = document.createElement('a');
            link.href = url;
            link.download = `${baseName}-edited.${extension}`;
            document.body.append(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 4000);
        } finally {
            el.downloadButton.disabled = false;
            el.downloadButton.textContent = originalText;
        }
    });
}

function applyUiLanguage(language) {
    const root = document.documentElement;
    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
    root.dataset.language = language;
    const toggle = document.querySelector('#tool-language-toggle');
    if (toggle) toggle.textContent = language === 'ar' ? 'English' : 'العربية';
    try {
        localStorage.setItem('adawaty-language', language);
    } catch {
        // Language switching remains available without persistence.
    }
}

function wireLanguageToggle() {
    const toggle = document.querySelector('#tool-language-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
        applyUiLanguage(getUiLanguage() === 'ar' ? 'en' : 'ar');
    });

    let initialLanguage = navigator.language.toLowerCase().startsWith('ar') ? 'ar' : 'en';
    try {
        initialLanguage = localStorage.getItem('adawaty-language') ?? initialLanguage;
    } catch {
        // Browser language remains the fallback.
    }
    applyUiLanguage(initialLanguage === 'en' ? 'en' : 'ar');
}

function init() {
    wireLanguageToggle();

    const currentYear = document.querySelector('#current-year');
    if (currentYear) currentYear.textContent = String(new Date().getFullYear());

    wireUpload();
    wireCropInteraction();
    wireTransforms();
    wireAdjustmentSliders();
    wireWatermark();
    wireToolbar();
}

init();

// END OF FILE
