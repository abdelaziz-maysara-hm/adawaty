import { canvasToBlob } from '../image-processing.js';
import { createPdfBlob, loadPdfLib } from '../pdf-processing.js';
import { loadSheetJs } from './data-format-tools.js';

const EXCEL_ACCEPT = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,.xlsx,.xls';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function paginateSheet(rows, rowsPerPage = 18, columnsPerPage = 8) {
    if (rows.length === 0) return [];
    const columnCount = Math.max(1, ...rows.map((row) => row.length));
    const header = rows[0];
    const body = rows.slice(1);
    const pages = [];

    for (let columnStart = 0; columnStart < columnCount; columnStart += columnsPerPage) {
        const columnEnd = Math.min(columnCount, columnStart + columnsPerPage);
        if (body.length === 0) {
            pages.push([header.slice(columnStart, columnEnd)]);
            continue;
        }
        for (let rowStart = 0; rowStart < body.length; rowStart += rowsPerPage) {
            pages.push([
                header.slice(columnStart, columnEnd),
                ...body.slice(rowStart, rowStart + rowsPerPage)
                    .map((row) => row.slice(columnStart, columnEnd)),
            ]);
        }
    }
    return pages;
}

function shortenCell(value, limit = 42) {
    const text = String(value ?? '').replace(/\s+/g, ' ').trim();
    return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

async function renderTablePage(rows, sheetName, pageNumber, language) {
    const width = 1400;
    const height = 990;
    const margin = 48;
    const headingHeight = 72;
    const footerHeight = 38;
    const tableHeight = height - (margin * 2) - headingHeight - footerHeight;
    const rowHeight = tableHeight / Math.max(1, rows.length);
    const columnCount = Math.max(1, ...rows.map((row) => row.length));
    const columnWidth = (width - (margin * 2)) / columnCount;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas rendering is unavailable.');

    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#0F172A';
    context.font = '700 30px Arial, sans-serif';
    context.textAlign = language === 'ar' ? 'right' : 'left';
    context.direction = language === 'ar' ? 'rtl' : 'ltr';
    context.fillText(sheetName, language === 'ar' ? width - margin : margin, margin + 30);

    const top = margin + headingHeight;
    rows.forEach((row, rowIndex) => {
        const y = top + (rowIndex * rowHeight);
        row.forEach((value, columnIndex) => {
            const x = margin + (columnIndex * columnWidth);
            context.fillStyle = rowIndex === 0 ? '#E2E8F0' : rowIndex % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
            context.fillRect(x, y, columnWidth, rowHeight);
            context.strokeStyle = '#CBD5E1';
            context.lineWidth = 1;
            context.strokeRect(x, y, columnWidth, rowHeight);
            context.fillStyle = '#0F172A';
            context.font = `${rowIndex === 0 ? '700' : '400'} ${Math.max(14, Math.min(22, rowHeight * 0.4))}px Arial, sans-serif`;
            context.textBaseline = 'middle';
            context.textAlign = language === 'ar' ? 'right' : 'left';
            const textX = language === 'ar' ? x + columnWidth - 10 : x + 10;
            context.save();
            context.beginPath();
            context.rect(x + 5, y + 2, columnWidth - 10, rowHeight - 4);
            context.clip();
            context.fillText(shortenCell(value), textX, y + (rowHeight / 2));
            context.restore();
        });
    });

    context.fillStyle = '#64748B';
    context.font = '400 16px Arial, sans-serif';
    context.textAlign = 'center';
    context.fillText(
        localized(language, `صفحة ${pageNumber}`, `Page ${pageNumber}`),
        width / 2,
        height - margin + 12,
    );
    return canvasToBlob(canvas, 'image/png');
}

const excelToPdf = Object.freeze({
    id: 'excel-to-pdf-converter',
    category: 'pdf',
    icon: 'XLS→PDF',
    action: Object.freeze({ ar: 'حوّل إلى PDF', en: 'Convert to PDF' }),
    title: Object.freeze({ ar: 'تحويل Excel إلى PDF', en: 'Excel to PDF Converter' }),
    description: Object.freeze({
        ar: 'حوّل أوراق Excel إلى ملف PDF منظم، مع تقسيم الجداول الكبيرة وتكرار صف العناوين تلقائيًا.',
        en: 'Convert Excel worksheets into an organized PDF with automatic table splitting and repeated header rows.',
    }),
    note: Object.freeze({
        ar: 'تتم المعالجة محليًا داخل المتصفح. تُعرض القيم النصية والرقمية، بينما قد لا تنتقل الرسوم البيانية والتنسيقات المعقدة كما هي.',
        en: 'Processing stays in your browser. Text and numeric values are included; charts and complex spreadsheet styling may not be preserved.',
    }),
    tags: Object.freeze(['excel', 'xlsx', 'xls', 'pdf', 'spreadsheet', 'converter', 'table', 'processing']),
    inputs: Object.freeze([
        Object.freeze({
            id: 'excel',
            type: 'file',
            accept: EXCEL_ACCEPT,
            label: Object.freeze({ ar: 'اختر ملف Excel', en: 'Choose an Excel file' }),
            unit: Object.freeze({ ar: '', en: '' }),
        }),
    ]),
    async process(values, language) {
        if (!(values.excel instanceof File) || !/\.(xlsx|xls)$/i.test(values.excel.name)) {
            throw new Error(localized(language, 'اختر ملف Excel صالحًا.', 'Choose a valid Excel file.'));
        }
        try {
            const [XLSX, pdfLib] = await Promise.all([loadSheetJs(), loadPdfLib()]);
            const workbook = XLSX.read(await values.excel.arrayBuffer(), { type: 'array' });
            const pdf = await pdfLib.PDFDocument.create();
            let renderedPages = 0;

            for (const sheetName of workbook.SheetNames) {
                const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
                    header: 1,
                    raw: false,
                    defval: '',
                    blankrows: false,
                });
                for (const pageRows of paginateSheet(rows)) {
                    renderedPages += 1;
                    if (renderedPages > 200) throw new Error('Workbook is limited to 200 PDF pages.');
                    const imageBlob = await renderTablePage(pageRows, sheetName, renderedPages, language);
                    const image = await pdf.embedPng(await imageBlob.arrayBuffer());
                    const page = pdf.addPage([841.89, 595.28]);
                    page.drawImage(image, { x: 0, y: 0, width: 841.89, height: 595.28 });
                }
            }
            if (renderedPages === 0) throw new Error('Workbook contains no printable rows.');

            const blob = createPdfBlob(await pdf.save({ useObjectStreams: true }));
            const baseName = values.excel.name.replace(/\.(xlsx|xls)$/i, '') || 'spreadsheet';
            return {
                value: localized(language, `${renderedPages} صفحة`, `${renderedPages} pages`),
                label: localized(language, 'ملف PDF جاهز', 'PDF file is ready'),
                details: `${workbook.SheetNames.length} sheets · ${(blob.size / 1024).toFixed(1)} KB`,
                download: { blob, filename: `${baseName}.pdf` },
            };
        } catch (error) {
            throw new Error(localized(
                language,
                'تعذّر تحويل ملف Excel. جرّب ملف XLSX أو XLS صالحًا يحتوي على بيانات.',
                'Unable to convert the Excel file. Try a valid XLSX or XLS workbook containing data.',
            ), { cause: error });
        }
    },
});

const excelToPdfToolDefinitions = Object.freeze({
    [excelToPdf.id]: excelToPdf,
});

export { excelToPdfToolDefinitions, paginateSheet, shortenCell };

// END OF FILE
