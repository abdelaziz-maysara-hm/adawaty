import { getToolDefinition } from './tool-definitions.js';

const root = document.documentElement;
const page = document.querySelector('[data-tool-page]');
const toolId = page?.dataset.toolPage ?? '';
const tool = getToolDefinition(toolId);
const form = document.querySelector('#tool-form');
const result = document.querySelector('#tool-result');
const languageButton = document.querySelector('#tool-language-toggle');
const currentYear = document.querySelector('#current-year');

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

        for (const attribute of ['min', 'max', 'step', 'placeholder']) {
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
    submit.textContent = language === 'ar' ? 'احسب الآن' : 'Calculate now';
    form.append(submit);
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
                : element.value;
            return [input.id, value];
        }),
    );
}

form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
        return;
    }

    try {
        const output = tool.calculate(readValues(), getLanguage());
        document.querySelector('#result-value').textContent = output.value;
        document.querySelector('#result-label').textContent = output.label;
        document.querySelector('#result-details').textContent = output.details;
        result.hidden = false;
        result.focus();
    } catch (error) {
        document.querySelector('#result-value').textContent = '—';
        document.querySelector('#result-label').textContent = error.message;
        document.querySelector('#result-details').textContent = '';
        result.hidden = false;
        result.focus();
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
