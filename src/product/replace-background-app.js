import './site-navigation.js?v=rb3';
import { replaceBackground } from './replace-background/engine.js?v=rb3';
import { safeHexColor } from './background-compositing.js?v=rb3';
import { decodeImage } from './image-processing.js?v=rb3';

const copy = Object.freeze({
    ar: Object.freeze({
        chooseFile: 'اختر صورة', dropHint: 'أو اسحب صورة وأفلتها هنا',
        backgroundType: 'نوع الخلفية', typeColor: 'لون واحد', typeGradient: 'تدرج لوني', typeImage: 'صورة',
        colorLabel: 'لون الخلفية', gradientStart: 'اللون الأول', gradientEnd: 'اللون الثاني',
        gradientDirection: 'اتجاه التدرج', directionVertical: 'من أعلى لأسفل', directionHorizontal: 'من اليسار لليمين', directionDiagonal: 'قطري',
        backgroundImageLabel: 'اختر صورة الخلفية',
        generate: 'استبدل الخلفية', processing: 'جارٍ المعالجة...', removingBackground: 'جارٍ إزالة الخلفية القديمة بالذكاء الاصطناعي...',
        compositing: 'جارٍ تركيب الخلفية الجديدة...',
        download: 'تحميل الصورة', tryAnother: 'جرّب صورة أخرى',
        invalidFile: 'اختر ملف صورة صالح.', processingFailed: 'تعذّرت المعالجة. جرّب صورة أخرى أو تصفّح بمتصفح مختلف.',
        needsBackgroundImage: 'اختر صورة خلفية أولًا.',
    }),
    en: Object.freeze({
        chooseFile: 'Choose an image', dropHint: 'or drag and drop an image here',
        backgroundType: 'Background type', typeColor: 'Solid color', typeGradient: 'Gradient', typeImage: 'Image',
        colorLabel: 'Background color', gradientStart: 'Start color', gradientEnd: 'End color',
        gradientDirection: 'Gradient direction', directionVertical: 'Top to bottom', directionHorizontal: 'Left to right', directionDiagonal: 'Diagonal',
        backgroundImageLabel: 'Choose a background image',
        generate: 'Replace Background', processing: 'Processing...', removingBackground: 'Removing the old background with AI...',
        compositing: 'Compositing the new background...',
        download: 'Download image', tryAnother: 'Try another image',
        invalidFile: 'Please choose a valid image file.', processingFailed: 'Could not process this image. Try a different image or browser.',
        needsBackgroundImage: 'Choose a background image first.',
    }),
});

function getUiLanguage() {
    return document.documentElement.dataset.language === 'en' ? 'en' : 'ar';
}

function t(key) {
    return copy[getUiLanguage()][key] ?? key;
}

const el = Object.freeze({
    uploadScreen: document.querySelector('#rb-upload'),
    dropZone: document.querySelector('#rb-drop-zone'),
    fileInput: document.querySelector('#rb-file-input'),
    optionsScreen: document.querySelector('#rb-options'),
    previewImage: document.querySelector('#rb-preview-image'),
    typeButtons: document.querySelectorAll('[data-bg-type]'),
    colorFields: document.querySelector('#rb-color-fields'),
    gradientFields: document.querySelector('#rb-gradient-fields'),
    imageFields: document.querySelector('#rb-image-fields'),
    colorInput: document.querySelector('#rb-color'),
    gradientStartInput: document.querySelector('#rb-gradient-start'),
    gradientEndInput: document.querySelector('#rb-gradient-end'),
    gradientDirectionInput: document.querySelector('#rb-gradient-direction'),
    backgroundImageInput: document.querySelector('#rb-background-image-input'),
    backgroundImageName: document.querySelector('#rb-background-image-name'),
    generateButton: document.querySelector('#rb-generate'),
    processingScreen: document.querySelector('#rb-processing'),
    processingMessage: document.querySelector('#rb-processing-message'),
    resultScreen: document.querySelector('#rb-result'),
    resultImage: document.querySelector('#rb-result-image'),
    downloadButton: document.querySelector('#rb-download'),
    tryAnotherButton: document.querySelector('#rb-try-another'),
});

let sourceFile = null;
let sourceFileName = 'image';
let backgroundImageFile = null;
let activeType = 'color';
let resultBlob = null;
let resultUrl = '';

function showScreen(name) {
    el.uploadScreen.hidden = name !== 'upload';
    el.optionsScreen.hidden = name !== 'options';
    el.processingScreen.hidden = name !== 'processing';
    el.resultScreen.hidden = name !== 'result';
}

function setActiveType(type) {
    activeType = type;
    el.typeButtons.forEach((button) => {
        button.classList.toggle('is-active', button.dataset.bgType === type);
    });
    el.colorFields.hidden = type !== 'color';
    el.gradientFields.hidden = type !== 'gradient';
    el.imageFields.hidden = type !== 'image';
}

async function buildDrawBackground() {
    if (activeType === 'gradient') {
        const startColor = safeHexColor(el.gradientStartInput.value, '#55d8c1');
        const endColor = safeHexColor(el.gradientEndInput.value, '#2563eb');
        const direction = el.gradientDirectionInput.value;
        return (context, width, height) => {
            const coords = {
                vertical: [0, 0, 0, height],
                horizontal: [0, 0, width, 0],
                diagonal: [0, 0, width, height],
            }[direction] ?? [0, 0, 0, height];
            const gradient = context.createLinearGradient(...coords);
            gradient.addColorStop(0, startColor);
            gradient.addColorStop(1, endColor);
            context.fillStyle = gradient;
            context.fillRect(0, 0, width, height);
        };
    }

    if (activeType === 'image') {
        const backgroundImage = await decodeImage(backgroundImageFile);
        return (context, width, height) => {
            context.drawImage(backgroundImage, 0, 0, width, height);
        };
    }

    const color = safeHexColor(el.colorInput.value, '#ffffff');
    return (context, width, height) => {
        context.fillStyle = color;
        context.fillRect(0, 0, width, height);
    };
}

async function loadSourceFile(file) {
    if (!(file instanceof File) || !file.type.startsWith('image/')) {
        window.alert(t('invalidFile'));
        return;
    }
    sourceFile = file;
    sourceFileName = file.name.replace(/\.[^.]+$/, '') || 'image';
    el.previewImage.src = URL.createObjectURL(file);
    setActiveType('color');
    showScreen('options');
}

async function handleGenerate() {
    if (activeType === 'image' && !backgroundImageFile) {
        window.alert(t('needsBackgroundImage'));
        return;
    }

    showScreen('processing');
    el.processingMessage.textContent = t('processing');

    try {
        const drawBackground = await buildDrawBackground();

        const output = await replaceBackground(sourceFile, drawBackground, (info) => {
            el.processingMessage.textContent = info?.step === 'compositing'
                ? t('compositing')
                : t('removingBackground');
        });

        resultBlob = output.blob;
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        resultUrl = URL.createObjectURL(resultBlob);
        el.resultImage.src = resultUrl;
        showScreen('result');
    } catch (error) {
        console.error('Replace background failed:', error);
        window.alert(t('processingFailed'));
        showScreen('options');
    }
}

function wireUpload() {
    el.fileInput.addEventListener('change', () => {
        const file = el.fileInput.files?.[0];
        if (file) loadSourceFile(file);
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
        if (file) loadSourceFile(file);
    });
    el.dropZone.addEventListener('click', () => el.fileInput.click());
}

function wireOptions() {
    el.typeButtons.forEach((button) => {
        button.addEventListener('click', () => setActiveType(button.dataset.bgType));
    });
    el.backgroundImageInput.addEventListener('change', () => {
        const file = el.backgroundImageInput.files?.[0];
        if (file) {
            backgroundImageFile = file;
            el.backgroundImageName.textContent = file.name;
        }
    });
    el.generateButton.addEventListener('click', handleGenerate);
}

function wireResultActions() {
    el.downloadButton.addEventListener('click', () => {
        if (!resultUrl) return;
        const link = document.createElement('a');
        link.href = resultUrl;
        link.download = `${sourceFileName}-new-background.jpg`;
        document.body.append(link);
        link.click();
        link.remove();
    });

    el.tryAnotherButton.addEventListener('click', () => {
        el.fileInput.value = '';
        el.backgroundImageInput.value = '';
        backgroundImageFile = null;
        el.backgroundImageName.textContent = '';
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
    wireOptions();
    wireResultActions();
    showScreen('upload');
}

init();

// END OF FILE
