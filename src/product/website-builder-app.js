import './site-navigation.js?v=wb1';
import { createBuilderState } from './website-builder/state.js';
import { loadProject, saveProject, clearProject } from './website-builder/storage.js';
import { renderDocument, buildThemeCss } from './website-builder/engine.js';
import { exportWebsiteZip } from './website-builder/exporter.js';
import { createBusinessSpec } from './website-builder/templates/business.js';
import { createPortfolioSpec } from './website-builder/templates/portfolio.js';
import { createLandingSpec } from './website-builder/templates/landing.js';
import { createAgencySpec } from './website-builder/templates/agency.js';
import { createRestaurantSpec } from './website-builder/templates/restaurant.js';
import { createCatalogSpec } from './website-builder/templates/catalog.js';
import { getSchemaForSection, FIELD_LABELS, serializeItemList, parseItemList, serializeLines, parseLines } from './website-builder/content-schema.js';
import { SECTION_TYPES } from './website-builder/schema.js';

const copy = Object.freeze({
    ar: Object.freeze({
        chooseTemplate: 'اختر نوع موقعك', chooseTemplateHint: 'يمكنك تغيير كل شيء لاحقًا.',
        business: 'أعمال', businessHint: 'موقع تعريفي لشركة أو نشاط تجاري.',
        portfolio: 'معرض أعمال', portfolioHint: 'موقع شخصي لعرض أعمالك ومهاراتك.',
        siteSettings: 'إعدادات الموقع', siteName: 'اسم الموقع', siteLanguage: 'لغة الموقع الناتج',
        theme: 'المظهر', themeLight: 'فاتح', themeDark: 'داكن', primaryColor: 'اللون الأساسي', secondaryColor: 'اللون الثانوي', font: 'الخط',
        fontSystem: 'افتراضي', fontSerif: 'كلاسيكي', fontMono: 'أحادي المسافة', fontRounded: 'مستدير',
        sections: 'الأقسام', addSection: 'إضافة قسم', edit: 'تعديل', remove: 'حذف', moveUp: 'تحريك لأعلى', moveDown: 'تحريك لأسفل',
        desktop: 'سطح المكتب', tablet: 'تابلت', mobile: 'موبايل', undo: 'تراجع', redo: 'إعادة', exportZip: 'تحميل ZIP', reset: 'بدء مشروع جديد',
        resetConfirm: 'هل تريد بدء مشروع جديد؟ سيتم فقد التغييرات الحالية.',
        editSection: 'تعديل القسم', save: 'حفظ', cancel: 'إلغاء',
        exporting: 'جارٍ التجهيز...', restored: 'تم استرجاع مشروعك المحفوظ.',
        showForm: 'إظهار نموذج التواصل',
        sectionNames: Object.freeze({
            hero: 'رئيسي', features: 'مميزات', services: 'خدمات', about: 'من نحن', stats: 'إحصائيات',
            gallery: 'معرض صور', testimonials: 'آراء العملاء', pricing: 'الأسعار', faq: 'أسئلة شائعة',
            contact: 'تواصل', cta: 'دعوة لإجراء',
        }),
    }),
    en: Object.freeze({
        chooseTemplate: 'Choose your website type', chooseTemplateHint: 'You can change everything later.',
        business: 'Business', businessHint: 'A business or company website.',
        portfolio: 'Portfolio', portfolioHint: 'A personal site showcasing your work.',
        siteSettings: 'Site Settings', siteName: 'Site name', siteLanguage: 'Generated site language',
        theme: 'Theme', themeLight: 'Light', themeDark: 'Dark', primaryColor: 'Primary color', secondaryColor: 'Secondary color', font: 'Font',
        fontSystem: 'Default', fontSerif: 'Classic', fontMono: 'Monospace', fontRounded: 'Rounded',
        sections: 'Sections', addSection: 'Add section', edit: 'Edit', remove: 'Remove', moveUp: 'Move up', moveDown: 'Move down',
        desktop: 'Desktop', tablet: 'Tablet', mobile: 'Mobile', undo: 'Undo', redo: 'Redo', exportZip: 'Download ZIP', reset: 'Start New Project',
        resetConfirm: 'Start a new project? Your current changes will be lost.',
        editSection: 'Edit Section', save: 'Save', cancel: 'Cancel',
        exporting: 'Preparing...', restored: 'Your saved project was restored.',
        showForm: 'Show contact form',
        sectionNames: Object.freeze({
            hero: 'Hero', features: 'Features', services: 'Services', about: 'About', stats: 'Stats',
            gallery: 'Gallery', testimonials: 'Testimonials', pricing: 'Pricing', faq: 'FAQ',
            contact: 'Contact', cta: 'CTA',
        }),
    }),
});

function getUiLanguage() {
    return document.documentElement.dataset.language === 'en' ? 'en' : 'ar';
}

function t(key) {
    return copy[getUiLanguage()][key] ?? key;
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

const el = Object.freeze({
    templatePicker: document.querySelector('#builder-templates'),
    workspace: document.querySelector('#builder-workspace'),
    frame: document.querySelector('#builder-preview-frame'),
    frameWrap: document.querySelector('.builder-canvas-frame-wrap'),
    siteName: document.querySelector('#field-site-name'),
    siteLanguage: document.querySelector('#field-site-language'),
    themeModeLight: document.querySelector('#theme-mode-light'),
    themeModeDark: document.querySelector('#theme-mode-dark'),
    primaryColor: document.querySelector('#field-primary-color'),
    secondaryColor: document.querySelector('#field-secondary-color'),
    fontFamily: document.querySelector('#field-font-family'),
    sectionList: document.querySelector('#section-manager-list'),
    addSectionType: document.querySelector('#add-section-type'),
    addSectionButton: document.querySelector('#add-section-button'),
    undoButton: document.querySelector('#builder-undo'),
    redoButton: document.querySelector('#builder-redo'),
    exportButton: document.querySelector('#builder-export'),
    resetButton: document.querySelector('#builder-reset'),
    deviceButtons: document.querySelectorAll('.device-button'),
    editorPanel: document.querySelector('#section-editor-panel'),
    editorFields: document.querySelector('#section-editor-fields'),
    editorTitle: document.querySelector('#section-editor-title'),
    editorSave: document.querySelector('#section-editor-save'),
    editorCancel: document.querySelector('#section-editor-cancel'),
    statusMessage: document.querySelector('#builder-status'),
});

let state = null;
let editingSectionId = null;
let previewObjectUrl = '';
let saveTimer = null;

function setStatus(message) {
    if (el.statusMessage) el.statusMessage.textContent = message;
}

function debounce(fn, delayMs) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delayMs);
    };
}

function updatePreview() {
    const spec = state.getSpec();
    const document_ = renderDocument(spec, { css: 'preview.css', js: 'preview.js' });
    const themeCss = buildThemeCss(spec.theme);

    // Inline the theme + base styles directly into the iframe document via
    // srcdoc, rather than fetching separate files -- keeps the preview
    // self-contained and avoids extra network requests on every keystroke.
    const withInlineStyles = document_.replace(
        '<link rel="stylesheet" href="preview.css">',
        `<style>${themeCss}\n${window.__builderBaseCss ?? ''}</style>`,
    );

    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    el.frame.srcdoc = withInlineStyles;
}

const scheduleSave = debounce(() => {
    saveProject(state.getSpec());
}, 500);

function renderSectionManager() {
    const spec = state.getSpec();
    el.sectionList.replaceChildren(
        ...spec.sections.map((section, index) => {
            const item = document.createElement('li');
            item.className = 'section-manager-item';

            const label = document.createElement('strong');
            label.textContent = t('sectionNames')[section.type] ?? section.type;
            item.append(label);

            const upButton = document.createElement('button');
            upButton.type = 'button';
            upButton.className = 'icon-button button-quiet';
            upButton.textContent = '↑';
            upButton.setAttribute('aria-label', t('moveUp'));
            upButton.disabled = index === 0;
            upButton.addEventListener('click', () => {
                state.moveSection(section.id, 'up');
            });
            item.append(upButton);

            const downButton = document.createElement('button');
            downButton.type = 'button';
            downButton.className = 'icon-button button-quiet';
            downButton.textContent = '↓';
            downButton.setAttribute('aria-label', t('moveDown'));
            downButton.disabled = index === spec.sections.length - 1;
            downButton.addEventListener('click', () => {
                state.moveSection(section.id, 'down');
            });
            item.append(downButton);

            const editButton = document.createElement('button');
            editButton.type = 'button';
            editButton.className = 'icon-button button-quiet';
            editButton.textContent = '✎';
            editButton.setAttribute('aria-label', t('edit'));
            editButton.addEventListener('click', () => openSectionEditor(section.id));
            item.append(editButton);

            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'icon-button button-quiet';
            removeButton.textContent = '×';
            removeButton.setAttribute('aria-label', t('remove'));
            removeButton.addEventListener('click', () => {
                state.removeSection(section.id);
            });
            item.append(removeButton);

            return item;
        }),
    );
}

function renderAddSectionOptions() {
    el.addSectionType.replaceChildren(
        ...SECTION_TYPES.map((type) => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = t('sectionNames')[type] ?? type;
            return option;
        }),
    );
}

function renderSidebarFromState() {
    const spec = state.getSpec();
    el.siteName.value = spec.site.name;
    el.siteLanguage.value = spec.site.language;
    el.themeModeLight.setAttribute('aria-pressed', String(spec.theme.mode === 'light'));
    el.themeModeDark.setAttribute('aria-pressed', String(spec.theme.mode === 'dark'));
    el.primaryColor.value = spec.theme.primary;
    el.secondaryColor.value = spec.theme.secondary;
    el.fontFamily.value = spec.theme.fontFamily;
    renderSectionManager();
}

function renderToolbarState() {
    el.undoButton.disabled = !state.canUndo();
    el.redoButton.disabled = !state.canRedo();
}

function refreshAll() {
    renderSidebarFromState();
    renderToolbarState();
    updatePreview();
    scheduleSave();
}

/** Builds the section editor panel's form fields from content-schema.js for the given section. */
function openSectionEditor(sectionId) {
    const spec = state.getSpec();
    const section = spec.sections.find((candidate) => candidate.id === sectionId);
    if (!section) return;

    editingSectionId = sectionId;
    el.editorTitle.textContent = `${t('editSection')}: ${t('sectionNames')[section.type] ?? section.type}`;

    const schema = getSchemaForSection(section.type);
    el.editorFields.replaceChildren(
        ...schema.map((field) => buildEditorField(field, section.content)),
    );

    el.editorPanel.classList.add('is-open');
    el.editorPanel.setAttribute('aria-hidden', 'false');
}

function closeSectionEditor() {
    editingSectionId = null;
    el.editorPanel.classList.remove('is-open');
    el.editorPanel.setAttribute('aria-hidden', 'true');
}

function buildEditorField(field, content) {
    const wrap = document.createElement('div');
    wrap.className = 'field-row';
    wrap.dataset.fieldKey = field.key;
    wrap.dataset.fieldType = field.type;

    const label = document.createElement('label');
    label.textContent = FIELD_LABELS[field.key]?.[getUiLanguage()] ?? field.key;
    label.htmlFor = `field-${field.key}`;
    wrap.append(label);

    if (field.type === 'checkbox') {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `field-${field.key}`;
        input.checked = content[field.key] !== false;
        wrap.append(input);
        return wrap;
    }

    if (field.type === 'textarea' || field.type === 'lines' || field.type === 'itemList') {
        const textarea = document.createElement('textarea');
        textarea.id = `field-${field.key}`;
        textarea.rows = field.type === 'itemList' ? 5 : 3;
        if (field.type === 'itemList') {
            textarea.value = serializeItemList(content[field.key], field.itemFields);
            if (field.hint) {
                const hint = document.createElement('small');
                hint.textContent = field.hint[getUiLanguage()];
                wrap.append(hint);
            }
        } else if (field.type === 'lines') {
            textarea.value = serializeLines(content[field.key]);
        } else {
            textarea.value = content[field.key] ?? '';
        }
        wrap.append(textarea);
        return wrap;
    }

    const input = document.createElement('input');
    input.type = field.type === 'url' ? 'url' : 'text';
    input.id = `field-${field.key}`;
    input.value = content[field.key] ?? '';
    wrap.append(input);
    return wrap;
}

function readEditorFields(section) {
    const schema = getSchemaForSection(section.type);
    const patch = {};

    for (const field of schema) {
        const wrap = el.editorFields.querySelector(`[data-field-key="${field.key}"]`);
        if (!wrap) continue;

        if (field.type === 'checkbox') {
            patch[field.key] = wrap.querySelector('input').checked;
        } else if (field.type === 'itemList') {
            patch[field.key] = parseItemList(wrap.querySelector('textarea').value, field.itemFields);
        } else if (field.type === 'lines') {
            patch[field.key] = parseLines(wrap.querySelector('textarea').value);
        } else if (field.type === 'textarea') {
            patch[field.key] = wrap.querySelector('textarea').value;
        } else {
            patch[field.key] = wrap.querySelector('input').value;
        }
    }

    return patch;
}

function startProject(templateFactory) {
    const language = getUiLanguage();
    const spec = templateFactory({ language });
    state = createBuilderState(spec);
    state.subscribe(refreshAll);
    saveProject(state.getSpec());
    el.templatePicker.hidden = true;
    el.workspace.hidden = false;
    refreshAll();
}

const TEMPLATE_FACTORIES = Object.freeze({
    business: createBusinessSpec,
    portfolio: createPortfolioSpec,
    landing: createLandingSpec,
    agency: createAgencySpec,
    restaurant: createRestaurantSpec,
    catalog: createCatalogSpec,
});

function wireTemplatePicker() {
    document.querySelectorAll('[data-template]').forEach((card) => {
        card.addEventListener('click', () => {
            const factory = TEMPLATE_FACTORIES[card.dataset.template] ?? createBusinessSpec;
            startProject(factory);
        });
    });
}

function wireSidebar() {
    el.siteName.addEventListener('input', () => {
        state.updateSite({ name: el.siteName.value });
    });
    el.siteLanguage.addEventListener('change', () => {
        state.updateSite({ language: el.siteLanguage.value, direction: el.siteLanguage.value === 'ar' ? 'rtl' : 'ltr' });
    });
    el.themeModeLight.addEventListener('click', () => state.updateTheme({ mode: 'light' }));
    el.themeModeDark.addEventListener('click', () => state.updateTheme({ mode: 'dark' }));
    el.primaryColor.addEventListener('input', () => state.updateTheme({ primary: el.primaryColor.value }));
    el.secondaryColor.addEventListener('input', () => state.updateTheme({ secondary: el.secondaryColor.value }));
    el.fontFamily.addEventListener('change', () => state.updateTheme({ fontFamily: el.fontFamily.value }));

    el.addSectionButton.addEventListener('click', () => {
        const type = el.addSectionType.value;
        state.addSection(type, {});
    });
}

function wireSectionEditor() {
    el.editorSave.addEventListener('click', () => {
        if (!editingSectionId) return;
        const spec = state.getSpec();
        const section = spec.sections.find((candidate) => candidate.id === editingSectionId);
        if (!section) return;
        const patch = readEditorFields(section);
        state.updateSectionContent(editingSectionId, patch);
        closeSectionEditor();
    });
    el.editorCancel.addEventListener('click', closeSectionEditor);
}

function wireToolbar() {
    el.undoButton.addEventListener('click', () => state.undo());
    el.redoButton.addEventListener('click', () => state.redo());

    el.deviceButtons.forEach((button) => {
        button.addEventListener('click', () => {
            el.deviceButtons.forEach((candidate) => candidate.setAttribute('aria-pressed', 'false'));
            button.setAttribute('aria-pressed', 'true');
            el.frameWrap.dataset.device = button.dataset.device;
        });
    });

    el.exportButton.addEventListener('click', async () => {
        el.exportButton.disabled = true;
        const originalText = el.exportButton.textContent;
        el.exportButton.textContent = t('exporting');
        try {
            const blob = await exportWebsiteZip(state.getSpec());
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${(state.getSpec().site.name || 'website').replace(/[^a-z0-9\u0600-\u06FF-]+/gi, '-')}.zip`;
            document.body.append(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 4000);
        } finally {
            el.exportButton.disabled = false;
            el.exportButton.textContent = originalText;
        }
    });

    el.resetButton.addEventListener('click', () => {
        if (!window.confirm(t('resetConfirm'))) return;
        clearProject();
        state = null;
        el.workspace.hidden = true;
        el.templatePicker.hidden = false;
    });
}

async function loadBaseCssForPreview() {
    try {
        const response = await fetch(new URL('./website-builder/generated-site.css', import.meta.url));
        window.__builderBaseCss = await response.text();
    } catch {
        window.__builderBaseCss = '';
    }
}

async function init() {
    wireLanguageToggle();

    const currentYear = document.querySelector('#current-year');
    if (currentYear) currentYear.textContent = String(new Date().getFullYear());

    await loadBaseCssForPreview();
    wireTemplatePicker();
    wireSidebar();
    wireSectionEditor();
    wireToolbar();
    renderAddSectionOptions();

    // The static parts of this page use the site-wide [data-copy] toggle
    // (see main.css), but dynamically-built content -- the section manager
    // list and the add-section dropdown -- needs to be rebuilt in the new
    // language when the user switches Adawaty's UI language mid-session.
    const languageObserver = new MutationObserver(() => {
        renderAddSectionOptions();
        if (state) renderSectionManager();
    });
    languageObserver.observe(document.documentElement, { attributeFilter: ['data-language'] });

    const { spec, restored } = loadProject();
    if (restored) {
        state = createBuilderState(spec);
        state.subscribe(refreshAll);
        el.templatePicker.hidden = true;
        el.workspace.hidden = false;
        refreshAll();
        setStatus(t('restored'));
    }
}

init();

// END OF FILE
