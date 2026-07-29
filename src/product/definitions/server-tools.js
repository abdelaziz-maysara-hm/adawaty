// Tools in this file are the ONLY tools in the catalogue that upload the
// user's file to a server for processing. Every other tool in the site runs
// entirely client-side. Each tool here must:
//   1. Set `serverSide: true` so the UI can render a clear disclosure.
//   2. Say plainly in its `note` that the file leaves the browser.
// Keep this file the single place server-backed tools live, so it stays
// easy to audit exactly what does and doesn't touch a server.

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

function fileOutput(blob, filename, language, arLabel, enLabel) {
    return {
        value: localized(language, 'جاهز للتنزيل', 'Ready to download'),
        label: localized(language, arLabel, enLabel),
        details: '',
        download: { blob, filename },
    };
}

async function readErrorMessage(response, language) {
    try {
        const body = await response.json();
        if (body?.error) {
            return localized(language, body.error.ar, body.error.en);
        }
    } catch {
        // response wasn't JSON; fall through to the generic message below.
    }
    return localized(
        language,
        'حدث خطأ أثناء المعالجة على الخادم. حاول مرة أخرى.',
        'Something went wrong processing this on the server. Please try again.',
    );
}

const pdfToWordPro = Object.freeze({
    id: 'pdf-to-word-pro-converter',
    category: 'pdf',
    icon: 'PDF→DOCX·PRO',
    serverSide: true,
    action: Object.freeze({ ar: 'حوّل إلى Word (احترافي)', en: 'Convert to Word (Pro)' }),
    title: Object.freeze({ ar: 'تحويل PDF إلى Word — نسخة احترافية', en: 'PDF to Word Converter — Pro' }),
    description: Object.freeze({
        ar: 'تحويل عالي الدقة يحافظ على الجداول والصور وتنسيق الأعمدة، باستخدام محرك تحليل مستندات حقيقي على خادمنا.',
        en: 'High-fidelity conversion that preserves tables, images, and multi-column layouts, using a real document-analysis engine on our server.',
    }),
    note: Object.freeze({
        ar: '⚠️ هذه الأداة (فقط) ترفع ملفك إلى خادمنا للمعالجة ثم تحذفه فورًا بعد التحويل — لا يُخزَّن أي ملف. لو الخصوصية الكاملة داخل المتصفح أهم عندك من جودة التنسيق، استخدم "تحويل PDF إلى Word" العادي بدلًا من هذه النسخة. الحد الأقصى لحجم الملف حاليًا 15 ميجابايت.',
        en: '⚠️ This tool (only) uploads your file to our server for processing, then deletes it immediately after conversion — nothing is stored. If full in-browser privacy matters more to you than formatting fidelity, use the regular "PDF to Word Converter" instead. Current file size limit: 15 MB.',
    }),
    inputs: Object.freeze([pdfInput()]),
    async process(values, language) {
        const file = values.pdf;
        if (!(file instanceof File)) {
            throw new Error(localized(language, 'اختر ملف PDF أولًا.', 'Choose a PDF file first.'));
        }
        if (file.size > 15 * 1024 * 1024) {
            throw new Error(localized(
                language,
                'الملف أكبر من 15 ميجابايت. جرّب أداة التحويل المحلية بدلًا من ذلك.',
                'The file is larger than 15 MB. Try the local conversion tool instead.',
            ));
        }

        let response;
        try {
            response = await fetch('/api/pdf-to-word', {
                method: 'POST',
                headers: { 'Content-Type': 'application/pdf' },
                body: file,
            });
        } catch {
            throw new Error(localized(
                language,
                'تعذّر الوصول للخادم. هذه الميزة متاحة فقط على نسخة الموقع المستضافة على Vercel.',
                'Could not reach the server. This feature is only available on the Vercel-hosted version of the site.',
            ));
        }

        if (!response.ok) {
            throw new Error(await readErrorMessage(response, language));
        }

        const blob = await response.blob();
        const base = file.name.replace(/\.pdf$/i, '') || 'document';
        return fileOutput(blob, `${base}-pro.docx`, language, 'مستند Word جاهز (احترافي)', 'Word document is ready (Pro)');
    },
});

const serverToolDefinitions = Object.freeze(Object.fromEntries([
    pdfToWordPro,
].map((definition) => [definition.id, definition])));

export { serverToolDefinitions };
