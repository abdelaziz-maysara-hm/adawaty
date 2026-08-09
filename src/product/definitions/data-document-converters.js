import { loadSheetJs } from './data-format-tools.js';
import { loadZip } from './image-batch-tools.js';
import { decodeXmlText, extractSlideText, naturalSlideOrder } from './powerpoint-to-pdf-tool.js';
import { loadMammoth } from './word-to-pdf-tools.js';

const MIME = Object.freeze({
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
});

function localized(language, ar, en) { return language === 'ar' ? ar : en; }
function fileInput(id, extension, ar, en) {
    return Object.freeze({ id, type: 'file', accept: `${MIME[extension] ?? 'application/json'},.${extension}`, label: Object.freeze({ ar, en }), unit: Object.freeze({ ar: '', en: '' }) });
}
function assertFile(file, extension, language) {
    if (!(file instanceof File) || !new RegExp(`\\.${extension}$`, 'i').test(file.name)) throw new Error(localized(language, `اختر ملف ${extension.toUpperCase()} صالحًا.`, `Choose a valid ${extension.toUpperCase()} file.`));
}
function baseName(file, extension) { return file.name.replace(new RegExp(`\\.${extension}$`, 'i'), '') || 'converted'; }
function downloadResult(blob, filename, language, arLabel, enLabel, value = '') {
    return { value: value || localized(language, 'جاهز للتنزيل', 'Ready to download'), label: localized(language, arLabel, enLabel), details: `${(blob.size / 1024).toFixed(1)} KB`, download: { blob, filename } };
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => Object.freeze({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function rowsToHtmlTable(rows, title = 'Spreadsheet') {
    const body = rows.map((row, rowIndex) => `<tr>${row.map((cell) => `<${rowIndex === 0 ? 'th' : 'td'}>${escapeHtml(cell)}</${rowIndex === 0 ? 'th' : 'td'}>`).join('')}</tr>`).join('\n');
    return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>body{font:16px Arial,sans-serif;margin:2rem;color:#172033}table{border-collapse:collapse;width:100%}th,td{border:1px solid #cbd5e1;padding:.55rem;text-align:start}th{background:#e2e8f0}</style></head><body><table>\n${body}\n</table></body></html>`;
}

function normalizeJsonData(value) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.entries(value).map(([key, item]) => ({ key, value: typeof item === 'object' ? JSON.stringify(item) : item }));
    throw new Error('JSON root must be an array or object.');
}

function slidesToText(slides) {
    return slides.map((paragraphs, index) => [`--- Slide ${index + 1} ---`, ...paragraphs].join('\n')).join('\n\n');
}

const excelToJson = Object.freeze({
    id: 'excel-to-json-converter', category: 'developer', icon: 'XLS→JSON', action: Object.freeze({ ar: 'حوّل إلى JSON', en: 'Convert to JSON' }),
    title: Object.freeze({ ar: 'تحويل Excel إلى JSON', en: 'Excel to JSON Converter' }),
    description: Object.freeze({ ar: 'حوّل كل أوراق ملف XLSX إلى JSON منظم مع استخدام الصف الأول كأسماء للحقول.', en: 'Convert every XLSX worksheet into structured JSON using the first row as field names.' }),
    note: Object.freeze({ ar: 'تتم المعالجة محليًا؛ الصيغ تُقرأ بقيمها المحسوبة المتاحة.', en: 'Processing is local; formulas use their available calculated values.' }), tags: Object.freeze(['excel', 'xlsx', 'json', 'converter', 'data', 'processing']),
    inputs: Object.freeze([fileInput('excel', 'xlsx', 'اختر ملف Excel ‏(XLSX)', 'Choose an Excel file (XLSX)')]),
    async process(values, language) {
        assertFile(values.excel, 'xlsx', language); const XLSX = await loadSheetJs(); const workbook = XLSX.read(await values.excel.arrayBuffer(), { type: 'array' }); const output = {};
        workbook.SheetNames.forEach((name) => { output[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: null, raw: false }); });
        const text = JSON.stringify(output, null, 2); const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
        return downloadResult(blob, `${baseName(values.excel, 'xlsx')}.json`, language, 'ملف JSON جاهز', 'JSON file is ready', localized(language, `${workbook.SheetNames.length} ورقة`, `${workbook.SheetNames.length} sheets`));
    },
});

const jsonToExcel = Object.freeze({
    id: 'json-to-excel-converter', category: 'converter', icon: 'JSON→XLS', action: Object.freeze({ ar: 'حوّل إلى Excel', en: 'Convert to Excel' }),
    title: Object.freeze({ ar: 'تحويل JSON إلى Excel', en: 'JSON to Excel Converter' }),
    description: Object.freeze({ ar: 'حوّل مصفوفة أو كائن JSON إلى ملف XLSX قابل للفتح والتحرير في Excel.', en: 'Convert a JSON array or object into an editable XLSX spreadsheet.' }),
    note: Object.freeze({ ar: 'تتم المعالجة داخل المتصفح ولا يُرفع ملف JSON.', en: 'Processing happens in your browser and the JSON file is not uploaded.' }), tags: Object.freeze(['json', 'excel', 'xlsx', 'converter', 'data', 'processing']),
    inputs: Object.freeze([fileInput('json', 'json', 'اختر ملف JSON', 'Choose a JSON file')]),
    async process(values, language) {
        assertFile(values.json, 'json', language); let parsed; try { parsed = JSON.parse(await values.json.text()); } catch { throw new Error(localized(language, 'ملف JSON غير صالح.', 'The JSON file is invalid.')); }
        const rows = normalizeJsonData(parsed); const XLSX = await loadSheetJs(); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Data');
        const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }); const blob = new Blob([bytes], { type: MIME.xlsx });
        return downloadResult(blob, `${baseName(values.json, 'json')}.xlsx`, language, 'ملف Excel جاهز', 'Excel file is ready', localized(language, `${rows.length} صفًا`, `${rows.length} rows`));
    },
});

const excelToHtml = Object.freeze({
    id: 'excel-to-html-table', category: 'developer', icon: 'XLS→HTML', action: Object.freeze({ ar: 'حوّل إلى HTML', en: 'Convert to HTML' }),
    title: Object.freeze({ ar: 'تحويل Excel إلى جدول HTML', en: 'Excel to HTML Table' }),
    description: Object.freeze({ ar: 'حوّل أول ورقة في ملف XLSX إلى صفحة HTML متجاوبة تحتوي على جدول منظم.', en: 'Convert the first XLSX worksheet into a responsive HTML page with a clean table.' }),
    note: Object.freeze({ ar: 'يحوّل قيم الخلايا ولا ينقل الرسوم أو تنسيق Excel المتقدم.', en: 'Converts cell values; charts and advanced Excel styling are not copied.' }), tags: Object.freeze(['excel', 'xlsx', 'html', 'table', 'converter', 'developer']),
    inputs: Object.freeze([fileInput('excel', 'xlsx', 'اختر ملف Excel ‏(XLSX)', 'Choose an Excel file (XLSX)')]),
    async process(values, language) {
        assertFile(values.excel, 'xlsx', language); const XLSX = await loadSheetJs(); const workbook = XLSX.read(await values.excel.arrayBuffer(), { type: 'array' }); const name = workbook.SheetNames[0];
        if (!name) throw new Error(localized(language, 'ملف Excel لا يحتوي على أوراق.', 'The workbook contains no worksheets.'));
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, raw: false, defval: '' }); const html = rowsToHtmlTable(rows, name); const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        return downloadResult(blob, `${baseName(values.excel, 'xlsx')}.html`, language, 'صفحة HTML جاهزة', 'HTML page is ready', localized(language, `${rows.length} صفًا`, `${rows.length} rows`));
    },
});

const wordToHtml = Object.freeze({
    id: 'word-to-html-converter', category: 'converter', icon: 'DOC→HTML', action: Object.freeze({ ar: 'حوّل إلى HTML', en: 'Convert to HTML' }),
    title: Object.freeze({ ar: 'تحويل Word إلى HTML', en: 'Word to HTML Converter' }),
    description: Object.freeze({ ar: 'حوّل ملف DOCX إلى صفحة HTML نظيفة مع العناوين والفقرات والقوائم والجداول والصور المدعومة.', en: 'Convert a DOCX file into clean HTML with supported headings, paragraphs, lists, tables and images.' }),
    note: Object.freeze({ ar: 'تتم المعالجة محليًا. قد تُبسّط بعض تنسيقات Word المتقدمة.', en: 'Processing is local. Some advanced Word formatting may be simplified.' }), tags: Object.freeze(['word', 'docx', 'html', 'converter', 'document', 'processing']),
    inputs: Object.freeze([fileInput('word', 'docx', 'اختر ملف Word ‏(DOCX)', 'Choose a Word file (DOCX)')]),
    async process(values, language) {
        assertFile(values.word, 'docx', language); const mammoth = await loadMammoth(); const result = await mammoth.convertToHtml({ arrayBuffer: await values.word.arrayBuffer() });
        const html = `<!doctype html>\n<html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(baseName(values.word, 'docx'))}</title><style>body{max-width:850px;margin:2rem auto;padding:0 1rem;font:17px/1.7 Arial,sans-serif;color:#172033}img{max-width:100%;height:auto}table{border-collapse:collapse}td,th{border:1px solid #cbd5e1;padding:.5rem}</style></head><body>${result.value}</body></html>`;
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' }); return downloadResult(blob, `${baseName(values.word, 'docx')}.html`, language, 'صفحة HTML جاهزة', 'HTML page is ready');
    },
});

const powerpointToText = Object.freeze({
    id: 'powerpoint-to-txt-converter', category: 'text', icon: 'PPT→TXT', action: Object.freeze({ ar: 'استخرج النص', en: 'Extract text' }),
    title: Object.freeze({ ar: 'تحويل PowerPoint إلى TXT', en: 'PowerPoint to TXT Converter' }),
    description: Object.freeze({ ar: 'استخرج نصوص شرائح PPTX بالترتيب مع فاصل واضح لكل شريحة وحمّلها كملف TXT.', en: 'Extract PPTX slide text in order with a clear separator for every slide and download it as TXT.' }),
    note: Object.freeze({ ar: 'لا يشمل النص الموجود داخل الصور أو الفيديو.', en: 'Text contained inside images or video is not included.' }), tags: Object.freeze(['powerpoint', 'pptx', 'txt', 'text extraction', 'converter', 'processing']),
    inputs: Object.freeze([fileInput('powerpoint', 'pptx', 'اختر ملف PowerPoint ‏(PPTX)', 'Choose a PowerPoint file (PPTX)')]),
    async process(values, language) {
        assertFile(values.powerpoint, 'pptx', language); const JSZip = await loadZip(); const zip = await JSZip.loadAsync(await values.powerpoint.arrayBuffer()); const paths = Object.keys(zip.files).filter((path) => /^ppt\/slides\/slide\d+\.xml$/i.test(path)).sort(naturalSlideOrder);
        const slides = []; for (const path of paths) slides.push(extractSlideText(await zip.file(path).async('text'))); const text = slidesToText(slides); if (!text) throw new Error(localized(language, 'لم يتم العثور على نص.', 'No text was found.'));
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' }); return downloadResult(blob, `${baseName(values.powerpoint, 'pptx')}.txt`, language, 'ملف TXT جاهز', 'TXT file is ready', localized(language, `${slides.length} شريحة`, `${slides.length} slides`));
    },
});

const dataDocumentConverterDefinitions = Object.freeze({ [excelToJson.id]: excelToJson, [jsonToExcel.id]: jsonToExcel, [excelToHtml.id]: excelToHtml, [wordToHtml.id]: wordToHtml, [powerpointToText.id]: powerpointToText });

export { dataDocumentConverterDefinitions, normalizeJsonData, rowsToHtmlTable, slidesToText };

// END OF FILE
