import { canvasToBlob, decodeImage } from '../image-processing.js';
import {
    assertPdfFile,
    createPdfBlob,
    loadPdfJs,
    loadPdfLib,
} from '../pdf-processing.js';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
}

function shortTextInput(id, label, placeholder) {
    return Object.freeze({
        id, type: 'text',
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function textInput(id, label, placeholder, rows = 4) {
    return Object.freeze({
        id, type: 'textarea', rows,
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

function pdfInput() {
    return fileInput('pdf', { ar: 'اختر ملف PDF', en: 'Choose a PDF file' }, 'application/pdf,.pdf');
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
        category: config.category ?? 'pdf',
        icon: config.icon,
        title: Object.freeze(config.title),
        description: Object.freeze(config.description),
        note: Object.freeze(config.note),
        inputs: Object.freeze(config.inputs),
        calculate: config.calculate,
        process: config.process,
    });
}

// --- PDF page crop --------------------------------------------------------

const pdfPageCrop = tool({
    id: 'pdf-page-crop',
    icon: 'PDF✂',
    title: { ar: 'قص هوامش صفحات PDF', en: 'Crop PDF Page Margins' },
    description: {
        ar: 'أزل الهوامش الزائدة من كل صفحات ملف PDF بنسبة مئوية موحدة.',
        en: 'Trim excess margins from every page of a PDF by a uniform percentage.',
    },
    note: {
        ar: 'القص شكلي (crop box) ولا يعيد ترتيب المحتوى؛ نسبة قص عالية جدًا قد تحذف جزءًا من النص.',
        en: 'This adjusts the visible crop box; it does not reflow content. A very high percentage may cut off part of the text.',
    },
    inputs: [
        pdfInput(),
        numberInput('percent', { ar: 'نسبة القص من كل جانب (%)', en: 'Crop percent per side (%)' }, 5, 0, 40, 1),
    ],
    async process(values, language) {
        assertPdfFile(values.pdf);
        const { PDFDocument } = await loadPdfLib();
        const document = await PDFDocument.load(await values.pdf.arrayBuffer());
        const fraction = values.percent / 100;
        for (const page of document.getPages()) {
            const { width, height } = page.getSize();
            const marginX = width * fraction;
            const marginY = height * fraction;
            page.setCropBox(marginX, marginY, width - marginX * 2, height - marginY * 2);
        }
        const blob = createPdfBlob(await document.save());
        const base = values.pdf.name.replace(/\.pdf$/i, '') || 'document';
        return fileOutput(blob, `${base}-cropped.pdf`, language, 'تم قص الهوامش', 'Margins cropped');
    },
});

// --- PDF blank page remover -----------------------------------------------

const pdfBlankPageRemover = tool({
    id: 'pdf-blank-page-remover',
    icon: 'PDF∅',
    title: { ar: 'حذف الصفحات الفارغة من PDF', en: 'Remove Blank Pages from PDF' },
    description: {
        ar: 'اكتشف واحذف الصفحات الفارغة أو شبه الفارغة تلقائيًا من ملف PDF.',
        en: 'Automatically detect and remove blank or near-blank pages from a PDF.',
    },
    note: {
        ar: 'الاكتشاف يعتمد على تحليل نسبة البكسلات الفاتحة في كل صفحة، وقد لا يكتشف صفحات فيها علامة مائية باهتة جدًا كفراغ.',
        en: 'Detection is based on the ratio of light pixels per page; pages with a very faint watermark may not be flagged as blank.',
    },
    inputs: [pdfInput()],
    async process(values, language) {
        assertPdfFile(values.pdf);
        const bytes = new Uint8Array(await values.pdf.arrayBuffer());
        const pdfjs = await loadPdfJs();
        const sourceDoc = await pdfjs.getDocument({ data: bytes }).promise;

        const blankPageIndices = [];
        for (let pageNumber = 1; pageNumber <= sourceDoc.numPages; pageNumber += 1) {
            const page = await sourceDoc.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 0.3 });
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.ceil(viewport.width));
            canvas.height = Math.max(1, Math.ceil(viewport.height));
            const context = canvas.getContext('2d', { alpha: false });
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: context, viewport }).promise;
            const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
            let darkPixels = 0;
            for (let i = 0; i < data.length; i += 4) {
                const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
                if (brightness < 245) darkPixels += 1;
            }
            const darkRatio = darkPixels / (data.length / 4);
            if (darkRatio < 0.002) blankPageIndices.push(pageNumber - 1);
            page.cleanup();
        }
        await sourceDoc.destroy();

        if (blankPageIndices.length === sourceDoc?.numPages) {
            throw new Error(localized(language, 'كل الصفحات اعتُبرت فارغة، لم يتم حذف شيء.', 'Every page looked blank, nothing was removed.'));
        }

        const { PDFDocument } = await loadPdfLib();
        const source = await PDFDocument.load(bytes);
        const output2 = await PDFDocument.create();
        const keepIndices = source.getPageIndices().filter((index) => !blankPageIndices.includes(index));
        const copied = await output2.copyPages(source, keepIndices);
        copied.forEach((page) => output2.addPage(page));

        const blob = createPdfBlob(await output2.save());
        const base = values.pdf.name.replace(/\.pdf$/i, '') || 'document';
        return fileOutput(
            blob,
            `${base}-no-blanks.pdf`,
            language,
            localized(language, `تم حذف ${blankPageIndices.length} صفحة فارغة`, `Removed ${blankPageIndices.length} blank page(s)`),
            localized(language, `تم حذف ${blankPageIndices.length} صفحة فارغة`, `Removed ${blankPageIndices.length} blank page(s)`),
        );
    },
});

// --- PDF "scanned look" ----------------------------------------------------

const pdfScannedLook = tool({
    id: 'pdf-scanned-look',
    icon: 'PDF≈',
    title: { ar: 'محاكاة مظهر PDF ممسوح ضوئيًا', en: 'Make PDF Look Scanned' },
    description: {
        ar: 'حوّل ملف PDF رقمي إلى مظهر يشبه المستندات الممسوحة ضوئيًا (ميل بسيط، تباين، تحبب خفيف).',
        en: 'Give a digital PDF the look of a scanned document (slight skew, contrast, light grain).',
    },
    note: {
        ar: 'كل صفحة تتحول لصورة، فيفقد النص القابل للتحديد — هذا التأثير مقصود لمحاكاة المسح الضوئي.',
        en: 'Every page becomes an image, so selectable text is lost — that is intentional for the scanned effect.',
    },
    inputs: [
        pdfInput(),
        numberInput('skew', { ar: 'أقصى درجة ميل', en: 'Max skew (degrees)' }, 1.2, 0, 5, 0.1),
        numberInput('grain', { ar: 'شدة التحبب (%)', en: 'Grain intensity (%)' }, 8, 0, 30, 1),
    ],
    async process(values, language) {
        assertPdfFile(values.pdf);
        const bytes = new Uint8Array(await values.pdf.arrayBuffer());
        const pdfjs = await loadPdfJs();
        const sourceDoc = await pdfjs.getDocument({ data: bytes }).promise;
        const { PDFDocument } = await loadPdfLib();
        const output2 = await PDFDocument.create();

        for (let pageNumber = 1; pageNumber <= sourceDoc.numPages; pageNumber += 1) {
            const page = await sourceDoc.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 2 });
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            const context = canvas.getContext('2d', { alpha: false });
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);

            const angle = (Math.random() * 2 - 1) * values.skew * (Math.PI / 180);
            context.translate(canvas.width / 2, canvas.height / 2);
            context.rotate(angle);
            context.translate(-canvas.width / 2, -canvas.height / 2);
            await page.render({ canvasContext: context, viewport }).promise;
            context.setTransform(1, 0, 0, 1, 0, 0);

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const { data } = imageData;
            const grainStrength = (values.grain / 100) * 40;
            for (let i = 0; i < data.length; i += 4) {
                const gray = data[i] * 0.34 + data[i + 1] * 0.5 + data[i + 2] * 0.16;
                const contrasted = Math.min(255, Math.max(0, (gray - 128) * 1.15 + 128));
                const noise = (Math.random() - 0.5) * grainStrength;
                const value = Math.min(255, Math.max(0, contrasted + noise));
                data[i] = value; data[i + 1] = value; data[i + 2] = value;
            }
            context.putImageData(imageData, 0, 0);

            const blob = await canvasToBlob(canvas, 'image/jpeg', 0.82);
            const jpgBytes = new Uint8Array(await blob.arrayBuffer());
            const jpgImage = await output2.embedJpg(jpgBytes);
            const outPage = output2.addPage([canvas.width, canvas.height]);
            outPage.drawImage(jpgImage, { x: 0, y: 0, width: canvas.width, height: canvas.height });
            page.cleanup();
        }
        await sourceDoc.destroy();

        const blob = createPdfBlob(await output2.save());
        const base = values.pdf.name.replace(/\.pdf$/i, '') || 'document';
        return fileOutput(blob, `${base}-scanned.pdf`, language, 'تم محاكاة المسح الضوئي', 'Scanned look applied');
    },
});

// --- SVG blob generator ------------------------------------------------

function randomBlobPath(points, size, irregularity, seedRandom) {
    const angleStep = (Math.PI * 2) / points;
    const coords = [];
    for (let i = 0; i < points; i += 1) {
        const angle = i * angleStep;
        const radius = size * (1 - irregularity / 2 + seedRandom() * irregularity);
        coords.push([size + Math.cos(angle) * radius, size + Math.sin(angle) * radius]);
    }
    let path = `M ${coords[0][0]},${coords[0][1]} `;
    for (let i = 0; i < points; i += 1) {
        const [x0, y0] = coords[i];
        const [x1, y1] = coords[(i + 1) % points];
        const midX = (x0 + x1) / 2;
        const midY = (y0 + y1) / 2;
        path += `Q ${x0},${y0} ${midX},${midY} `;
    }
    return `${path}Z`;
}

function mulberry32(seed) {
    let a = seed;
    return function random() {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const svgBlobGenerator = tool({
    id: 'svg-blob-generator',
    icon: 'blob',
    category: 'color-css',
    title: { ar: 'مولّد أشكال Blob بصيغة SVG', en: 'SVG Blob Generator' },
    description: {
        ar: 'أنشئ شكل blob عضويًا عشوائيًا بصيغة SVG جاهز للاستخدام كخلفية أو زخرفة.',
        en: 'Generate a random organic blob shape as SVG, ready to use as a background or decoration.',
    },
    note: {
        ar: 'كل تنفيذ بنفس البذرة (seed) ينتج نفس الشكل تمامًا؛ غيّر البذرة للحصول على شكل مختلف.',
        en: 'The same seed always produces the same shape; change the seed for a different one.',
    },
    inputs: [
        shortTextInput('color', { ar: 'اللون', en: 'Color' }, '#8B5CF6'),
        numberInput('points', { ar: 'عدد النقاط', en: 'Points' }, 6, 3, 12, 1),
        numberInput('irregularity', { ar: 'درجة عدم الانتظام (0-1)', en: 'Irregularity (0-1)' }, 0.4, 0.05, 1, 0.05),
        numberInput('seed', { ar: 'البذرة (Seed)', en: 'Seed' }, 1, 1, 99999, 1),
    ],
    calculate(values, language) {
        const size = 100;
        const random = mulberry32(Math.round(values.seed));
        const path = randomBlobPath(Math.round(values.points), size, values.irregularity, random);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size * 2} ${size * 2}"><path fill="${values.color}" d="${path}"/></svg>`;
        return output(svg, localized(language, 'كود SVG', 'SVG code'));
    },
});

// --- SVG pattern generator ------------------------------------------------

const PATTERN_BUILDERS = {
    dots: (color, gap, size) => `<pattern id="p" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse"><circle cx="${gap / 2}" cy="${gap / 2}" r="${size}" fill="${color}"/></pattern>`,
    grid: (color, gap, size) => `<pattern id="p" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse"><path d="M ${gap} 0 L 0 0 0 ${gap}" fill="none" stroke="${color}" stroke-width="${size}"/></pattern>`,
    diagonal: (color, gap, size) => `<pattern id="p" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="${gap}" stroke="${color}" stroke-width="${size}"/></pattern>`,
    crosses: (color, gap, size) => `<pattern id="p" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse"><path d="M ${gap / 2 - size} ${gap / 2} h ${size * 2} M ${gap / 2} ${gap / 2 - size} v ${size * 2}" stroke="${color}" stroke-width="${Math.max(1, size / 3)}"/></pattern>`,
};

const svgPatternGenerator = tool({
    id: 'svg-pattern-generator',
    icon: 'pattern',
    category: 'color-css',
    title: { ar: 'مولّد أنماط SVG متكررة', en: 'SVG Pattern Generator' },
    description: {
        ar: 'أنشئ نمط خلفية متكرر (نقاط، شبكة، خطوط) بصيغة SVG جاهز للاستخدام في CSS أو HTML.',
        en: 'Generate a repeating background pattern (dots, grid, lines) as SVG, ready for CSS or HTML.',
    },
    note: {
        ar: 'استخدم الناتج كخلفية عبر background-image: url("data:image/svg+xml,...")، أو ضَمِّنه مباشرة في HTML.',
        en: 'Use the output as a background via background-image: url("data:image/svg+xml,..."), or embed it directly in HTML.',
    },
    inputs: [
        selectInput('style', { ar: 'النمط', en: 'Pattern' }, [
            { value: 'dots', label: { ar: 'نقاط', en: 'Dots' } },
            { value: 'grid', label: { ar: 'شبكة', en: 'Grid' } },
            { value: 'diagonal', label: { ar: 'خطوط مائلة', en: 'Diagonal lines' } },
            { value: 'crosses', label: { ar: 'علامات +', en: 'Crosses' } },
        ]),
        shortTextInput('color', { ar: 'اللون', en: 'Color' }, '#06B6D4'),
        numberInput('gap', { ar: 'المسافة بين العناصر', en: 'Spacing' }, 24, 8, 100, 1),
        numberInput('size', { ar: 'حجم العنصر', en: 'Element size' }, 2, 1, 20, 0.5),
    ],
    calculate(values, language) {
        const builder = PATTERN_BUILDERS[values.style] ?? PATTERN_BUILDERS.dots;
        const definition = builder(values.color, values.gap, values.size);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="200"><defs>${definition}</defs><rect width="100%" height="100%" fill="url(#p)"/></svg>`;
        return output(svg, localized(language, 'كود SVG', 'SVG code'));
    },
});

// --- Text to handwriting ----------------------------------------------

const text2handwriting = tool({
    id: 'text-to-handwriting',
    icon: 'sign',
    category: 'text',
    title: { ar: 'تحويل نص إلى خط يد', en: 'Text to Handwriting' },
    description: {
        ar: 'حوّل نصًا مكتوبًا إلى صورة تحاكي الخط اليدوي على ورقة.',
        en: 'Turn typed text into an image that mimics handwriting on paper.',
    },
    note: {
        ar: 'يعتمد على خط كتابة يدوية مدمج في المتصفح؛ الشكل تقريبي وليس بديلاً عن التوقيع الحقيقي.',
        en: 'Uses a cursive font available in the browser; the look is approximate, not a substitute for a real signature.',
    },
    inputs: [
        textInput('text', { ar: 'النص', en: 'Text' }, { ar: 'مرحبًا بكم في أدواتي!', en: 'Hello from Adawaty!' }, 6),
        selectInput('paper', { ar: 'نوع الورق', en: 'Paper style' }, [
            { value: 'lined', label: { ar: 'مسطر', en: 'Lined' } },
            { value: 'plain', label: { ar: 'سادة', en: 'Plain' } },
        ]),
    ],
    async process(values, language) {
        const lines = values.text.split('\n');
        const lineHeight = 44;
        const padding = 48;
        const width = 800;
        const height = padding * 2 + lines.length * lineHeight;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.fillStyle = '#fffdf7';
        context.fillRect(0, 0, width, height);

        if (values.paper === 'lined') {
            context.strokeStyle = 'rgba(59, 130, 246, 0.25)';
            context.lineWidth = 1;
            for (let y = padding + lineHeight; y < height; y += lineHeight) {
                context.beginPath();
                context.moveTo(padding / 2, y);
                context.lineTo(width - padding / 2, y);
                context.stroke();
            }
        }

        context.fillStyle = '#1e3a8a';
        context.font = '30px "Comic Sans MS", "Segoe Print", cursive';
        context.textBaseline = 'alphabetic';
        lines.forEach((line, index) => {
            context.fillText(line, padding, padding + (index + 1) * lineHeight - 12);
        });

        const blob = await canvasToBlob(canvas, 'image/png');
        return fileOutput(blob, 'handwriting.png', language, 'صورة الخط اليدوي جاهزة', 'Handwriting image is ready');
    },
});

// --- Photo censor (whole-image blur/pixelate) ---------------------------

const photoCensor = tool({
    id: 'photo-censor',
    icon: 'blur',
    category: 'image',
    title: { ar: 'تمويه/تعتيم الصورة', en: 'Photo Blur / Pixelate' },
    description: {
        ar: 'طبّق تأثير تمويه أو تربيع (بكسلة) على الصورة كاملة لإخفاء التفاصيل.',
        en: 'Apply a blur or pixelate effect across the whole image to hide details.',
    },
    note: {
        ar: 'يؤثر التأثير على الصورة كاملة، وليس على منطقة محددة فقط.',
        en: 'The effect applies to the entire image, not just a selected region.',
    },
    inputs: [
        fileInput('image', { ar: 'اختر صورة', en: 'Choose an image' }, 'image/*'),
        selectInput('mode', { ar: 'نوع التأثير', en: 'Effect' }, [
            { value: 'blur', label: { ar: 'تمويه', en: 'Blur' } },
            { value: 'pixelate', label: { ar: 'بكسلة', en: 'Pixelate' } },
        ]),
        numberInput('strength', { ar: 'شدة التأثير', en: 'Strength' }, 12, 2, 40, 1),
    ],
    async process(values, language) {
        const file = values.image;
        if (!(file instanceof File)) {
            throw new Error(localized(language, 'اختر صورة أولًا.', 'Choose an image first.'));
        }
        const image = await decodeImage(file);
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');

        if (values.mode === 'blur') {
            context.filter = `blur(${values.strength}px)`;
            context.drawImage(image, 0, 0);
        } else {
            const blockSize = Math.max(2, Math.round(values.strength));
            const smallWidth = Math.max(1, Math.round(canvas.width / blockSize));
            const smallHeight = Math.max(1, Math.round(canvas.height / blockSize));
            const smallCanvas = document.createElement('canvas');
            smallCanvas.width = smallWidth;
            smallCanvas.height = smallHeight;
            const smallContext = smallCanvas.getContext('2d');
            smallContext.drawImage(image, 0, 0, smallWidth, smallHeight);
            context.imageSmoothingEnabled = false;
            context.drawImage(smallCanvas, 0, 0, smallWidth, smallHeight, 0, 0, canvas.width, canvas.height);
        }

        const blob = await canvasToBlob(canvas, 'image/png');
        const base = file.name.replace(/\.[^.]+$/, '') || 'image';
        return fileOutput(blob, `${base}-censored.png`, language, 'الصورة جاهزة', 'Image is ready');
    },
});

const roadmapBatch2Definitions = Object.freeze(Object.fromEntries([
    pdfPageCrop,
    pdfBlankPageRemover,
    pdfScannedLook,
    svgBlobGenerator,
    svgPatternGenerator,
    text2handwriting,
    photoCensor,
].map((definition) => [definition.id, definition])));

export { roadmapBatch2Definitions };
