import { assertPdfFile, loadPdfJs } from '../pdf-processing.js';
import { loadSheetJs } from './data-format-tools.js';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function textItemsToRows(items) {
    const entries = items
        .filter((item) => 'str' in item && item.str.trim())
        .map((item) => ({
            text: item.str.trim(),
            x: Number(item.transform?.[4] ?? 0),
            y: Number(item.transform?.[5] ?? 0),
            width: Math.max(0, Number(item.width ?? 0)),
            height: Math.max(1, Math.abs(Number(item.height ?? item.transform?.[3] ?? 10))),
        }))
        .sort((left, right) => Math.abs(right.y - left.y) > 2
            ? right.y - left.y
            : left.x - right.x);

    const lines = [];
    for (const entry of entries) {
        const line = lines.find((candidate) => Math.abs(candidate.y - entry.y)
            <= Math.max(2, Math.min(candidate.height, entry.height) * 0.4));
        if (line) {
            line.items.push(entry);
            line.height = Math.max(line.height, entry.height);
        } else {
            lines.push({ y: entry.y, height: entry.height, items: [entry] });
        }
    }

    return lines
        .sort((left, right) => right.y - left.y)
        .map((line) => {
            const cells = [];
            for (const entry of line.items.sort((left, right) => left.x - right.x)) {
                const previous = cells.at(-1);
                const gap = previous ? entry.x - previous.endX : Infinity;
                const mergeThreshold = Math.max(4, line.height * 0.65);
                if (previous && gap <= mergeThreshold) {
                    previous.text += ` ${entry.text}`;
                    previous.endX = Math.max(previous.endX, entry.x + entry.width);
                } else {
                    cells.push({ text: entry.text, endX: entry.x + entry.width });
                }
            }
            return cells.map(({ text }) => text);
        })
        .filter((row) => row.length > 0);
}

function columnWidths(rows) {
    const columnCount = Math.max(0, ...rows.map((row) => row.length));
    return Array.from({ length: columnCount }, (_, column) => ({
        wch: Math.min(50, Math.max(8, ...rows.map((row) => String(row[column] ?? '').length + 2))),
    }));
}

const pdfToExcel = Object.freeze({
    id: 'pdf-to-excel-converter',
    category: 'pdf',
    icon: 'XLSX',
    action: Object.freeze({ ar: 'حوّل إلى Excel', en: 'Convert to Excel' }),
    title: Object.freeze({ ar: 'تحويل PDF إلى Excel', en: 'PDF to Excel Converter' }),
    description: Object.freeze({
        ar: 'استخرج الجداول والنصوص المرتبة من صفحات PDF إلى ملف Excel، مع إنشاء ورقة مستقلة لكل صفحة.',
        en: 'Extract tables and positioned text from PDF pages into Excel, with a separate worksheet for every page.',
    }),
    note: Object.freeze({
        ar: 'أفضل النتائج مع ملفات PDF النصية والجداول الواضحة. الملفات الممسوحة كصور تحتاج OCR ولا تُستخرج بهذه الأداة. لا يُرفع الملف لأي خادم.',
        en: 'Best with text PDFs and clear tables. Scanned image-only PDFs require OCR and are not extracted by this tool. Files are never uploaded.',
    }),
    tags: Object.freeze(['pdf', 'excel', 'xlsx', 'table', 'extract', 'converter', 'data', 'processing']),
    inputs: Object.freeze([
        Object.freeze({
            id: 'pdf',
            type: 'file',
            accept: 'application/pdf,.pdf',
            label: Object.freeze({ ar: 'اختر ملف PDF', en: 'Choose a PDF file' }),
            unit: Object.freeze({ ar: '', en: '' }),
        }),
    ]),
    async process(values, language) {
        assertPdfFile(values.pdf);
        let document;
        try {
            const [pdfjs, XLSX] = await Promise.all([loadPdfJs(), loadSheetJs()]);
            document = await pdfjs.getDocument({
                data: new Uint8Array(await values.pdf.arrayBuffer()),
            }).promise;
            if (document.numPages > 100) {
                throw new Error('PDF files are limited to 100 worksheets per conversion.');
            }

            const workbook = XLSX.utils.book_new();
            let totalRows = 0;
            for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
                const page = await document.getPage(pageNumber);
                const content = await page.getTextContent();
                const rows = textItemsToRows(content.items);
                totalRows += rows.length;
                const worksheet = XLSX.utils.aoa_to_sheet(rows.length > 0 ? rows : [['']]);
                worksheet['!cols'] = columnWidths(rows);
                XLSX.utils.book_append_sheet(workbook, worksheet, `Page ${pageNumber}`);
                page.cleanup();
            }
            if (totalRows === 0) {
                throw new Error('No selectable text was found in this PDF.');
            }

            const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array', compression: true });
            const blob = new Blob([bytes], { type: XLSX_MIME });
            const baseName = values.pdf.name.replace(/\.pdf$/i, '') || 'pdf-tables';
            return {
                value: localized(language, `${document.numPages} ورقة`, `${document.numPages} sheets`),
                label: localized(language, 'ملف Excel جاهز', 'Excel workbook is ready'),
                details: localized(
                    language,
                    `${totalRows} صف مستخرج · ${(blob.size / 1024).toFixed(1)} KB`,
                    `${totalRows} extracted rows · ${(blob.size / 1024).toFixed(1)} KB`,
                ),
                download: { blob, filename: `${baseName}.xlsx` },
            };
        } catch (error) {
            const scanned = error?.message?.includes('selectable text');
            throw new Error(localized(
                language,
                scanned
                    ? 'لم يُعثر على نص قابل للتحديد. استخدم أداة OCR إذا كان الملف ممسوحًا كصور.'
                    : 'تعذّر تحويل PDF إلى Excel. جرّب ملفًا نصيًا صالحًا بجداول أو صفوف واضحة.',
                scanned
                    ? 'No selectable text was found. Use the OCR tool if the PDF contains scanned images.'
                    : 'Unable to convert the PDF to Excel. Try a valid text PDF with clear tables or rows.',
            ), { cause: error });
        } finally {
            await document?.destroy();
        }
    },
});

const pdfToExcelToolDefinitions = Object.freeze({
    [pdfToExcel.id]: pdfToExcel,
});

export { columnWidths, pdfToExcelToolDefinitions, textItemsToRows };

// END OF FILE
