const photoEditor = Object.freeze({
    id: 'photo-editor',
    category: 'image',
    icon: 'PHOTO EDIT',
    interactive: true,
    action: Object.freeze({
        ar: 'افتح المحرر',
        en: 'Open editor',
    }),
    title: Object.freeze({
        ar: 'محرر الصور',
        en: 'Photo Editor',
    }),
    description: Object.freeze({
        ar: 'قص، دوّر، اضبط الألوان، طبّق فلاتر، وأضف علامة مائية على صورتك في جلسة واحدة متصلة، ثم نزّل النتيجة.',
        en: 'Crop, rotate, adjust colors, apply filters, and add a watermark to your photo in one continuous session, then download the result.',
    }),
    note: Object.freeze({
        ar: 'تتم كل المعالجة داخل متصفحك؛ صورتك لا تُرفع لأي خادم.',
        en: 'All processing happens in your browser; your photo is never uploaded to any server.',
    }),
    inputs: Object.freeze([]),
});

const photoEditorToolDefinitions = Object.freeze({
    [photoEditor.id]: photoEditor,
});

export { photoEditorToolDefinitions };

// END OF FILE
