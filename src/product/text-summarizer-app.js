import './site-navigation.js?v=ts1';
import { summarizeText, isWebGPUSupported } from './text-summarizer/engine.js';

const copy = Object.freeze({
    ar: Object.freeze({
        placeholder: 'الصق النص اللي عايز تلخّصه هنا...',
        summarize: 'لخّص', summarizing: 'جارٍ التلخيص...',
        downloadingModel: 'جارٍ تحميل نموذج الذكاء الاصطناعي (مرة واحدة فقط، حوالي 950 ميجابايت)...',
        result: 'الملخص', copy: 'نسخ', copied: 'تم النسخ!',
        emptyInput: 'الصق نصًا أولًا قبل التلخيص.',
        notSupportedTitle: 'متصفحك لا يدعم هذه الأداة',
        notSupportedBody: 'أداة التلخيص تحتاج متصفحًا يدعم WebGPU (مثل أحدث إصدارات Chrome أو Edge). جرّب تحديث متصفحك أو استخدام متصفح آخر.',
        summarizeFailed: 'تعذّر التلخيص. تأكد من اتصالك بالإنترنت (لتحميل النموذج أول مرة) وحاول مرة أخرى.',
    }),
    en: Object.freeze({
        placeholder: 'Paste the text you want to summarize here...',
        summarize: 'Summarize', summarizing: 'Summarizing...',
        downloadingModel: 'Downloading AI model (one-time only, about 950 MB)...',
        result: 'Summary', copy: 'Copy', copied: 'Copied!',
        emptyInput: 'Paste some text before summarizing.',
        notSupportedTitle: 'Your browser does not support this tool',
        notSupportedBody: 'The Summarizer needs a browser that supports WebGPU (such as a recent version of Chrome or Edge). Try updating your browser or using a different one.',
        summarizeFailed: 'Could not summarize. Check your internet connection (needed to download the model the first time) and try again.',
    }),
});

function getUiLanguage() {
    return document.documentElement.dataset.language === 'en' ? 'en' : 'ar';
}

function t(key) {
    return copy[getUiLanguage()][key] ?? key;
}

const el = Object.freeze({
    unsupportedNotice: document.querySelector('#ts-unsupported'),
    workspace: document.querySelector('#ts-workspace'),
    input: document.querySelector('#ts-input'),
    summarizeButton: document.querySelector('#ts-summarize'),
    progressWrap: document.querySelector('#ts-progress-wrap'),
    progressMessage: document.querySelector('#ts-progress-message'),
    resultWrap: document.querySelector('#ts-result-wrap'),
    resultText: document.querySelector('#ts-result-text'),
    copyButton: document.querySelector('#ts-copy'),
    statusMessage: document.querySelector('#ts-status'),
});

function setStatus(message) {
    el.statusMessage.textContent = message;
}

function setBusy(isBusy) {
    el.summarizeButton.disabled = isBusy;
    el.input.disabled = isBusy;
}

async function handleSummarize() {
    const text = el.input.value.trim();
    if (!text) {
        setStatus(t('emptyInput'));
        return;
    }

    setBusy(true);
    el.resultWrap.hidden = true;
    el.progressWrap.hidden = false;
    el.progressMessage.textContent = t('summarizing');
    setStatus('');

    try {
        const summary = await summarizeText(text, getUiLanguage(), (progressInfo) => {
            if (progressInfo?.text) {
                el.progressMessage.textContent = progressInfo.progress < 1
                    ? t('downloadingModel')
                    : t('summarizing');
            }
        });
        el.resultText.textContent = summary;
        el.resultWrap.hidden = false;
    } catch (error) {
        console.error('Summarization failed:', error);
        setStatus(t('summarizeFailed'));
    } finally {
        el.progressWrap.hidden = true;
        setBusy(false);
    }
}

function wireWorkspace() {
    el.summarizeButton.addEventListener('click', handleSummarize);
    el.copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(el.resultText.textContent);
            const original = el.copyButton.textContent;
            el.copyButton.textContent = t('copied');
            setTimeout(() => { el.copyButton.textContent = original; }, 1500);
        } catch {
            // Clipboard access can fail (permissions, insecure context);
            // the summary text remains visible and manually selectable either way.
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
