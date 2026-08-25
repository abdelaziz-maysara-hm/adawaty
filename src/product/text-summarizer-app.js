import './site-navigation.js?v=ts2';
import { summarizeText, isWebGPUSupported } from './text-summarizer/engine.js?v=ts2';
import { summarizeViaCloud } from './text-summarizer/cloud-engine.js?v=ts2';

const copy = Object.freeze({
    ar: Object.freeze({
        placeholder: 'الصق النص اللي عايز تلخّصه هنا...',
        summarize: 'لخّص', summarizing: 'جارٍ التلخيص...',
        downloadingModel: 'جارٍ تحميل نموذج الذكاء الاصطناعي (مرة واحدة فقط، حوالي 950 ميجابايت)...',
        cloudSummarizing: 'جارٍ التلخيص عبر الخدمة السحابية...',
        result: 'الملخص', copy: 'نسخ', copied: 'تم النسخ!',
        emptyInput: 'الصق نصًا أولًا قبل التلخيص.',
        summarizeFailed: 'تعذّر التلخيص. تأكد من اتصالك بالإنترنت (لتحميل النموذج أول مرة) وحاول مرة أخرى.',
        cloudSummarizeFailed: 'تعذّر التلخيص عبر الخدمة السحابية. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.',
        cloudConfirm: 'النسخة السحابية هتبعت النص اللي كتبته لخدمة ذكاء اصطناعي سحابية (Cloudflare Workers AI) عشان تتلخّص، بدل ما تتلخّص جوّه متصفحك. متابعة؟',
    }),
    en: Object.freeze({
        placeholder: 'Paste the text you want to summarize here...',
        summarize: 'Summarize', summarizing: 'Summarizing...',
        downloadingModel: 'Downloading AI model (one-time only, about 950 MB)...',
        cloudSummarizing: 'Summarizing via the cloud service...',
        result: 'Summary', copy: 'Copy', copied: 'Copied!',
        emptyInput: 'Paste some text before summarizing.',
        summarizeFailed: 'Could not summarize. Check your internet connection (needed to download the model the first time) and try again.',
        cloudSummarizeFailed: 'Could not summarize via the cloud service. Check your internet connection and try again.',
        cloudConfirm: 'The cloud version sends the text you typed to a cloud AI service (Cloudflare Workers AI) to be summarized, instead of summarizing it inside your browser. Continue?',
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
    useCloudFallbackButton: document.querySelector('#ts-use-cloud-fallback'),
    workspace: document.querySelector('#ts-workspace'),
    modeInputs: document.querySelectorAll('input[name="ts-mode"]'),
    input: document.querySelector('#ts-input'),
    summarizeButton: document.querySelector('#ts-summarize'),
    progressWrap: document.querySelector('#ts-progress-wrap'),
    progressMessage: document.querySelector('#ts-progress-message'),
    resultWrap: document.querySelector('#ts-result-wrap'),
    resultText: document.querySelector('#ts-result-text'),
    copyButton: document.querySelector('#ts-copy'),
    statusMessage: document.querySelector('#ts-status'),
});

// Tracks whether the visitor has already confirmed the cloud-mode
// disclosure once in this page visit, so they aren't re-prompted for
// every single summarization -- the confirmation happens once when
// they first switch to cloud mode, not once per use.
let cloudDisclosureConfirmed = false;

function setStatus(message) {
    el.statusMessage.textContent = message;
}

function setBusy(isBusy) {
    el.summarizeButton.disabled = isBusy;
    el.input.disabled = isBusy;
}

function getSelectedMode() {
    for (const input of el.modeInputs) {
        if (input.checked) return input.value;
    }
    return 'local';
}

function setSelectedMode(mode) {
    for (const input of el.modeInputs) {
        input.checked = input.value === mode;
    }
}

async function handleSummarize() {
    const text = el.input.value.trim();
    if (!text) {
        setStatus(t('emptyInput'));
        return;
    }

    const mode = getSelectedMode();

    setBusy(true);
    el.resultWrap.hidden = true;
    el.progressWrap.hidden = false;
    el.progressMessage.textContent = mode === 'cloud' ? t('cloudSummarizing') : t('summarizing');
    setStatus('');

    try {
        const summary = mode === 'cloud'
            ? await summarizeViaCloud(text, getUiLanguage())
            : await summarizeText(text, getUiLanguage(), (progressInfo) => {
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
        setStatus(mode === 'cloud' ? t('cloudSummarizeFailed') : t('summarizeFailed'));
    } finally {
        el.progressWrap.hidden = true;
        setBusy(false);
    }
}

function handleModeChange(event) {
    if (event.target.value !== 'cloud' || cloudDisclosureConfirmed) return;

    // eslint-disable-next-line no-alert -- a deliberate, explicit
    // consent prompt for the one action on this site that sends user
    // text to a server; not a generic dialog to avoid.
    const confirmed = window.confirm(t('cloudConfirm'));
    if (confirmed) {
        cloudDisclosureConfirmed = true;
    } else {
        setSelectedMode('local');
    }
}

function wireWorkspace() {
    el.summarizeButton.addEventListener('click', handleSummarize);
    for (const input of el.modeInputs) {
        input.addEventListener('change', handleModeChange);
    }
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

function showWorkspace(initialMode) {
    el.workspace.hidden = false;
    el.unsupportedNotice.hidden = true;
    setSelectedMode(initialMode);
    if (initialMode === 'cloud') cloudDisclosureConfirmed = true; // already disclosed via the fallback button's own copy
    wireWorkspace();
}

function checkSupport() {
    if (isWebGPUSupported()) {
        showWorkspace('local');
    } else {
        // Unlike the old behavior (a dead end for the ~15-18% of
        // visitors without WebGPU), the cloud version remains a real,
        // explicitly-chosen fallback -- the unsupported notice's own
        // button leads here, its copy already disclosing that this
        // sends text to a cloud service.
        el.workspace.hidden = true;
        el.unsupportedNotice.hidden = false;
        el.useCloudFallbackButton.addEventListener('click', () => showWorkspace('cloud'), { once: true });
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
