import './site-navigation.js?v=gc2';
import { correctGrammar, isWebGPUSupported } from './grammar-checker/engine.js?v=gc2';

const copy = Object.freeze({
    ar: Object.freeze({
        placeholder: 'الصق النص اللي عايز تصحّحه هنا...',
        correct: 'صحّح', correcting: 'جارٍ التصحيح...',
        downloadingModel: 'جارٍ تحميل نموذج الذكاء الاصطناعي (مرة واحدة فقط، حوالي 950 ميجابايت)...',
        result: 'النص المُصحح', copy: 'نسخ', copied: 'تم النسخ!',
        emptyInput: 'الصق نصًا أولًا قبل التصحيح.',
        notSupportedTitle: 'متصفحك لا يدعم هذه الأداة',
        notSupportedBody: 'أداة التصحيح تحتاج متصفحًا يدعم WebGPU (مثل أحدث إصدارات Chrome أو Edge). جرّب تحديث متصفحك أو استخدام متصفح آخر.',
        correctFailed: 'تعذّر التصحيح. تأكد من اتصالك بالإنترنت (لتحميل النموذج أول مرة) وحاول مرة أخرى.',
    }),
    en: Object.freeze({
        placeholder: 'Paste the text you want to correct here...',
        correct: 'Correct', correcting: 'Correcting...',
        downloadingModel: 'Downloading AI model (one-time only, about 950 MB)...',
        result: 'Corrected text', copy: 'Copy', copied: 'Copied!',
        emptyInput: 'Paste some text before correcting.',
        notSupportedTitle: 'Your browser does not support this tool',
        notSupportedBody: 'The Grammar Checker needs a browser that supports WebGPU (such as a recent version of Chrome or Edge). Try updating your browser or using a different one.',
        correctFailed: 'Could not correct the text. Check your internet connection (needed to download the model the first time) and try again.',
    }),
});

function getUiLanguage() {
    return document.documentElement.dataset.language === 'en' ? 'en' : 'ar';
}

function t(key) {
    return copy[getUiLanguage()][key] ?? key;
}

const el = Object.freeze({
    unsupportedNotice: document.querySelector('#gc-unsupported'),
    workspace: document.querySelector('#gc-workspace'),
    input: document.querySelector('#gc-input'),
    correctButton: document.querySelector('#gc-correct'),
    progressWrap: document.querySelector('#gc-progress-wrap'),
    progressMessage: document.querySelector('#gc-progress-message'),
    resultWrap: document.querySelector('#gc-result-wrap'),
    resultText: document.querySelector('#gc-result-text'),
    copyButton: document.querySelector('#gc-copy'),
    statusMessage: document.querySelector('#gc-status'),
});

function setStatus(message) {
    el.statusMessage.textContent = message;
}

function setBusy(isBusy) {
    el.correctButton.disabled = isBusy;
    el.input.disabled = isBusy;
}

async function handleCorrect() {
    const text = el.input.value.trim();
    if (!text) {
        setStatus(t('emptyInput'));
        return;
    }

    setBusy(true);
    el.resultWrap.hidden = true;
    el.progressWrap.hidden = false;
    el.progressMessage.textContent = t('correcting');
    setStatus('');

    try {
        const corrected = await correctGrammar(text, getUiLanguage(), (progressInfo) => {
            if (progressInfo?.text) {
                el.progressMessage.textContent = progressInfo.progress < 1
                    ? t('downloadingModel')
                    : t('correcting');
            }
        });
        el.resultText.textContent = corrected;
        el.resultWrap.hidden = false;
    } catch (error) {
        console.error('Grammar correction failed:', error);
        setStatus(t('correctFailed'));
    } finally {
        el.progressWrap.hidden = true;
        setBusy(false);
    }
}

function wireWorkspace() {
    el.correctButton.addEventListener('click', handleCorrect);
    el.copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(el.resultText.textContent);
            const original = el.copyButton.textContent;
            el.copyButton.textContent = t('copied');
            setTimeout(() => { el.copyButton.textContent = original; }, 1500);
        } catch {
            // Clipboard access can fail (permissions, insecure context);
            // the corrected text remains visible and manually selectable either way.
        }
    });
}

function checkSupport() {
    if (isWebGPUSupported()) {
        el.workspace.hidden = false;
        el.unsupportedNotice.hidden = true;
        wireWorkspace();
    } else {
        el.workspace.hidden = true;
        el.unsupportedNotice.hidden = false;
    }
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
    el.input.placeholder = t('placeholder');
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

    checkSupport();
}

init();

// END OF FILE
