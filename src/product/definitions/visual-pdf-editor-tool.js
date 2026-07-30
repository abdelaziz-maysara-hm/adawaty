const visualPdfEditor = Object.freeze({
    id: 'visual-pdf-editor',
    category: 'pdf',
    icon: 'PDF',
    interactive: true,
    action: Object.freeze({
        ar: '\u0627\u0641\u062a\u062d \u0627\u0644\u0645\u062d\u0631\u0631',
        en: 'Open editor',
    }),
    title: Object.freeze({
        ar: '\u0645\u062d\u0631\u0631 PDF \u0627\u0644\u0645\u0631\u0626\u064a',
        en: 'Visual PDF Editor',
    }),
    description: Object.freeze({
        ar: '\u0634\u0627\u0647\u062f \u0635\u0641\u062d\u0627\u062a PDF\u060c \u0648\u0623\u0636\u0641 \u0627\u0644\u0646\u0635\u0648\u0635 \u0645\u0628\u0627\u0634\u0631\u0629\u060c \u062b\u0645 \u0627\u0633\u062d\u0628\u0647\u0627 \u0648\u0646\u0633\u0651\u0642\u0647\u0627 \u0648\u062d\u0645\u0651\u0644 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0645\u0639\u062f\u0651\u0644.',
        en: 'Preview PDF pages, type directly on the document, drag and format text, then download the edited file.',
    }),
    note: Object.freeze({
        ar: '\u064a\u0639\u0645\u0644 \u0627\u0644\u0645\u062d\u0631\u0631 \u0645\u062d\u0644\u064a\u064b\u0627 \u0641\u064a \u0645\u062a\u0635\u0641\u062d\u0643 \u0648\u0644\u0627 \u064a\u0631\u0641\u0639 \u0645\u0644\u0641\u0643 \u0625\u0644\u0649 \u062e\u0627\u062f\u0645.',
        en: 'The editor runs locally in your browser and does not upload your document to a server.',
    }),
    inputs: Object.freeze([
        Object.freeze({
            id: 'pdf',
            type: 'file',
            label: Object.freeze({
                ar: '\u0627\u062e\u062a\u0631 \u0645\u0644\u0641 PDF',
                en: 'Choose a PDF file',
            }),
            accept: 'application/pdf,.pdf',
        }),
    ]),
});

const visualPdfEditorToolDefinitions = Object.freeze({
    [visualPdfEditor.id]: visualPdfEditor,
});

export { visualPdfEditorToolDefinitions };

// END OF FILE
