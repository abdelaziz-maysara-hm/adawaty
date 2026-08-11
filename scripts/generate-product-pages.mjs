import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { listToolDefinitions } from '../src/product/tool-definitions.js';
import { retiredToolIds } from '../src/product/retired-tool-ids.js';
import { ROUNDUP_CONTENT } from '../src/product/definitions/roundup-content.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = 'https://adawaty.tools';
const assetVersion = 's7b46';
const catalogueAssetVersion = 's7b46';
const roundupAssetVersion = 's7b45';
const tools = listToolDefinitions();
const categories = Object.freeze({
    health: Object.freeze({ ar: 'أدوات الصحة', en: 'Health Tools' }),
    finance: Object.freeze({ ar: 'الأدوات المالية', en: 'Finance Tools' }),
    student: Object.freeze({ ar: 'أدوات الطلاب', en: 'Student Tools' }),
    'student-study': Object.freeze({ ar: 'أدوات الدراسة والعمل', en: 'Study & Work Tools' }),
    math: Object.freeze({ ar: 'أدوات الرياضيات', en: 'Math Tools' }),
    'date-time': Object.freeze({ ar: 'أدوات التاريخ والوقت', en: 'Date & Time Tools' }),
    converter: Object.freeze({ ar: 'أدوات التحويل', en: 'Converters' }),
    developer: Object.freeze({ ar: 'أدوات المطورين', en: 'Developer Tools' }),
    text: Object.freeze({ ar: 'أدوات النصوص', en: 'Text Tools' }),
    engineering: Object.freeze({ ar: 'أدوات الهندسة والعلوم', en: 'Engineering Tools' }),
    'security-network': Object.freeze({ ar: 'أدوات الأمان والشبكات', en: 'Security & Network Tools' }),
    seo: Object.freeze({ ar: 'أدوات تحسين محركات البحث', en: 'SEO Tools' }),
    'color-css': Object.freeze({ ar: 'أدوات الألوان وCSS', en: 'Color & CSS Tools' }),
    'home-lifestyle': Object.freeze({ ar: 'أدوات المنزل والحياة', en: 'Home & Lifestyle Tools' }),
    islamic: Object.freeze({ ar: 'الأدوات الإسلامية', en: 'Islamic Tools' }),
    image: Object.freeze({ ar: 'أدوات الصور والوسائط', en: 'Image & Media Tools' }),
    video: Object.freeze({ ar: 'أدوات الفيديو', en: 'Video Tools' }),
    audio: Object.freeze({ ar: 'أدوات الصوت والبودكاست', en: 'Audio & Podcast Tools' }),
    pdf: Object.freeze({ ar: 'أدوات PDF', en: 'PDF Tools' }),
});

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&')
        .replaceAll('<', '<')
        .replaceAll('>', '>')
        .replaceAll('"', '"')
        .replaceAll("'", '&#39;');
}

function safeJson(value) {
    return JSON.stringify(value).replaceAll('<', '\\u003c');
}

// NOTE: full generator restored below via user local run if truncated
console.log('This file was truncated - restore needed');
