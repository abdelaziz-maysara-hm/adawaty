import './site-navigation.js?v=s7b36';
import {
    assertPdfFile,
    createPdfBlob,
    loadPdfJs,
    loadPdfLib,
    outputName,
} from './pdf-processing.js';

const copy = Object.freeze({
    ar: Object.freeze({
        allTools: '\u0643\u0644 \u0627\u0644\u0623\u062f\u0648\u0627\u062a', quickEditor: '\u0627\u0644\u0645\u062d\u0631\u0631 \u0627\u0644\u0633\u0631\u064a\u0639',
        privacy: '\u062e\u0635\u0648\u0635\u064a\u0629 \u0643\u0627\u0645\u0644\u0629: \u0645\u0644\u0641\u0643 \u0644\u0627 \u064a\u063a\u0627\u062f\u0631 \u0645\u062a\u0635\u0641\u062d\u0643', title: '\u0645\u062d\u0631\u0631 PDF \u0627\u0644\u0645\u0631\u0626\u064a',
        description: '\u0627\u0641\u062a\u062d PDF\u060c \u0648\u0627\u0636\u063a\u0637 \u0641\u064a \u0623\u064a \u0645\u0643\u0627\u0646 \u0644\u0625\u0636\u0627\u0641\u0629 \u0646\u0635\u060c \u062b\u0645 \u0627\u0633\u062d\u0628\u0647 \u0648\u0646\u0633\u0651\u0642\u0647 \u0648\u062d\u0645\u0651\u0644 \u0646\u0633\u062e\u0629 \u062c\u062f\u064a\u062f\u0629.',
        choosePdf: '\u0627\u062e\u062a\u0631 \u0645\u0644\u0641 PDF', dropHint: '\u062a\u062a\u0645 \u0627\u0644\u0645\u0639\u0627\u0644\u062c\u0629 \u0645\u062d\u0644\u064a\u064b\u0627 \u0648\u0644\u0627 \u064a\u064f\u0631\u0641\u0639 \u0627\u0644\u0645\u0644\u0641.',
        page: '\u0627\u0644\u0635\u0641\u062d\u0629', howTitle: '\u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u062a\u0639\u062f\u064a\u0644', howOne: '\u0627\u062e\u062a\u0631 \u00ab\u0625\u0636\u0627\u0641\u0629 \u0646\u0635\u00bb \u062b\u0645 \u0627\u0636\u063a\u0637 \u0639\u0644\u0649 \u0627\u0644\u0635\u0641\u062d\u0629.',
        howTwo: '\u0627\u0643\u062a\u0628 \u0645\u0628\u0627\u0634\u0631\u0629 \u0648\u0627\u0633\u062d\u0628 \u0627\u0644\u0645\u0642\u0628\u0636 \u0644\u0646\u0642\u0644 \u0627\u0644\u0646\u0635.', howThree: '\u0641\u0639\u0651\u0644 \u00ab\u062a\u063a\u0637\u064a\u0629 \u0627\u0644\u0623\u0635\u0644\u00bb \u0639\u0646\u062f \u0627\u0633\u062a\u0628\u062f\u0627\u0644 \u0646\u0635 \u0645\u0648\u062c\u0648\u062f.',
        anotherFile: '\u0641\u062a\u062d \u0645\u0644\u0641 \u0622\u062e\u0631', addText: '+ \u0625\u0636\u0627\u0641\u0629 \u0646\u0635', size: '\u0627\u0644\u062d\u062c\u0645', color: '\u0627\u0644\u0644\u0648\u0646',
        cover: '\u062a\u063a\u0637\u064a\u0629 \u0627\u0644\u0623\u0635\u0644', opacity: '\u0627\u0644\u0634\u0641\u0627\u0641\u064a\u0629', delete: '\u062d\u0630\u0641', rendering: '\u062c\u0627\u0631\u064a \u0639\u0631\u0636 \u0627\u0644\u0635\u0641\u062d\u0629...',
        saveNote: '\u0633\u064a\u064f\u0646\u0634\u0623 \u0645\u0644\u0641 PDF \u062c\u062f\u064a\u062f\u060c \u0648\u0633\u064a\u0638\u0644 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0623\u0635\u0644\u064a \u0628\u0644\u0627 \u062a\u063a\u064a\u064a\u0631.', save: '\u062d\u0641\u0638 \u0648\u062a\u0646\u0632\u064a\u0644 PDF',
        pages: '\u0635\u0641\u062d\u0629', loading: '\u062c\u0627\u0631\u064a \u0641\u062a\u062d \u0627\u0644\u0645\u0644\u0641...', ready: '\u0627\u0644\u0645\u0644\u0641 \u062c\u0627\u0647\u0632 \u0644\u0644\u062a\u0639\u062f\u064a\u0644.',
        saving: '\u062c\u0627\u0631\u064a \u0625\u0646\u0634\u0627\u0621 \u0645\u0644\u0641 PDF...', saved: '\u062a\u0645 \u062a\u0646\u0632\u064a\u0644 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0645\u0639\u062f\u0651\u0644.', typeHere: '\u0627\u0643\u062a\u0628 \u0647\u0646\u0627',
        noEdits: '\u0623\u0636\u0641 \u0646\u0635\u064b\u0627 \u0648\u0627\u062d\u062f\u064b\u0627 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 \u0642\u0628\u0644 \u0627\u0644\u062d\u0641\u0638.', invalidPdf: '\u062a\u0639\u0630\u0651\u0631 \u0641\u062a\u062d \u0645\u0644\u0641 PDF. \u062a\u0623\u0643\u062f \u0645\u0646 \u0623\u0646\u0647 \u0645\u0644\u0641 \u0635\u062d\u064a\u062d.',
    }),
    en: Object.freeze({
        allTools: 'All tools', quickEditor: 'Quick editor', privacy: 'Private: files never leave your browser', title: 'Visual PDF Editor',
        description: 'Open a PDF, click anywhere to add text, drag it into place, and save a new copy.', choosePdf: 'Choose a PDF file', dropHint: 'Your document is processed locally and is never uploaded.',
        page: 'Page', howTitle: 'How to edit', howOne: 'Select Add text, then click the page.', howTwo: 'Type directly and drag the handle to move.', howThree: 'Use Cover original when replacing existing text.',
        anotherFile: 'Open another file', addText: '+ Add text', size: 'Size', color: 'Color', cover: 'Cover original', opacity: 'Opacity', delete: 'Delete', rendering: 'Rendering page...',
        saveNote: 'A new PDF is created; your original file stays unchanged.', save: 'Save and download PDF', pages: 'pages', loading: 'Opening document...', ready: 'Document is ready to edit.', saving: 'Creating your PDF...', saved: 'The edited PDF was downloaded.', typeHere: 'Type here', noEdits: 'Add at least one text box before saving.', invalidPdf: 'Unable to open this PDF. Make sure it is a valid document.',
    }),
});

const elements = Object.freeze({
    file: document.querySelector('#pdf-file'), picker: document.querySelector('#pdf-picker'), upload: document.querySelector('#editor-upload'), status: document.querySelector('#editor-status'),
    workspace: document.querySelector('#editor-workspace'), name: document.querySelector('#document-name'), details: document.querySelector('#document-details'), pageNumber: document.querySelector('#page-number'),
    pageCount: document.querySelector('#page-count'), previous: document.querySelector('#previous-page'), next: document.querySelector('#next-page'), canvas: document.querySelector('#pdf-canvas'), page: document.querySelector('#pdf-page'),
    layer: document.querySelector('#overlay-layer'), loading: document.querySelector('#page-loading'), addText: document.querySelector('#add-text'), size: document.querySelector('#text-size'), color: document.querySelector('#text-color'),
    bold: document.querySelector('#text-bold'), cover: document.querySelector('#cover-original'), opacity: document.querySelector('#text-opacity'), remove: document.querySelector('#delete-overlay'), save: document.querySelector('#save-pdf'),
    newFile: document.querySelector('#new-file'), language: document.querySelector('#editor-language-toggle'), year: document.querySelector('#current-year'), shell: document.querySelector('#canvas-shell'),
});

const state = {
    file: null, bytes: null, pdf: null, page: 1, overlays: new Map(), selectedId: null, adding: false, renderToken: 0,
    language: localStorage.getItem('adawaty-language') === 'en' ? 'en' : 'ar',
};

function t(key) { return copy[state.language][key]; }
function clamp(value, minimum, maximum) { return Math.min(Math.max(value, minimum), maximum); }
function pageOverlays(page = state.page) { if (!state.overlays.has(page)) state.overlays.set(page, []); return state.overlays.get(page); }
function selectedOverlay() { return pageOverlays().find((overlay) => overlay.id === state.selectedId) ?? null; }
function formatBytes(bytes) { if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }

function applyLanguage() {
    document.documentElement.lang = state.language;
    document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('adawaty-language', state.language);
    document.querySelectorAll('[data-i18n]').forEach((element) => { element.textContent = t(element.dataset.i18n); });
    elements.language.textContent = state.language === 'ar' ? 'English' : '\u0627\u0644\u0639\u0631\u0628\u064a\u0629';
    if (state.pdf) { elements.details.textContent = `${state.pdf.numPages} ${t('pages')} · ${formatBytes(state.file.size)}`; elements.status.textContent = t('ready'); renderOverlays(); }
}

async function openPdf(file) {
    try {
        assertPdfFile(file);
        elements.status.textContent = t('loading');
        const bytes = await file.arrayBuffer();
        const pdfjs = await loadPdfJs();
        const pdf = await pdfjs.getDocument({ data: bytes.slice(0) }).promise;
        state.file = file; state.bytes = bytes; state.pdf = pdf; state.page = 1; state.overlays.clear(); state.selectedId = null;
        elements.name.textContent = file.name; elements.details.textContent = `${pdf.numPages} ${t('pages')} · ${formatBytes(file.size)}`;
        elements.pageNumber.max = String(pdf.numPages); elements.pageNumber.value = '1'; elements.pageCount.textContent = `/ ${pdf.numPages}`;
        elements.upload.hidden = true; elements.workspace.hidden = false; elements.status.textContent = t('ready');
        await renderPage();
    } catch (error) {
        elements.status.textContent = error?.message?.includes('valid PDF') ? error.message : t('invalidPdf');
    }
}

async function renderPage() {
    if (!state.pdf) return;
    const token = ++state.renderToken;
    elements.loading.hidden = false;
    const page = await state.pdf.getPage(state.page);
    const unscaled = page.getViewport({ scale: 1 });
    const maxWidth = Math.max(Math.min(elements.shell.clientWidth - 48, 960), 280);
    const scale = Math.min(maxWidth / unscaled.width, 1.65);
    const viewport = page.getViewport({ scale });
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const context = elements.canvas.getContext('2d', { alpha: false });
    elements.canvas.width = Math.ceil(viewport.width * ratio); elements.canvas.height = Math.ceil(viewport.height * ratio);
    elements.canvas.style.width = `${viewport.width}px`; elements.canvas.style.height = `${viewport.height}px`;
    elements.page.style.width = `${viewport.width}px`; elements.page.style.height = `${viewport.height}px`;
    await page.render({ canvasContext: context, viewport, transform: ratio === 1 ? null : [ratio, 0, 0, ratio, 0, 0] }).promise;
    if (token !== state.renderToken) return;
    elements.pageNumber.value = String(state.page); elements.previous.disabled = state.page <= 1; elements.next.disabled = state.page >= state.pdf.numPages;
    elements.loading.hidden = true; renderOverlays();
}

function selectOverlay(id) {
    state.selectedId = id;
    const overlay = selectedOverlay();
    elements.remove.disabled = !overlay;
    if (overlay) {
        elements.size.value = String(Math.round(overlay.fontScale * elements.layer.clientHeight)); elements.color.value = overlay.color;
        elements.opacity.value = String(Math.round(overlay.opacity * 100)); elements.bold.setAttribute('aria-pressed', String(overlay.bold)); elements.cover.setAttribute('aria-pressed', String(overlay.cover));
    }
    renderOverlays();
}

function syncOverlayText(id, text) { const overlay = pageOverlays().find((item) => item.id === id); if (overlay) overlay.text = text; }

function beginPointerEdit(event, overlay, mode) {
    event.preventDefault(); event.stopPropagation(); selectOverlay(overlay.id);
    const bounds = elements.layer.getBoundingClientRect(); const startX = event.clientX; const startY = event.clientY;
    const original = { x: overlay.x, y: overlay.y, width: overlay.width, height: overlay.height };
    const move = (moveEvent) => {
        const dx = (moveEvent.clientX - startX) / bounds.width; const dy = (moveEvent.clientY - startY) / bounds.height;
        if (mode === 'move') { overlay.x = clamp(original.x + dx, 0, 1 - overlay.width); overlay.y = clamp(original.y + dy, 0, 1 - overlay.height); }
        else { overlay.width = clamp(original.width + dx, .08, 1 - overlay.x); overlay.height = clamp(original.height + dy, .035, 1 - overlay.y); }
        renderOverlays(false);
    };
    const end = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', end, { once: true });
}

function renderOverlays(refocus = false) {
    elements.layer.innerHTML = '';
    for (const overlay of pageOverlays()) {
        const node = document.createElement('div'); node.className = `text-overlay${overlay.id === state.selectedId ? ' is-selected' : ''}${overlay.cover ? ' is-covering' : ''}`;
        node.dataset.overlayId = overlay.id; node.style.left = `${overlay.x * 100}%`; node.style.top = `${overlay.y * 100}%`; node.style.width = `${overlay.width * 100}%`; node.style.height = `${overlay.height * 100}%`;
        node.style.color = overlay.color; node.style.fontSize = `${Math.max(overlay.fontScale * elements.layer.clientHeight, 8)}px`; node.style.fontWeight = overlay.bold ? '700' : '400'; node.style.opacity = String(overlay.opacity);
        const content = document.createElement('span'); content.className = 'text-overlay-content'; content.contentEditable = 'true'; content.spellcheck = true; content.textContent = overlay.text;
        content.addEventListener('input', () => syncOverlayText(overlay.id, content.innerText)); content.addEventListener('focus', () => { if (state.selectedId !== overlay.id) selectOverlay(overlay.id); }); content.addEventListener('pointerdown', (event) => event.stopPropagation());
        const handle = document.createElement('button'); handle.type = 'button'; handle.className = 'text-overlay-handle'; handle.textContent = '···'; handle.setAttribute('aria-label', 'Move text'); handle.addEventListener('pointerdown', (event) => beginPointerEdit(event, overlay, 'move'));
        const resize = document.createElement('button'); resize.type = 'button'; resize.className = 'text-overlay-resize'; resize.setAttribute('aria-label', 'Resize text'); resize.addEventListener('pointerdown', (event) => beginPointerEdit(event, overlay, 'resize'));
        node.append(handle, content, resize); node.addEventListener('pointerdown', () => selectOverlay(overlay.id)); elements.layer.append(node);
        if (refocus && overlay.id === state.selectedId) requestAnimationFrame(() => { content.focus(); const range = document.createRange(); range.selectNodeContents(content); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); });
    }
}

function addOverlay(event) {
    if (!state.adding || event.target !== elements.layer) return;
    const bounds = elements.layer.getBoundingClientRect();
    const overlay = { id: crypto.randomUUID(), text: t('typeHere'), x: clamp((event.clientX - bounds.left) / bounds.width, 0, .64), y: clamp((event.clientY - bounds.top) / bounds.height, 0, .9), width: .34, height: .07, fontScale: Number(elements.size.value) / bounds.height, color: elements.color.value, bold: elements.bold.getAttribute('aria-pressed') === 'true', cover: elements.cover.getAttribute('aria-pressed') === 'true', opacity: Number(elements.opacity.value) / 100 };
    pageOverlays().push(overlay); state.adding = false; elements.layer.classList.remove('is-adding'); elements.addText.classList.remove('is-active'); state.selectedId = overlay.id; elements.remove.disabled = false; renderOverlays(true);
}

function updateSelected(property, value) { const overlay = selectedOverlay(); if (!overlay) return; overlay[property] = value; renderOverlays(); }

function wrapText(context, text, maxWidth) {
    const result = [];
    for (const paragraph of String(text).split(/\n/u)) {
        const words = paragraph.split(/\s+/u); let line = '';
        for (const word of words) { const candidate = line ? `${line} ${word}` : word; if (line && context.measureText(candidate).width > maxWidth) { result.push(line); line = word; } else line = candidate; }
        result.push(line);
    }
    return result;
}

async function overlayPng(overlay, pageWidth, pageHeight) {
    const pixelRatio = 2; const width = Math.max(Math.round(overlay.width * pageWidth * pixelRatio), 4); const height = Math.max(Math.round(overlay.height * pageHeight * pixelRatio), 4);
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const context = canvas.getContext('2d');
    if (overlay.cover) { context.fillStyle = '#ffffff'; context.fillRect(0, 0, width, height); }
    const fontSize = Math.max(overlay.fontScale * pageHeight * pixelRatio, 12); context.font = `${overlay.bold ? '700' : '400'} ${fontSize}px Arial, sans-serif`; context.fillStyle = overlay.color; context.textBaseline = 'top';
    const isArabic = /[\u0600-\u06ff]/u.test(overlay.text); context.direction = isArabic ? 'rtl' : 'ltr'; context.textAlign = isArabic ? 'right' : 'left';
    const padding = Math.max(fontSize * .12, 4); const lines = wrapText(context, overlay.text, width - (padding * 2)); const x = isArabic ? width - padding : padding;
    lines.forEach((line, index) => context.fillText(line, x, padding + (index * fontSize * 1.25)));
    const blob = await new Promise((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Unable to render text.')), 'image/png'));
    return new Uint8Array(await blob.arrayBuffer());
}

async function savePdf() {
    const edits = [...state.overlays.values()].flat().filter((overlay) => overlay.text.trim());
    if (!edits.length) { elements.status.textContent = t('noEdits'); return; }
    elements.save.disabled = true; elements.save.textContent = t('saving');
    try {
        const pdfLib = await loadPdfLib(); const pdfDocument = await pdfLib.PDFDocument.load(state.bytes.slice(0));
        for (const [pageNumber, overlays] of state.overlays.entries()) {
            const page = pdfDocument.getPage(pageNumber - 1); const { width, height } = page.getSize();
            for (const overlay of overlays.filter((item) => item.text.trim())) {
                const image = await pdfDocument.embedPng(await overlayPng(overlay, width, height));
                page.drawImage(image, { x: overlay.x * width, y: height - ((overlay.y + overlay.height) * height), width: overlay.width * width, height: overlay.height * height, opacity: overlay.opacity });
            }
        }
        const blob = createPdfBlob(await pdfDocument.save()); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = outputName(state.file, 'visual-edited'); document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); elements.status.textContent = t('saved');
    } catch (error) { elements.status.textContent = error?.message ?? t('invalidPdf'); }
    finally { elements.save.disabled = false; elements.save.textContent = t('save'); }
}

function changePage(page) { if (!state.pdf) return; state.page = clamp(Number(page) || 1, 1, state.pdf.numPages); state.selectedId = null; elements.remove.disabled = true; renderPage(); }

elements.picker.addEventListener('click', () => elements.file.click()); elements.file.addEventListener('change', () => elements.file.files[0] && openPdf(elements.file.files[0]));
for (const eventName of ['dragenter', 'dragover']) elements.picker.addEventListener(eventName, (event) => { event.preventDefault(); elements.picker.classList.add('is-dragging'); });
for (const eventName of ['dragleave', 'drop']) elements.picker.addEventListener(eventName, (event) => { event.preventDefault(); elements.picker.classList.remove('is-dragging'); });
elements.picker.addEventListener('drop', (event) => event.dataTransfer.files[0] && openPdf(event.dataTransfer.files[0]));
elements.previous.addEventListener('click', () => changePage(state.page - 1)); elements.next.addEventListener('click', () => changePage(state.page + 1)); elements.pageNumber.addEventListener('change', () => changePage(elements.pageNumber.value));
elements.addText.addEventListener('click', () => { state.adding = !state.adding; elements.layer.classList.toggle('is-adding', state.adding); elements.addText.classList.toggle('is-active', state.adding); }); elements.layer.addEventListener('click', addOverlay);
elements.size.addEventListener('input', () => updateSelected('fontScale', Number(elements.size.value) / elements.layer.clientHeight)); elements.color.addEventListener('input', () => updateSelected('color', elements.color.value)); elements.opacity.addEventListener('input', () => updateSelected('opacity', Number(elements.opacity.value) / 100));
for (const [button, property] of [[elements.bold, 'bold'], [elements.cover, 'cover']]) button.addEventListener('click', () => { const pressed = button.getAttribute('aria-pressed') !== 'true'; button.setAttribute('aria-pressed', String(pressed)); updateSelected(property, pressed); });
elements.remove.addEventListener('click', () => { const overlays = pageOverlays(); const index = overlays.findIndex((item) => item.id === state.selectedId); if (index >= 0) overlays.splice(index, 1); state.selectedId = null; elements.remove.disabled = true; renderOverlays(); });
elements.save.addEventListener('click', savePdf); elements.newFile.addEventListener('click', () => { elements.file.value = ''; elements.workspace.hidden = true; elements.upload.hidden = false; elements.status.textContent = ''; state.pdf = null; state.bytes = null; state.overlays.clear(); });
elements.language.addEventListener('click', () => { state.language = state.language === 'ar' ? 'en' : 'ar'; applyLanguage(); });
window.addEventListener('resize', () => { if (state.pdf) renderPage(); }); elements.year.textContent = new Date().getFullYear(); applyLanguage();

// END OF FILE
