import { loadZip } from './image-batch-tools.js';
import {
    compressImageEntry,
    compressionSettings,
    mediaMime,
} from './powerpoint-compressor-tool.js';

const WORD_ACCEPT = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function isWordMediaPath(path) {
    return /^word\/media\//i.test(String(path));
}

const wordCompressor = Object.freeze({
    id: 'word-compressor',
    category: 'converter',
    icon: 'DOC↓',
    action: Object.freeze({ ar: 'اضغط المستند', en: 'Compress document' }),
    title: Object.freeze({ ar: 'ضغط ملف Word', en: 'Compress Word Document' }),
    description: Object.freeze({
        ar: 'قلّل حجم ملف DOCX عبر ضغط الصور الكبيرة وإعادة ضغط حزمة المستند، مع الحفاظ على النصوص والصفحات محليًا.',
        en: 'Reduce a DOCX file size by recompressing large images and the document package while preserving text and pages locally.',
    }),
    note: Object.freeze({
        ar: 'يدعم DOCX ولا يرفع الملف. تبقى النصوص والتنسيقات كما هي؛ الضغط القوي قد يقلل تفاصيل الصور داخل المستند.',
        en: 'Supports DOCX and never uploads it. Text and formatting stay intact; strong compression can reduce image detail.',
    }),
    tags: Object.freeze(['word', 'docx', 'compress', 'reduce size', 'document', 'office', 'processing']),
    inputs: Object.freeze([
        Object.freeze({
            id: 'word',
            type: 'file',
            accept: WORD_ACCEPT,
            label: Object.freeze({ ar: 'اختر ملف Word ‏(DOCX)', en: 'Choose a Word file (DOCX)' }),
            unit: Object.freeze({ ar: '', en: '' }),
        }),
        Object.freeze({
            id: 'level',
            type: 'select',
            label: Object.freeze({ ar: 'مستوى الضغط', en: 'Compression level' }),
            unit: Object.freeze({ ar: '', en: '' }),
            defaultValue: 'balanced',
            options: Object.freeze([
                Object.freeze({ value: 'light', label: Object.freeze({ ar: 'خفيف — جودة أعلى', en: 'Light — higher quality' }) }),
                Object.freeze({ value: 'balanced', label: Object.freeze({ ar: 'متوازن', en: 'Balanced' }) }),
                Object.freeze({ value: 'strong', label: Object.freeze({ ar: 'قوي — حجم أصغر', en: 'Strong — smaller file' }) }),
            ]),
        }),
    ]),
    async process(values, language) {
        if (!(values.word instanceof File) || !/\.docx$/i.test(values.word.name)) {
            throw new Error(localized(language, 'اختر ملف DOCX صالحًا.', 'Choose a valid DOCX file.'));
        }
        try {
            const JSZip = await loadZip();
            const zip = await JSZip.loadAsync(await values.word.arrayBuffer());
            if (!zip.file('word/document.xml')) throw new Error('Missing Word document structure.');
            const settings = compressionSettings(values.level);
            const mediaEntries = Object.values(zip.files).filter(
                (entry) => !entry.dir && isWordMediaPath(entry.name) && mediaMime(entry.name),
            );
            let changedImages = 0;

            for (const entry of mediaEntries) {
                const compressed = await compressImageEntry(entry, mediaMime(entry.name), settings);
                if (compressed) {
                    zip.file(entry.name, compressed, { binary: true });
                    changedImages += 1;
                }
            }

            const output = await zip.generateAsync({
                type: 'blob',
                mimeType: DOCX_MIME,
                compression: 'DEFLATE',
                compressionOptions: { level: values.level === 'strong' ? 9 : 7 },
            });
            const saved = Math.max(0, values.word.size - output.size);
            const reduction = values.word.size ? (saved / values.word.size) * 100 : 0;
            const baseName = values.word.name.replace(/\.docx$/i, '') || 'document';
            return {
                value: saved > 0
                    ? localized(language, `أصغر بنسبة ${reduction.toFixed(1)}%`, `${reduction.toFixed(1)}% smaller`)
                    : localized(language, 'الحجم محسّن بالفعل', 'Already size-optimized'),
                label: localized(language, 'ملف Word المضغوط جاهز', 'Compressed Word document is ready'),
                details: localized(
                    language,
                    `${changedImages} صورة ضُغطت · الحجم الجديد ${(output.size / 1024).toFixed(1)} KB`,
                    `${changedImages} images recompressed · new size ${(output.size / 1024).toFixed(1)} KB`,
                ),
                download: { blob: output, filename: `${baseName}-compressed.docx` },
            };
        } catch (error) {
            throw new Error(localized(
                language,
                'تعذّر ضغط المستند. جرّب ملف DOCX صالحًا وغير محمي.',
                'Unable to compress the document. Try a valid, unprotected DOCX file.',
            ), { cause: error });
        }
    },
});

const wordCompressorToolDefinitions = Object.freeze({
    [wordCompressor.id]: wordCompressor,
});

export { isWordMediaPath, wordCompressorToolDefinitions };

// END OF FILE
