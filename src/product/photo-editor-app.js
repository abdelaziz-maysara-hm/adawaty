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
        layers: 'الطبقات', layer: 'طبقة', addLayer: 'إضافة طبقة', toggleVisibility: 'إظهار/إخفاء',
        moveUp: 'تحريك لأعلى', moveDown: 'تحريك لأسفل', deleteLayer: 'حذف الطبقة', closeLayerEditor: 'إغلاق',
        layerOpacity: 'شفافية الطبقة',
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
        layers: 'Layers', layer: 'Layer', addLayer: 'Add Layer', toggleVisibility: 'Show/Hide',
        moveUp: 'Move up', moveDown: 'Move down', deleteLayer: 'Delete Layer', closeLayerEditor: 'Close',
        layerOpacity: 'Layer opacity',
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
    watermarkPreview: document.querySelector('#editor-watermark-preview'),
    cropButton: document.querySelector('#editor-crop-button'),
    addLayerButton: document.querySelector('#editor-add-layer'),
    layerList: document.querySelector('#editor-layer-list'),
    layerEditor: document.querySelector('#editor-layer-editor'),
    layerEditorTitle: document.querySelector('#editor-layer-editor-title'),
    layerBrightness: document.querySelector('#editor-layer-brightness'),
    layerContrast: document.querySelector('#editor-layer-contrast'),
    layerSaturation: document.querySelector('#editor-layer-saturation'),
    layerGrayscale: document.querySelector('#editor-layer-grayscale'),
    layerSepia: document.querySelector('#editor-layer-sepia'),
    layerInvert: document.querySelector('#editor-layer-invert'),
    layerBlur: document.querySelector('#editor-layer-blur'),
    layerOpacity: document.querySelector('#editor-layer-opacity'),
    layerDeleteButton: document.querySelector('#editor-layer-delete'),
    layerCloseButton: document.querySelector('#editor-layer-close'),
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
let cropDragMode = null; // null | 'move' | a handle string like 'se'
let selectedLayerId = null; // which layer's adjustment sliders are currently shown in the shared layer-editor panel

function setStatus(message) {
    if (el.statusMessage) el.statusMessage.textContent = message;
}

let compositePreviewUrl = '';
let compositeRenderToken = 0;

/**
 * Live preview via CSS filter/transform on the <img> itself when there
 * are no layers -- instant, no re-encoding, matching how the Website
 * Builder's preview stays lightweight. Once a layer exists, a CSS
 * filter on the whole image can no longer represent a region-specific
 * effect, so the preview switches to actually running the composite
 * renderer (engine.js's renderEditedImage()) and swapping the <img>
 * src -- slightly slower, but the only way to show a real region-
 * restricted result short of reimplementing the compositor twice.
 */
function updateLivePreview() {
    const spec = state.getSpec();

    if (spec.layers.length === 0) {
        updateWatermarkPreview(spec.watermark);
        el.previewImage.style.filter = buildFilterString(spec);
        const flipXScale = spec.flipX ? -1 : 1;
        const flipYScale = spec.flipY ? -1 : 1;
        el.previewImage.style.transform = `rotate(${spec.rotation}deg) scale(${flipXScale}, ${flipYScale})`;
        return;
    }

    // The composite render below already bakes the real watermark into
    // the image, so the approximate DOM overlay must be hidden here --
    // otherwise the watermark would visibly appear twice.
    updateWatermarkPreview(null);
    el.previewImage.style.filter = 'none';
    el.previewImage.style.transform = 'none';
    updateCompositePreview(spec);
}

async function updateCompositePreview(spec) {
    const token = (compositeRenderToken += 1);
    try {
        const { blob } = await renderEditedImage(currentFile, spec, { type: 'image/png' });
        if (token !== compositeRenderToken) return; // a newer render started meanwhile; discard this one
        if (compositePreviewUrl) URL.revokeObjectURL(compositePreviewUrl);
        compositePreviewUrl = URL.createObjectURL(blob);
        el.previewImage.src = compositePreviewUrl;
    } catch (error) {
        console.error('Photo Editor composite preview failed:', error);
    }
}

/**
 * Renders a live HTML overlay approximating the watermark before any
 * download -- a real gap found via user testing: the watermark
 * previously had no visible effect at all until the file was actually
 * downloaded, since only the final export ran the real Canvas
 * renderImage() pipeline that draws it. This overlay is a preview only
 * (plain positioned text, not pixel-identical to the Canvas-rendered
 * result -- font rendering can differ slightly between a CSS/DOM text
 * node and Canvas fillText()), but it makes the Position/Color/Opacity/
 * Font size controls immediately visible instead of feeling like they
 * do nothing.
 */
function updateWatermarkPreview(watermark) {
    if (!watermark) {
        el.watermarkPreview.hidden = true;
        return;
    }
    const scale = currentImage ? getDisplayScale() : 1;
    el.watermarkPreview.hidden = false;
    el.watermarkPreview.textContent = watermark.text;
    el.watermarkPreview.dataset.position = watermark.position;
    el.watermarkPreview.style.color = watermark.color;
    el.watermarkPreview.style.opacity = String(watermark.opacity);
    el.watermarkPreview.style.fontSize = `${Math.max(8, watermark.fontSize * scale)}px`;
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

    renderLayerList();
}

/** Renders the layer list: one row per layer with a visibility toggle, a click-to-edit name/summary, reorder buttons, and a delete button. */
function renderLayerList() {
    const spec = state.getSpec();
    el.layerList.replaceChildren(
        ...spec.layers.map((layer, index) => {
            const item = document.createElement('li');
            item.className = 'editor-layer-item';
            if (layer.id === selectedLayerId) item.classList.add('is-selected');

            const visibilityButton = document.createElement('button');
            visibilityButton.type = 'button';
            visibilityButton.className = 'icon-button button-quiet';
            visibilityButton.textContent = layer.visible ? '👁' : '—';
            visibilityButton.setAttribute('aria-label', t('toggleVisibility'));
            visibilityButton.addEventListener('click', () => state.toggleLayerVisibility(layer.id));
            item.append(visibilityButton);

            const label = document.createElement('button');
            label.type = 'button';
            label.className = 'editor-layer-label';
            label.textContent = layer.name || `${t('layer')} ${index + 1}`;
            label.addEventListener('click', () => openLayerEditor(layer.id));
            item.append(label);

            const upButton = document.createElement('button');
            upButton.type = 'button';
            upButton.className = 'icon-button button-quiet';
            upButton.textContent = '↑';
            upButton.setAttribute('aria-label', t('moveUp'));
            upButton.disabled = index === spec.layers.length - 1; // last in array = topmost = nothing above it
            upButton.addEventListener('click', () => state.moveLayer(layer.id, 'up'));
            item.append(upButton);

            const downButton = document.createElement('button');
            downButton.type = 'button';
            downButton.className = 'icon-button button-quiet';
            downButton.textContent = '↓';
            downButton.setAttribute('aria-label', t('moveDown'));
            downButton.disabled = index === 0;
            downButton.addEventListener('click', () => state.moveLayer(layer.id, 'down'));
            item.append(downButton);

            return item;
        }),
    );

    // If the currently-open layer editor's layer no longer exists (e.g.
    // deleted via undo/redo landing on a state without it), close it
    // rather than leaving it open on stale data.
    if (selectedLayerId && !spec.layers.some((layer) => layer.id === selectedLayerId)) {
        closeLayerEditor();
    } else if (selectedLayerId) {
        syncLayerEditorFromState();
    }
}

function openLayerEditor(layerId) {
    selectedLayerId = layerId;
    el.layerEditor.hidden = false;
    syncLayerEditorFromState();
    renderLayerList();
}

function closeLayerEditor() {
    selectedLayerId = null;
    el.layerEditor.hidden = true;
}

function getSelectedLayer() {
    return state.getSpec().layers.find((layer) => layer.id === selectedLayerId) ?? null;
}

function syncLayerEditorFromState() {
    const layer = getSelectedLayer();
    if (!layer) return;
    el.layerEditorTitle.textContent = layer.name || t('layer');
    el.layerBrightness.value = layer.brightness;
    el.layerContrast.value = layer.contrast;
    el.layerSaturation.value = layer.saturation;
    el.layerGrayscale.value = layer.grayscale;
    el.layerSepia.value = layer.sepia;
    el.layerInvert.value = layer.invert;
    el.layerBlur.value = layer.blur;
    el.layerOpacity.value = Math.round(layer.opacity * 100);
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

/**
 * The same draggable/resizable region overlay serves two purposes:
 * cropping the whole image, and selecting a region for a new layer.
 * `selectionMode` distinguishes them (null | 'crop' | 'layer') so the
 * exact same drag/resize interaction and coordinate math (crop-math.js)
 * is reused rather than duplicated for layers.
 */
let selectionMode = null;

function startRegionSelection(mode) {
    selectionMode = mode;
    const naturalBox = mode === 'crop'
        ? (state.getSpec().crop ?? {
            x: 0, y: 0, width: currentImage.naturalWidth, height: currentImage.naturalHeight,
        })
        : {
            x: Math.round(currentImage.naturalWidth * 0.25),
            y: Math.round(currentImage.naturalHeight * 0.25),
            width: Math.round(currentImage.naturalWidth * 0.5),
            height: Math.round(currentImage.naturalHeight * 0.5),
        };
    renderRegionOverlay(naturalBox);
    el.cropOverlay.hidden = false;
    el.cropButton.hidden = true;
    el.addLayerButton.hidden = true;
    el.applyCropButton.hidden = false;
    el.applyCropButton.textContent = mode === 'crop' ? t('applyCrop') : t('addLayer');
    el.cancelCropButton.hidden = false;
}

function stopRegionSelection() {
    selectionMode = null;
    el.cropOverlay.hidden = true;
    el.cropButton.hidden = false;
    el.addLayerButton.hidden = false;
    el.applyCropButton.hidden = true;
    el.cancelCropButton.hidden = true;
}

function renderRegionOverlay(naturalBox) {
    const scale = getDisplayScale();
    const displayed = naturalToDisplayed(naturalBox, scale);
    el.cropBox.style.left = `${displayed.x}px`;
    el.cropBox.style.top = `${displayed.y}px`;
    el.cropBox.style.width = `${displayed.width}px`;
    el.cropBox.style.height = `${displayed.height}px`;
    el.cropBox.dataset.naturalBox = JSON.stringify(naturalBox);
}

function wireCropInteraction() {
    el.cropButton.addEventListener('click', () => startRegionSelection('crop'));
    el.addLayerButton.addEventListener('click', () => startRegionSelection('layer'));
    el.cancelCropButton.addEventListener('click', stopRegionSelection);
    el.applyCropButton.addEventListener('click', () => {
        const naturalBox = JSON.parse(el.cropBox.dataset.naturalBox || '{}');
        if (selectionMode === 'crop') {
            state.setCrop(naturalBox);
        } else if (selectionMode === 'layer') {
            const newLayerId = state.addLayer(naturalBox);
            selectedLayerId = newLayerId;
        }
        stopRegionSelection();
    });

    let dragStartPointer = null;
    let dragStartBox = null;

    function onPointerDown(event) {
        if (!selectionMode) return;
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

        renderRegionOverlay(nextBox);
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
        // 'input' gives instant preview feedback while typing/dragging/
        // picking a color, without flooding the undo history; 'change'
        // commits once the user settles on a value -- the same two-tier
        // pattern already used for the adjustment sliders.
        field.addEventListener('input', () => {
            updateWatermarkPreview(readWatermarkFromForm());
        });
        field.addEventListener('change', () => {
            state.setWatermark(readWatermarkFromForm());
        });
    }
    el.removeWatermarkButton.addEventListener('click', () => {
        el.watermarkText.value = '';
        state.setWatermark(null);
    });
}

/**
 * Wires the shared layer-editor panel's sliders. Unlike the global
 * adjustment sliders (which get an instant CSS-filter preview on every
 * 'input' tick), a layer's effect is region-restricted and can only be
 * shown accurately by actually running the composite renderer -- doing
 * that on every slider-drag tick would be far too slow. So layer
 * sliders only commit (and therefore only re-render the composite
 * preview) on 'change', once the user releases the slider -- a
 * disclosed, reasonable simplification rather than false instant
 * feedback.
 */
function wireLayerPanel() {
    const bindings = [
        [el.layerBrightness, 'brightness'], [el.layerContrast, 'contrast'], [el.layerSaturation, 'saturation'],
        [el.layerGrayscale, 'grayscale'], [el.layerSepia, 'sepia'], [el.layerInvert, 'invert'], [el.layerBlur, 'blur'],
    ];
    for (const [input, key] of bindings) {
        input.addEventListener('change', () => {
            if (!selectedLayerId) return;
            state.updateLayer(selectedLayerId, { [key]: Number(input.value) });
        });
    }
    el.layerOpacity.addEventListener('change', () => {
        if (!selectedLayerId) return;
        state.updateLayer(selectedLayerId, { opacity: Number(el.layerOpacity.value) / 100 });
    });
    el.layerDeleteButton.addEventListener('click', () => {
        if (!selectedLayerId) return;
        state.removeLayer(selectedLayerId);
        closeLayerEditor();
    });
    el.layerCloseButton.addEventListener('click', closeLayerEditor);
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
    wireLayerPanel();
    wireToolbar();
}

init();

// END OF FILE
