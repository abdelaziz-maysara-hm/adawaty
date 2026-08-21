import './site-navigation.js?v=br2';
import { removeBackground } from './background-remover/engine.js?v=br4';

const copy = Object.freeze({
    ar: Object.freeze({
        chooseFile: 'اختر صورة', dropHint: 'أو اسحب صورة وأفلتها هنا',
        processing: 'جارٍ إزالة الخلفية...', downloadModel: 'جارٍ تحميل نموذج الذكاء الاصطناعي (مرة واحدة فقط)...',
        download: 'تحميل الصورة', tryAnother: 'جرّب صورة أخرى',
        before: 'قبل', after: 'بعد',
        invalidFile: 'اختر ملف صورة صالح.', processingFailed: 'تعذّرت إزالة الخلفية. جرّب صورة أخرى أو تصفّح بمتصفح مختلف.',
        notSupported: 'متصفحك لا يدعم هذه الأداة. جرّب متصفحًا حديثًا مثل Chrome أو Edge أو Firefox.',
    }),
    en: Object.freeze({
        chooseFile: 'Choose an image', dropHint: 'or drag and drop an image here',
        processing: 'Removing background...', downloadModel: 'Downloading AI model (one-time only)...',
        download: 'Download image', tryAnother: 'Try another image',
        before: 'Before', after: 'After',
        invalidFile: 'Please choose a valid image file.', processingFailed: 'Could not remove the background. Try a different image or browser.',
        notSupported: 'Your browser does not support this tool. Try a modern browser like Chrome, Edge, or Firefox.',
    }),
});

function getUiLanguage() {
    return document.documentElement.dataset.language === 'en' ? 'en' : 'ar';
}

function t(key) {
    return copy[getUiLanguage()][key] ?? key;
}

const el = Object.freeze({
    uploadScreen: document.querySelector('#bgr-upload'),
    dropZone: document.querySelector('#bgr-drop-zone'),
    fileInput: document.querySelector('#bgr-file-input'),
    modelInputs: document.querySelectorAll('input[name="bgr-model"]'),
    processingScreen: document.querySelector('#bgr-processing'),
    processingMessage: document.querySelector('#bgr-processing-message'),
    progressFill: document.querySelector('#bgr-progress-fill'),
    resultScreen: document.querySelector('#bgr-result'),
    beforeImage: document.querySelector('#bgr-before-image'),
    afterImage: document.querySelector('#bgr-after-image'),
    downloadButton: document.querySelector('#bgr-download'),
    tryAnotherButton: document.querySelector('#bgr-try-another'),
    statusMessage: document.querySelector('#bgr-status'),
});

function getSelectedModelMode() {
    for (const input of el.modelInputs) {
        if (input.checked) return input.value;
    }
    return 'general';
}

let resultBlob = null;
let resultUrl = '';
let sourceFileName = 'image';

function showScreen(name) {
    el.uploadScreen.hidden = name !== 'upload';
    el.processingScreen.hidden = name !== 'processing';
    el.resultScreen.hidden = name !== 'result';
}

function setStatus(message) {
    el.statusMessage.textContent = message;
}

function updateProgress(info) {
    const fraction = Math.max(0, Math.min(100, info.progress ?? 0));
    el.progressFill.style.width = `${fraction}%`;
    el.processingMessage.textContent = info.step === 'downloading' ? t('downloadModel') : t('processing');
}

async function processFile(file) {
    if (!(file instanceof File) || !file.type.startsWith('image/')) {
        window.alert(t('invalidFile'));
        return;
    }
    if (!window.WebAssembly) {
        window.alert(t('notSupported'));
        return;
    }

    sourceFileName = file.name.replace(/\.[^.]+$/, '') || 'image';
    el.beforeImage.src = URL.createObjectURL(file);
    showScreen('processing');
    el.progressFill.style.width = '0%';
    el.processingMessage.textContent = t('processing');

    try {
        resultBlob = await removeBackground(file, updateProgress, getSelectedModelMode());
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        resultUrl = URL.createObjectURL(resultBlob);
        el.afterImage.src = resultUrl;
        showScreen('result');
    } catch (error) {
        console.error('Background removal failed:', error);
        window.alert(t('processingFailed'));
        showScreen('upload');
    }
}

function wireUpload() {
    el.fileInput.addEventListener('change', () => {
        const file = el.fileInput.files?.[0];
        if (file) processFile(file);
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
        if (file) processFile(file);
    });
    el.dropZone.addEventListener('click', () => el.fileInput.click());
}

function wireResultActions() {
    el.downloadButton.addEventListener('click', () => {
        if (!resultUrl) return;
        const link = document.createElement('a');
        link.href = resultUrl;
        link.download = `${sourceFileName}-no-bg.png`;
        document.body.append(link);
        link.click();
        link.remove();
    });

    el.tryAnotherButton.addEventListener('click', () => {
        el.fileInput.value = '';
        showScreen('upload');
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
    wireResultActions();
    showScreen('upload');
}

init();

// END OF FILE
