import './site-navigation.js?v=s7b42';
import { getToolDefinition } from './tool-definitions.js?v=s7b46';
import { recordToolVisit } from './usage-tracking.js?v=s7b41';

const root = document.documentElement;
const page = document.querySelector('[data-tool-page]');
const toolId = page?.dataset.toolPage ?? '';
const tool = getToolDefinition(toolId);
const form = document.querySelector('#tool-form');
const result = document.querySelector('#tool-result');
const languageButton = document.querySelector('#tool-language-toggle');
const currentYear = document.querySelector('#current-year');
const resultPreview = document.querySelector('#result-preview');
const resultDownload = document.querySelector('#result-download');
const progress = document.querySelector('#tool-progress');
const progressLabel = document.querySelector('#tool-progress-label');
let resultObjectUrl = '';

if (!tool || !form || !result) {
    throw new Error(`Unable to initialize tool page "${toolId}".`);
}

function translate(value, language) {
    return value?.[language] ?? value?.en ?? '';
}

function getLanguage() {
    return root.dataset.language === 'en' ? 'en' : 'ar';
}

function createInput(input, language) {
    const group = document.createElement('label');
    group.className = 'product-field';
    group.htmlFor = input.id;

    const label = document.createElement('span');
    label.className = 'product-field-label';
    label.textContent = translate(input.label, language);
    group.append(label);

    const control = document.createElement('span');
    control.className = 'product-control';
    const tagName = input.type === 'select'
        ? 'select'
        : input.type === 'textarea' ? 'textarea' : 'input';
    const element = document.createElement(tagName);
    element.id = input.id;
    element.name = input.id;
    element.required = input.required !== false;

    if (input.type === 'select') {
        for (const option of input.options) {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = translate(option.label, language);
            element.append(optionElement);
        }
    } else if (input.type === 'textarea') {
        element.rows = input.rows ?? 8;
        element.placeholder = resolvePlaceholder(input, language);
    } else {
        element.type = input.type;
        element.inputMode = input.type === 'number' ? 'decimal' : '';

        for (const attribute of ['min', 'max', 'step', 'accept', 'multiple', 'value']) {
            if (input[attribute] !== undefined) {
                element.setAttribute(attribute, String(input[attribute]));
            }
        }
        element.placeholder = resolvePlaceholder(input, language);
    }

    control.append(element);

    let chipList = null;
    if (input.type === 'file' && input.multiple) {
        chipList = document.createElement('ul');
        chipList.className = 'product-file-chips';

        const sameFile = (a, b) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

        const applyFiles = (files) => {
            element._accumulatedFiles = files;
            const transfer = new DataTransfer();
            for (const file of files) transfer.items.add(file);
            element.files = transfer.files;
            renderChips();
        };

        const renderChips = () => {
            const files = element._accumulatedFiles ?? [];
            chipList.replaceChildren(
                ...files.map((file, index) => {
                    const item = document.createElement('li');
                    item.className = 'product-file-chip';
                    const name = document.createElement('span');
                    name.textContent = `${index + 1}. ${file.name}`;
                    item.append(name);
                    const remove = document.createElement('button');
                    remove.type = 'button';
                    remove.className = 'product-file-chip-remove';
                    remove.setAttribute('aria-label', `Remove ${file.name}`);
                    remove.textContent = '×';
                    remove.addEventListener('click', () => {
                        applyFiles(files.filter((_, i) => i !== index));
                    });
                    item.append(remove);
                    return item;
                }),
            );
        };

        element.addEventListener('change', () => {
            const previous = element._accumulatedFiles ?? [];
            const incoming = Array.from(element.files ?? []);
            const merged = [...previous];
            for (const file of incoming) {
                if (!merged.some((existing) => sameFile(existing, file))) {
                    merged.push(file);
                }
            }
            applyFiles(merged);
        });
    }

    const unit = translate(input.unit, language);

    if (unit) {
        const unitElement = document.createElement('span');
        unitElement.className = 'product-unit';
        unitElement.textContent = unit;
        control.append(unitElement);
    }

    group.append(control);
    if (chipList) group.append(chipList);
    return group;
}

function resolvePlaceholder(input, language) {
    if (input.placeholder && typeof input.placeholder === 'object') {
        return translate(input.placeholder, language);
    }

    const placeholder = String(input.placeholder ?? '');
    if (language === 'en' && /[\u0600-\u06FF]/.test(placeholder)) {
        return translate(input.label, 'en');
    }
    return placeholder;
}

function renderForm(language) {
    form.replaceChildren(
        ...tool.inputs.map((input) => createInput(input, language)),
    );

    const submit = document.createElement('button');
    submit.className = 'button button-primary product-submit';
    submit.type = 'submit';
    submit.textContent = translate(tool.action, language)
        || (language === 'ar' ? 'احسب الآن' : 'Calculate now');
    form.append(submit);
}

function clearProcessedOutput() {
    if (resultObjectUrl) {
        URL.revokeObjectURL(resultObjectUrl);
        resultObjectUrl = '';
    }

    if (resultPreview) {
        resultPreview.hidden = true;
        resultPreview.removeAttribute('src');
    }

    if (resultDownload) {
        resultDownload.hidden = true;
        resultDownload.removeAttribute('href');
        resultDownload.removeAttribute('download');
    }
}

function updateCopy(language) {
    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
    root.dataset.language = language;
    document.title = `${translate(tool.title, language)} | ${language === 'ar' ? 'أدواتي' : 'Adawaty'}`;
    document.querySelector('#tool-title').textContent = translate(
        tool.title,
        language,
    );
    document.querySelector('#tool-description').textContent = translate(
        tool.description,
        language,
    );
    document.querySelector('#tool-note').textContent = translate(
        tool.note,
        language,
    );
    document.querySelector('#tool-icon').textContent = tool.icon;
    languageButton.textContent = language === 'ar' ? 'English' : 'العربية';
    document.querySelector('#back-label').textContent = language === 'ar'
        ? 'كل الأدوات'
        : 'All tools';
    document.querySelectorAll('[data-copy]').forEach((element) => {
        element.hidden = element.dataset.copy !== language;
    });
    clearProcessedOutput();
    result.hidden = true;
    renderForm(language);

    try {
        localStorage.setItem('adawaty-language', language);
    } catch {
        // Language switching remains available without storage.
    }
}

function readValues() {
    return Object.fromEntries(
        tool.inputs.map((input) => {
            const element = form.elements.namedItem(input.id);
            const value = input.type === 'number'
                ? Number(element.value)
                : input.type === 'file'
                    ? input.multiple
                        ? Array.from(element.files ?? [])
                        : element.files?.[0]
                    : element.value;
            return [input.id, value];
        }),
    );
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
        return;
    }

    const submit = form.querySelector('[type="submit"]');
    const language = getLanguage();
    const originalCopy = submit.textContent;
    submit.disabled = true;
    submit.textContent = language === 'ar' ? 'جارٍ المعالجة…' : 'Processing…';
    clearProcessedOutput();

    let progressTimer;
    if (progress) {
        progressLabel.textContent = language === 'ar' ? 'جارٍ المعالجة، برجاء الانتظار…' : 'Processing, please wait…';
        // Delay the reveal slightly so fast operations (most tools) never flash a progress bar.
        progressTimer = setTimeout(() => { progress.hidden = false; }, 400);
    }

    try {
        const handler = tool.process ?? tool.calculate;
        const output = await handler(readValues(), language);
        document.querySelector('#result-value').textContent = output.value;
        document.querySelector('#result-label').textContent = output.label;
        document.querySelector('#result-details').textContent = output.details;

        if (output.download?.blob && resultDownload) {
            resultObjectUrl = URL.createObjectURL(output.download.blob);
            resultDownload.href = resultObjectUrl;
            resultDownload.download = output.download.filename;
            resultDownload.textContent = language === 'ar'
                ? 'تنزيل الملف'
                : 'Download file';
            resultDownload.hidden = false;
        }

        if (output.preview && resultPreview) {
            const previewUrl = resultObjectUrl || URL.createObjectURL(output.preview);
            resultObjectUrl = previewUrl;
            resultPreview.src = previewUrl;
            resultPreview.alt = output.label;
            resultPreview.hidden = false;
        }

        result.classList.remove('is-error');
        result.hidden = false;
        result.focus();
    } catch (error) {
        const message = error.message || '';
        const hasArabicScript = /[\u0600-\u06FF]/.test(message);
        const looksUnlocalized = message.length > 0 && (
            (language === 'ar' && !hasArabicScript)
            || (language === 'en' && hasArabicScript)
        );

        document.querySelector('#result-value').textContent = language === 'ar' ? 'خطأ' : 'Error';
        document.querySelector('#result-label').textContent = looksUnlocalized
            ? (language === 'ar' ? 'حدث خطأ غير متوقع أثناء المعالجة' : 'An unexpected error occurred')
            : (message || (language === 'ar' ? 'حدث خطأ غير متوقع أثناء المعالجة' : 'An unexpected error occurred'));
        document.querySelector('#result-details').textContent = looksUnlocalized ? message : '';
        result.classList.add('is-error');
        result.hidden = false;
        result.focus();
    } finally {
        clearTimeout(progressTimer);
        if (progress) progress.hidden = true;
        submit.disabled = false;
        submit.textContent = originalCopy;
    }
});

languageButton.addEventListener('click', () => {
    updateCopy(getLanguage() === 'ar' ? 'en' : 'ar');
});

if (currentYear) {
    currentYear.textContent = String(new Date().getFullYear());
}

let initialLanguage = navigator.language.toLowerCase().startsWith('ar')
    ? 'ar'
    : 'en';

try {
    initialLanguage = localStorage.getItem('adawaty-language')
        ?? initialLanguage;
} catch {
    // Browser language remains the fallback.
}

updateCopy(initialLanguage === 'en' ? 'en' : 'ar');
recordToolVisit(toolId);

// END OF FILE
