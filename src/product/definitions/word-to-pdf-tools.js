import { createPdfBlob } from '../pdf-processing.js';
import { wordToPdf } from '../word-to-pdf-engine.js';

const MAMMOTH_URL = 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js';
let mammothPromise;

function loadMammoth() {
    mammothPromise ??= import(MAMMOTH_URL).then(() => window.mammoth);
    return mammothPromise;
}

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
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

const wordToPdfConverter = Object.freeze({
    id: 'word-to-pdf-converter',
    category: 'pdf',
    icon: 'DOCX→PDF',
    action: Object.freeze({ ar: 'حوّل إلى PDF', en: 'Convert to PDF' }),
    title: Object.freeze({ ar: 'تحويل Word إلى PDF', en: 'Word to PDF Converter' }),
    description: Object.freeze({
        ar: 'حوّل مستند Word (.docx) إلى PDF بنفس شكله: العناوين والخطوط والأحجام والعريض والمائل والقوائم المرقّمة والنقطية والجداول والصور وعدد الصفحات، بالعربي والإنجليزي.',
        en: 'Convert a Word (.docx) document into a PDF that looks like the original: headings, fonts, sizes, bold/italic, bulleted and numbered lists, tables, images and multiple pages, in English and Arabic.',
    }),
    note: Object.freeze({
        ar: 'يتم التحويل بالكامل داخل متصفحك. كل صفحة تُحفظ كصورة عالية الدقة مع طبقة نص مخفية، فيمكن البحث في النص ونسخه لكن لا يمكن تعديله كنص. الرأس والتذييل يتكرران في كل صفحة، لكن أرقام الصفحات التلقائية والتعليقات وتتبّع التغييرات ومربعات النص المعقدة غير مدعومة. ملفات ‎.doc القديمة غير مدعومة؛ احفظها كـ ‎.docx أولًا.',
        en: 'Conversion runs entirely in your browser. Each page is saved as a high-resolution image with a hidden text layer, so the text can be searched and copied but not edited as text. Headers and footers are repeated on every page, but automatic page numbers, comments, tracked changes and complex text boxes are not supported. Old .doc files are not supported; save them as .docx first.',
    }),
    faq: Object.freeze([
        Object.freeze({
            questionAr: 'ما الذي يُحفظ في ملف PDF الناتج، وما حدوده؟',
            questionEn: 'What is kept in the PDF, and what are the limits?',
            answerAr: 'تُحفظ العناوين والخطوط والأحجام والعريض والمائل والتسطير والقوائم المرقّمة والنقطية والجداول والصور واتجاه النص العربي (من اليمين لليسار). كل صفحة تُحفظ كصورة مع طبقة نص مخفية للبحث والنسخ، لذلك لا يمكن تعديل النص داخل PDF. أرقام الصفحات التلقائية والتعليقات وتتبّع التغييرات غير مدعومة، وقد تختلف نقاط فواصل الصفحات قليلًا عن Word.',
            answerEn: 'Headings, fonts, sizes, bold, italic, underline, bulleted and numbered lists, tables, images and right-to-left Arabic text are kept. Each page is stored as an image with a hidden text layer for search and copy, so the text cannot be edited inside the PDF. Automatic page numbers, comments and tracked changes are not supported, and page breaks may fall slightly differently than in Word.',
        }),
    ]),
    inputs: Object.freeze([
        fileInput('docx', { ar: 'اختر ملف Word (.docx)', en: 'Choose a Word file (.docx)' }, '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
    ]),
    async process(values, language) {
        const file = values.docx;
        if (!(file instanceof File)) {
            throw new Error(localized(language, 'اختر ملف Word أولًا.', 'Choose a Word file first.'));
        }

        if (!/\.docx$/i.test(file.name) && file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            throw new Error(localized(language, 'هذا الملف ليس بصيغة ‎.docx. احفظه من Word كـ ‎.docx ثم جرّب مرة أخرى.', 'This is not a .docx file. Save it from Word as .docx and try again.'));
        }
        let result;
        try {
            result = await wordToPdf(await file.arrayBuffer());
        } catch (error) {
            console.error(error);
            throw new Error(localized(language, 'تعذّر قراءة هذا المستند. تأكد أنه ملف Word ‎.docx سليم وغير محمي بكلمة مرور.', 'This document could not be read. Make sure it is a valid, non-password-protected Word .docx file.'));
        }
        const blob = createPdfBlob(result.bytes);
        const base = file.name.replace(/\.docx$/i, '') || 'document';
        return fileOutput(blob, `${base}.pdf`, language, 'ملف PDF جاهز', 'PDF file is ready');
    },
});

const wordToPdfDefinitions = Object.freeze({ [wordToPdfConverter.id]: wordToPdfConverter });

export { loadMammoth, wordToPdfDefinitions };
