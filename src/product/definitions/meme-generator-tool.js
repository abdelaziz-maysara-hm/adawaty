function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function fileInput() {
    return Object.freeze({
        id: 'image',
        type: 'file',
        accept: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
        label: Object.freeze({ ar: 'اختر صورة', en: 'Choose an image' }),
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

/** Wraps text to fit maxWidth using the canvas's own font metrics (real measureText, not an estimate). */
function wrapTextToCanvasWidth(context, text, maxWidth) {
    const words = text.toUpperCase().split(' ').filter(Boolean);
    const lines = [];
    let current = '';

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (context.measureText(candidate).width > maxWidth && current) {
            lines.push(current);
            current = word;
        } else {
            current = candidate;
        }
    }
    if (current) lines.push(current);

    return lines;
}

function drawMemeTextBlock(context, lines, centerX, baselineY, fontSize, lineHeight) {
    context.font = `bold ${fontSize}px Impact, "Arial Black", sans-serif`;
    context.textAlign = 'center';
    context.lineWidth = Math.max(2, fontSize / 12);
    context.strokeStyle = '#000000';
    context.fillStyle = '#ffffff';

    lines.forEach((line, index) => {
        const y = baselineY + index * lineHeight;
        context.strokeText(line, centerX, y);
        context.fillText(line, centerX, y);
    });
}

const memeGenerator = Object.freeze({
    id: 'meme-generator',
    category: 'image',
    icon: 'MEME',
    action: Object.freeze({ ar: 'أنشئ الميم', en: 'Generate meme' }),
    title: Object.freeze({ ar: 'مولّد الميمز (Meme Generator)', en: 'Meme Generator' }),
    description: Object.freeze({
        ar: 'أضف نصًا علويًا وسفليًا بأسلوب الميمز الكلاسيكي (نص أبيض بحدود سوداء) فوق أي صورة.',
        en: 'Add classic meme-style top and bottom text (white text with a black outline) on top of any image.',
    }),
    note: Object.freeze({
        ar: 'اترك أي من الحقلين فارغًا لو عايز نص واحد بس، أعلى أو أسفل.',
        en: 'Leave either field empty if you only want one line of text, top or bottom.',
    }),
    inputs: Object.freeze([
        fileInput(),
        textFieldInput('topText', 'النص العلوي', 'Top text', ''),
        textFieldInput('bottomText', 'النص السفلي', 'Bottom text', ''),
    ]),
    async process(values, language) {
        if (!values.topText.trim() && !values.bottomText.trim()) {
            throw new Error(localized(language, 'أدخل نصًا علويًا أو سفليًا على الأقل.', 'Enter at least a top or bottom text.'));
        }

        const bitmap = await createImageBitmap(values.image);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d');
        context.drawImage(bitmap, 0, 0);
        bitmap.close();

        const fontSize = Math.max(24, Math.round(canvas.width / 12));
        const lineHeight = fontSize * 1.15;
        const maxWidth = canvas.width * 0.9;
        const centerX = canvas.width / 2;

        if (values.topText.trim()) {
            const topLines = wrapTextToCanvasWidth(context, values.topText, maxWidth);
            drawMemeTextBlock(context, topLines, centerX, fontSize + 10, fontSize, lineHeight);
        }

        if (values.bottomText.trim()) {
            const bottomLines = wrapTextToCanvasWidth(context, values.bottomText, maxWidth);
            const startY = canvas.height - (bottomLines.length - 1) * lineHeight - 20;
            drawMemeTextBlock(context, bottomLines, centerX, startY, fontSize, lineHeight);
        }

        const type = values.image.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob(
                (result) => (result ? resolve(result) : reject(new Error('Unable to create the meme image.'))),
                type,
                0.92,
            );
        });

        return {
            value: `${canvas.width} × ${canvas.height}`,
            label: localized(language, 'الميم جاهز', 'The meme is ready'),
            details: `${(blob.size / 1024).toFixed(1)} KB`,
            download: { blob, filename: `adawaty-meme.${type === 'image/png' ? 'png' : 'jpg'}` },
            preview: blob,
        };
    },
});

const memeToolDefinitions = Object.freeze({
    [memeGenerator.id]: memeGenerator,
});

export { memeToolDefinitions };

// END OF FILE
