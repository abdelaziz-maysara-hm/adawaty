import { getToolDefinition } from './tool-definitions.js?v=s7b8';

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
    element.required = true;

    if (input.type === 'select') {
        for (const option of input.options) {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = translate(option.label, language);
            element.append(optionElement);
        }
    } else if (input.type === 'textarea') {
        element.rows = input.rows ?? 8;
        element.placeholder = input.placeholder ?? '';
    } else {
        element.type = input.type;
        element.inputMode = input.type === 'number' ? 'decimal' : '';

        for (const attribute of ['min', 'max', 'step', 'placeholder', 'accept', 'multiple']) {
            if (input[attribute] !== undefined) {
                element.setAttribute(attribute, String(input[attribute]));
            }
        }
    }

    control.append(element);
    const unit = translate(input.unit, language);

    if (unit) {
        const unitElement = document.createElement('span');
        unitElement.className = 'product-unit';
        unitElement.textContent = unit;
        control.append(unitElement);
    }

    group.append(control);
    return group;
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

        result.hidden = false;
        result.focus();
    } catch (error) {
        document.querySelector('#result-value').textContent = '—';
        document.querySelector('#result-label').textContent = error.message;
        document.querySelector('#result-details').textContent = '';
        result.hidden = false;
        result.focus();
    } finally {
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

// END OF FILE
