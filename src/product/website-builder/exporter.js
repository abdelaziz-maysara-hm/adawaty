import { renderWebsite, buildThemeCss } from './engine.js';
import { validateWebsiteSpec } from './schema.js';

const JSZIP_URL = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
let zipPromise;

function loadZip() {
    zipPromise ??= import(JSZIP_URL).then((module) => module.default);
    return zipPromise;
}

/** Fetches this module's own sibling CSS/JS assets as text, same-origin so no CORS concerns. */
async function fetchSiblingText(fileName) {
    const url = new URL(fileName, import.meta.url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Unable to load ${fileName} for export.`);
    return response.text();
}

function buildReadme(spec) {
    const isArabic = spec.site.language === 'ar';
    return isArabic
        ? `# ${spec.site.name}\n\nهذا الموقع تم إنشاؤه باستخدام منشئ المواقع من أدواتي (Adawaty).\n\nلعرض الموقع، افتح ملف index.html في أي متصفح مباشرة -- لا حاجة لأي خادم أو تثبيت.\n\n## الهيكل\n\n- index.html -- الصفحة الرئيسية\n- assets/css/style.css -- التنسيقات\n- assets/js/main.js -- سكربت بسيط (فقط عند وجود نموذج تواصل)\n\nهذا الموقع لا يعتمد على أدواتي بأي شكل بعد التحميل، ويمكنك تعديله ونشره كما تشاء.\n`
        : `# ${spec.site.name}\n\nThis website was generated with the Adawaty Website Builder.\n\nTo view it, open index.html directly in any browser -- no server or install needed.\n\n## Structure\n\n- index.html -- the main page\n- assets/css/style.css -- styles\n- assets/js/main.js -- a small script (only present if there's a contact form)\n\nThis site has no dependency on Adawaty after download and can be edited and published as you like.\n`;
}

/**
 * Packages a WebsiteSpec into a real ZIP with actual files (not one HTML
 * blob renamed .zip): index.html, assets/css/style.css, assets/js/main.js
 * (only when needed), README.md.
 */
async function exportWebsiteZip(rawSpec) {
    const { spec } = validateWebsiteSpec(rawSpec);
    const result = renderWebsite(spec);
    const baseCss = await fetchSiblingText('./generated-site.css');
    const fullCss = `${result.themeCss}\n\n${baseCss}`;

    const Zip = await loadZip();
    const zip = new Zip();
    const root = zip.folder('website');
    root.file('index.html', result.html);
    root.folder('assets').folder('css').file('style.css', fullCss);
    if (result.needsJs) {
        const mainJs = await fetchSiblingText('./generated-site-main.js');
        root.folder('assets').folder('js').file('main.js', mainJs);
    }
    root.file('README.md', buildReadme(spec));

    return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

export { exportWebsiteZip };

// END OF FILE
