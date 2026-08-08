import {
    assertPdfFile,
    createPdfBlob,
    loadPdfEncrypt,
    loadPdfLib,
    outputName,
} from '../pdf-processing.js';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function pdfInput() {
    return Object.freeze({
        id: 'pdf',
        type: 'file',
        accept: 'application/pdf,.pdf',
        label: Object.freeze({ ar: 'اختر ملف PDF', en: 'Choose a PDF file' }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function textFieldInput(id, ar, en, placeholder) {
    return Object.freeze({
        id,
        type: 'text',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

const pdfProtector = Object.freeze({
    id: 'pdf-protect',
    category: 'pdf',
    icon: 'PDF🔒',
    action: Object.freeze({ ar: 'أضف كلمة المرور', en: 'Add password' }),
    title: Object.freeze({ ar: 'حماية PDF بكلمة مرور', en: 'PDF Password Protector' }),
    description: Object.freeze({
        ar: 'أضف كلمة مرور لملف PDF بحيث يُطلب إدخالها لفتح الملف في أي قارئ PDF، لحماية مستندات حساسة قبل مشاركتها.',
        en: 'Add a password to a PDF so it\u2019s required to open the file in any PDF reader, protecting sensitive documents before sharing.',
    }),
    note: Object.freeze({
        ar: 'احفظ كلمة المرور في مكان آمن — لو نسيتها، لا توجد طريقة لاسترجاعها أو فتح الملف بدونها.',
        en: 'Save the password somewhere safe \u2014 if forgotten, there is no way to recover it or open the file without it.',
    }),
    inputs: Object.freeze([
        pdfInput(),
        textFieldInput('password', 'كلمة المرور', 'Password', ''),
    ]),
    async process(values, language) {
        assertPdfFile(values.pdf);

        if (!values.password || values.password.length < 4) {
            throw new Error(localized(
                language,
                'أدخل كلمة مرور من 4 أحرف على الأقل.',
                'Enter a password of at least 4 characters.',
            ));
        }

        // Re-save through pdf-lib first: guarantees a clean, well-formed PDF
        // structure for the encryption step below, regardless of quirks in
        // the original file's own internal structure.
        const { PDFDocument } = await loadPdfLib();
        const document = await PDFDocument.load(await values.pdf.arrayBuffer());
        const normalizedBytes = await document.save();

        const { encryptPDF } = await loadPdfEncrypt();
        const encryptedBytes = await encryptPDF(normalizedBytes, values.password);

        const blob = createPdfBlob(encryptedBytes);
        return {
            value: `${(blob.size / 1024).toFixed(1)} KB`,
            label: localized(language, 'الملف المحمي بكلمة مرور جاهز', 'The password-protected file is ready'),
            details: localized(
                language,
                'سيُطلب إدخال كلمة المرور عند فتح الملف في أي برنامج قراءة PDF.',
                'The password will be required to open the file in any PDF reader.',
            ),
            download: { blob, filename: outputName(values.pdf, 'protected') },
        };
    },
});

const pdfProtectToolDefinitions = Object.freeze({
    [pdfProtector.id]: pdfProtector,
});

export { pdfProtectToolDefinitions };

// END OF FILE
