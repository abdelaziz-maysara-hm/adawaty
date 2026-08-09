import { canvasToBlob, decodeImage } from '../image-processing.js';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
}

function textInput(id, label, placeholder, rows = 4) {
    return Object.freeze({
        id, type: 'textarea', rows,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function shortTextInput(id, label, placeholder) {
    return Object.freeze({
        id, type: 'text',
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function numberInput(id, label, placeholder, min, max, step = 1) {
    return Object.freeze({
        id, type: 'number', min, max, step,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

function selectInput(id, label, options) {
    return Object.freeze({
        id, type: 'select',
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map((option) => Object.freeze(option))),
    });
}

function fileInput(id, label, accept) {
    return Object.freeze({
        id, type: 'file', accept,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function fileOutput(blob, filename, language, arLabel, enLabel) {
    return {
        value: localized(language, 'جاهز للتنزيل', 'Ready to download'),
        label: localized(language, arLabel, enLabel),
        details: '',
        download: { blob, filename },
    };
}

function tool(config) {
    return Object.freeze({
        id: config.id,
        category: config.category ?? 'developer',
        icon: config.icon,
        title: Object.freeze(config.title),
        description: Object.freeze(config.description),
        note: Object.freeze(config.note),
        inputs: Object.freeze(config.inputs),
        calculate: config.calculate,
        process: config.process,
    });
}

// --- Cron expression parser -------------------------------------------

const WEEKDAY_NAMES = { ar: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'], en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] };
const MONTH_NAMES = {
    ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

function describeCronField(field, unitLabel, names, language) {
    if (field === '*') return localized(language, `كل ${unitLabel}`, `every ${unitLabel}`);
    if (field.startsWith('*/')) return localized(language, `كل ${field.slice(2)} ${unitLabel}`, `every ${field.slice(2)} ${unitLabel}(s)`);
    const parts = field.split(',').map((part) => {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            const label = (n) => names ? names[n] ?? n : n;
            return `${label(start)}–${label(end)}`;
        }
        const n = Number(part);
        return names && !Number.isNaN(n) ? (names[n] ?? part) : part;
    });
    return parts.join(', ');
}

const cronExpressionParser = tool({
    id: 'cron-expression-parser',
    icon: 'cron',
    title: { ar: 'شرح تعبير Cron', en: 'Cron Expression Parser' },
    description: {
        ar: 'اكتب تعبير cron واحصل على شرح مبسّط بالعربي والإنجليزي لموعد تشغيله.',
        en: 'Paste a cron expression and get a plain-language explanation of its schedule.',
    },
    note: {
        ar: 'يدعم الصيغة القياسية المكوّنة من 5 حقول (دقيقة ساعة يوم-شهر شهر يوم-أسبوع).',
        en: 'Supports the standard 5-field format (minute hour day-of-month month day-of-week).',
    },
    inputs: [shortTextInput('expression', { ar: 'تعبير Cron', en: 'Cron expression' }, '*/15 9-17 * * 1-5')],
    calculate(values, language) {
        const fields = values.expression.trim().split(/\s+/);
        if (fields.length !== 5) {
            throw new Error(localized(language, 'التعبير يجب أن يتكون من 5 حقول مفصولة بمسافات.', 'The expression must have exactly 5 space-separated fields.'));
        }
        const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;
        const parts = [
            describeCronField(minute, localized(language, 'دقيقة', 'minute'), null, language),
            describeCronField(hour, localized(language, 'ساعة', 'hour'), null, language),
            dayOfMonth === '*' ? null : describeCronField(dayOfMonth, localized(language, 'يوم', 'day'), null, language),
            month === '*' ? null : describeCronField(month, localized(language, 'شهر', 'month'), MONTH_NAMES[language], language),
            dayOfWeek === '*' ? null : describeCronField(dayOfWeek, localized(language, 'يوم أسبوع', 'weekday'), WEEKDAY_NAMES[language], language),
        ].filter(Boolean);
        return output(parts.join(' — '), localized(language, 'الجدول الزمني', 'Schedule'));
    },
});

// --- JSON Schema validator (subset) ------------------------------------

function validateAgainstSchema(value, schema, path, errors) {
    if (schema.type) {
        const actual = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
        if (actual !== schema.type) {
            errors.push(`${path || '/'}: expected ${schema.type}, got ${actual}`);
            return;
        }
    }
    if (schema.enum && !schema.enum.includes(value)) {
        errors.push(`${path || '/'}: value not in enum [${schema.enum.join(', ')}]`);
    }
    if (typeof value === 'string') {
        if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${path}: shorter than minLength ${schema.minLength}`);
        if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push(`${path}: longer than maxLength ${schema.maxLength}`);
        if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${path}: does not match pattern ${schema.pattern}`);
    }
    if (typeof value === 'number') {
        if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${path}: below minimum ${schema.minimum}`);
        if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${path}: above maximum ${schema.maximum}`);
    }
    if (schema.type === 'object' && value && typeof value === 'object') {
        for (const key of schema.required ?? []) {
            if (!(key in value)) errors.push(`${path || '/'}: missing required property "${key}"`);
        }
        for (const [key, propSchema] of Object.entries(schema.properties ?? {})) {
            if (key in value) validateAgainstSchema(value[key], propSchema, `${path}/${key}`, errors);
        }
    }
    if (schema.type === 'array' && Array.isArray(value) && schema.items) {
        value.forEach((item, index) => validateAgainstSchema(item, schema.items, `${path}[${index}]`, errors));
    }
}

const jsonSchemaValidator = tool({
    id: 'json-schema-validator',
    icon: 'JSON✓',
    title: { ar: 'التحقق من JSON Schema', en: 'JSON Schema Validator' },
    description: {
        ar: 'تحقّق من مطابقة بيانات JSON لمخطط (schema) محدد.',
        en: 'Validate JSON data against a JSON Schema definition.',
    },
    note: {
        ar: 'يدعم أهم الكلمات المفتاحية الشائعة (type, required, properties, items, enum, min/max, pattern)، وليس المواصفة الكاملة لـ JSON Schema.',
        en: 'Supports the most common keywords (type, required, properties, items, enum, min/max, pattern), not the full JSON Schema spec.',
    },
    inputs: [
        textInput('schema', { ar: 'المخطط (Schema)', en: 'Schema' }, '{\n  "type": "object",\n  "required": ["name"],\n  "properties": {\n    "name": { "type": "string", "minLength": 1 },\n    "age": { "type": "number", "minimum": 0 }\n  }\n}', 8),
        textInput('data', { ar: 'بيانات JSON', en: 'JSON data' }, '{ "name": "Adawaty", "age": 2 }', 6),
    ],
    calculate(values, language) {
        let schema;
        let data;
        try {
            schema = JSON.parse(values.schema);
        } catch (error) {
            throw new Error(localized(language, `المخطط ليس JSON صالحًا: ${error.message}`, `Schema is not valid JSON: ${error.message}`));
        }
        try {
            data = JSON.parse(values.data);
        } catch (error) {
            throw new Error(localized(language, `البيانات ليست JSON صالحًا: ${error.message}`, `Data is not valid JSON: ${error.message}`));
        }
        const errors = [];
        validateAgainstSchema(data, schema, '', errors);
        if (errors.length === 0) {
            return output(localized(language, 'صالح ✓', 'Valid ✓'), localized(language, 'البيانات مطابقة للمخطط', 'Data matches the schema'));
        }
        return output(
            localized(language, `${errors.length} خطأ`, `${errors.length} error(s)`),
            localized(language, 'البيانات غير مطابقة', 'Data does not match'),
            errors.join('\n'),
        );
    },
});

// --- URL slug generator -------------------------------------------------

const urlSlugGenerator = tool({
    id: 'url-slug-generator',
    icon: 'slug',
    category: 'seo',
    title: { ar: 'مولّد Slug للروابط', en: 'URL Slug Generator' },
    description: {
        ar: 'حوّل أي عنوان إلى slug نظيف مناسب لروابط المقالات والصفحات.',
        en: 'Turn any title into a clean slug suitable for article and page URLs.',
    },
    note: {
        ar: 'يحذف الرموز الخاصة ويستبدل المسافات بشرطات، مع دعم الأحرف العربية.',
        en: 'Strips special characters and replaces spaces with hyphens, with Arabic character support.',
    },
    inputs: [
        shortTextInput('title', { ar: 'العنوان', en: 'Title' }, { ar: 'أفضل 10 أدوات مجانية أونلاين!', en: 'Best 10 free online tools!' }),
        selectInput('case', { ar: 'حالة الأحرف', en: 'Case' }, [
            { value: 'lower', label: { ar: 'أحرف صغيرة', en: 'lowercase' } },
            { value: 'keep', label: { ar: 'كما هي', en: 'keep as-is' } },
        ]),
    ],
    calculate(values, language) {
        let slug = values.title
            .trim()
            .replace(/[^\p{L}\p{N}\s-]/gu, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        if (values.case === 'lower') slug = slug.toLowerCase();
        return output(slug || '-', localized(language, 'Slug', 'Slug'));
    },
});

// --- Bionic reading converter --------------------------------------------

function bionicWord(word) {
    const boldLength = Math.max(1, Math.ceil(word.length * 0.5));
    return `<strong>${word.slice(0, boldLength)}</strong>${word.slice(boldLength)}`;
}

const bionicReadingConverter = tool({
    id: 'bionic-reading-converter',
    icon: 'B',
    category: 'text',
    title: { ar: 'تحويل نص لقراءة سريعة (Bionic Reading)', en: 'Bionic Reading Converter' },
    description: {
        ar: 'أبرز أول جزء من كل كلمة بخط عريض لتسريع القراءة وتحسين التركيز.',
        en: 'Bold the first part of each word to speed up reading and improve focus.',
    },
    note: {
        ar: 'الناتج كود HTML جاهز للّصق في أي محرر يدعم التنسيق.',
        en: 'The output is ready-to-paste HTML for any editor that supports formatting.',
    },
    inputs: [textInput('text', { ar: 'النص', en: 'Text' }, { ar: 'اقرأ هذا النص بسرعة أكبر مع تقنية القراءة الحيوية.', en: 'Read this text faster with bionic reading.' }, 8)],
    calculate(values, language) {
        const html = values.text.split(/(\s+)/).map((chunk) => (/\s+/.test(chunk) ? chunk : bionicWord(chunk))).join('');
        return output(html, localized(language, 'كود HTML', 'HTML output'));
    },
});

// --- CSS generators: loader, glassmorphism, clip-path --------------------

const cssLoaderGenerator = tool({
    id: 'css-loader-generator',
    icon: 'css',
    category: 'color-css',
    title: { ar: 'مولّد مؤشر التحميل CSS', en: 'CSS Loader Generator' },
    description: {
        ar: 'أنشئ كود CSS لمؤشر تحميل دوّار جاهز للاستخدام.',
        en: 'Generate ready-to-use CSS for a spinning loading indicator.',
    },
    note: {
        ar: 'أضف عنصر div بالـ class "adawaty-loader" في HTML، والصق كود CSS الناتج.',
        en: 'Add a div with class "adawaty-loader" in your HTML, and paste the generated CSS.',
    },
    inputs: [
        shortTextInput('color', { ar: 'اللون', en: 'Color' }, '#06B6D4'),
        numberInput('size', { ar: 'الحجم (بكسل)', en: 'Size (px)' }, 40, 16, 200, 1),
        numberInput('thickness', { ar: 'السُمك (بكسل)', en: 'Thickness (px)' }, 4, 1, 20, 1),
        numberInput('speed', { ar: 'السرعة (ثانية)', en: 'Speed (s)' }, 0.8, 0.2, 5, 0.1),
    ],
    calculate(values, language) {
        const css = `.adawaty-loader {
  width: ${values.size}px;
  height: ${values.size}px;
  border: ${values.thickness}px solid rgba(0,0,0,0.1);
  border-top-color: ${values.color};
  border-radius: 50%;
  animation: adawaty-spin ${values.speed}s linear infinite;
}

@keyframes adawaty-spin {
  to { transform: rotate(360deg); }
}`;
        return output(css, localized(language, 'كود CSS', 'CSS code'));
    },
});

const cssGlassmorphismGenerator = tool({
    id: 'css-glassmorphism-generator',
    icon: 'css',
    category: 'color-css',
    title: { ar: 'مولّد تأثير الزجاج (Glassmorphism)', en: 'CSS Glassmorphism Generator' },
    description: {
        ar: 'أنشئ كود CSS لتأثير الزجاج الضبابي الشائع في الواجهات الحديثة.',
        en: 'Generate CSS for the frosted-glass effect common in modern UI design.',
    },
    note: {
        ar: 'يعتمد على خاصية backdrop-filter؛ تأكد من دعم المتصفح المستهدف لها.',
        en: 'Relies on backdrop-filter; make sure your target browsers support it.',
    },
    inputs: [
        numberInput('opacity', { ar: 'شفافية الخلفية (%)', en: 'Background opacity (%)' }, 20, 5, 90, 1),
        numberInput('blur', { ar: 'مقدار الضبابية (بكسل)', en: 'Blur amount (px)' }, 12, 0, 40, 1),
        numberInput('radius', { ar: 'استدارة الحواف (بكسل)', en: 'Border radius (px)' }, 16, 0, 60, 1),
    ],
    calculate(values, language) {
        const alpha = (values.opacity / 100).toFixed(2);
        const css = `.adawaty-glass {
  background: rgba(255, 255, 255, ${alpha});
  backdrop-filter: blur(${values.blur}px);
  -webkit-backdrop-filter: blur(${values.blur}px);
  border-radius: ${values.radius}px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}`;
        return output(css, localized(language, 'كود CSS', 'CSS code'));
    },
});

const CLIP_PATH_SHAPES = {
    triangle: 'polygon(50% 0%, 0% 100%, 100% 100%)',
    trapezoid: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
    pentagon: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
    hexagon: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
    star: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    circle: 'circle(50% at 50% 50%)',
    message: 'polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 75% 100%, 50% 75%, 0% 75%)',
};

const cssClipPathGenerator = tool({
    id: 'css-clip-path-generator',
    icon: 'css',
    category: 'color-css',
    title: { ar: 'مولّد CSS Clip-Path', en: 'CSS Clip-Path Generator' },
    description: {
        ar: 'اختر شكلًا جاهزًا واحصل على كود clip-path لقص أي عنصر بشكل غير مستطيل.',
        en: 'Pick a ready-made shape and get the clip-path CSS to crop any element into a non-rectangular form.',
    },
    note: {
        ar: 'انسخ القيمة والصقها في خاصية clip-path لأي عنصر.',
        en: 'Copy the value into the clip-path property of any element.',
    },
    inputs: [
        selectInput('shape', { ar: 'الشكل', en: 'Shape' }, Object.keys(CLIP_PATH_SHAPES).map((key) => ({
            value: key,
            label: { ar: key, en: key },
        }))),
    ],
    calculate(values, language) {
        const value = CLIP_PATH_SHAPES[values.shape] ?? CLIP_PATH_SHAPES.triangle;
        return output(`clip-path: ${value};`, localized(language, 'كود CSS', 'CSS code'));
    },
});

// --- Image color palette extractor --------------------------------------

function quantizeColor(r, g, b, step) {
    return [Math.round(r / step) * step, Math.round(g / step) * step, Math.round(b / step) * step];
}

function rgbToHex(r, g, b) {
    return `#${[r, g, b].map((v) => Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0')).join('')}`;
}

const imageColorExtractor = tool({
    id: 'image-color-extractor',
    icon: 'palette',
    category: 'color-css',
    title: { ar: 'استخراج لوحة ألوان من صورة', en: 'Image Color Palette Extractor' },
    description: {
        ar: 'ارفع صورة واحصل على أبرز الألوان المستخدمة فيها كأكواد Hex.',
        en: 'Upload an image and get its most prominent colors as hex codes.',
    },
    note: {
        ar: 'يعتمد على تجميع تقريبي للألوان المتشابهة، وليس تحليلًا فنيًا دقيقًا.',
        en: 'Uses approximate color clustering, not precise artistic analysis.',
    },
    inputs: [
        fileInput('image', { ar: 'اختر صورة', en: 'Choose an image' }, 'image/*'),
        numberInput('count', { ar: 'عدد الألوان', en: 'Number of colors' }, 6, 2, 12, 1),
    ],
    async process(values, language) {
        const file = values.image;
        if (!(file instanceof File)) {
            throw new Error(localized(language, 'اختر صورة أولًا.', 'Choose an image first.'));
        }
        const image = await decodeImage(file);
        const canvas = document.createElement('canvas');
        const maxDimension = 200;
        const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const { data } = context.getImageData(0, 0, canvas.width, canvas.height);

        const counts = new Map();
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 128) continue; // skip mostly-transparent pixels
            const [r, g, b] = quantizeColor(data[i], data[i + 1], data[i + 2], 24);
            const key = `${r},${g},${b}`;
            counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, values.count);
        const hexes = sorted.map(([key]) => rgbToHex(...key.split(',').map(Number)));
        return output(hexes.join(', '), localized(language, `أبرز ${hexes.length} ألوان`, `Top ${hexes.length} colors`), hexes.join('\n'));
    },
});

// --- Code to image --------------------------------------------------------

const codeToImage = tool({
    id: 'code-to-image',
    icon: '</>',
    category: 'developer',
    title: { ar: 'تحويل كود إلى صورة', en: 'Code to Image' },
    description: {
        ar: 'حوّل مقطع كود إلى صورة PNG أنيقة جاهزة للمشاركة على السوشيال ميديا.',
        en: 'Turn a code snippet into a polished PNG image ready to share on social media.',
    },
    note: {
        ar: 'تنسيق بصري بسيط بدون تلوين نحوي (syntax highlighting) لكل اللغات.',
        en: 'Simple visual styling without full syntax highlighting for every language.',
    },
    inputs: [
        textInput('code', { ar: 'الكود', en: 'Code' }, 'function greet(name) {\n  return `Hello, ${name}!`;\n}', 10),
        shortTextInput('title', { ar: 'عنوان النافذة (اختياري)', en: 'Window title (optional)' }, 'snippet.js'),
        selectInput('theme', { ar: 'المظهر', en: 'Theme' }, [
            { value: 'dark', label: { ar: 'داكن', en: 'Dark' } },
            { value: 'light', label: { ar: 'فاتح', en: 'Light' } },
        ]),
    ],
    async process(values, language) {
        const lines = values.code.split('\n');
        const fontSize = 16;
        const lineHeight = 24;
        const padding = 32;
        const headerHeight = 48;
        const charWidth = 9.6;
        const longestLine = Math.max(...lines.map((line) => line.length), 10);

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(longestLine * charWidth) + padding * 2;
        canvas.height = headerHeight + lines.length * lineHeight + padding * 2;
        const context = canvas.getContext('2d');

        const isDark = values.theme === 'dark';
        context.fillStyle = isDark ? '#0f172a' : '#f8fafc';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
        context.fillRect(0, 0, canvas.width, headerHeight);
        ['#f87171', '#fbbf24', '#34d399'].forEach((color, index) => {
            context.fillStyle = color;
            context.beginPath();
            context.arc(24 + index * 20, headerHeight / 2, 6, 0, Math.PI * 2);
            context.fill();
        });
        if (values.title) {
            context.fillStyle = isDark ? '#94a3b8' : '#475569';
            context.font = '14px monospace';
            context.textAlign = 'center';
            context.fillText(values.title, canvas.width / 2, headerHeight / 2 + 5);
        }

        context.font = `${fontSize}px monospace`;
        context.textAlign = 'left';
        context.fillStyle = isDark ? '#e2e8f0' : '#0f172a';
        lines.forEach((line, index) => {
            context.fillText(line, padding, headerHeight + padding + index * lineHeight);
        });

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        return fileOutput(blob, 'code-snippet.png', language, 'صورة الكود جاهزة', 'Code image is ready');
    },
});

const roadmapBatch1Definitions = Object.freeze(Object.fromEntries([
    cronExpressionParser,
    jsonSchemaValidator,
    urlSlugGenerator,
    bionicReadingConverter,
    cssLoaderGenerator,
    cssGlassmorphismGenerator,
    cssClipPathGenerator,
    imageColorExtractor,
    codeToImage,
].map((definition) => [definition.id, definition])));

export { roadmapBatch1Definitions };
