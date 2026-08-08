function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value, label, details };
}

function numberInput(id, ar, en, placeholder, options = {}) {
    return Object.freeze({
        id,
        type: 'number',
        min: options.min ?? 0,
        max: options.max ?? 1000,
        step: options.step ?? 1,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze(options.unit ?? { ar: '', en: '' }),
        placeholder: String(placeholder),
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

function isValidCssColor(value) {
    if (typeof value !== 'string') return false;
    const text = value.trim();
    if (text.length === 0) return false;

    // Hex: #rgb, #rgba, #rrggbb, #rrggbbaa
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(text)) return true;
    // rgb()/rgba() with comma or modern space syntax
    if (/^rgba?\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(,\s*[\d.]+%?\s*)?\)$/i.test(text)) return true;
    if (/^rgba?\(\s*[\d.]+%?\s+[\d.]+%?\s+[\d.]+%?\s*(\/\s*[\d.]+%?\s*)?\)$/i.test(text)) return true;
    // hsl()/hsla() with comma or modern space syntax
    if (/^hsla?\(\s*[\d.]+(deg)?\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(,\s*[\d.]+%?\s*)?\)$/i.test(text)) return true;
    if (/^hsla?\(\s*[\d.]+(deg)?\s+[\d.]+%\s+[\d.]+%\s*(\/\s*[\d.]+%?\s*)?\)$/i.test(text)) return true;
    // A plain CSS keyword: named color, 'transparent', 'currentColor', etc.
    if (/^[a-zA-Z]+$/.test(text)) return true;

    return false;
}

function cssTool(config) {
    return Object.freeze({
        category: 'developer',
        ...config,
    });
}

const gradientGenerator = cssTool({
    id: 'css-gradient-generator',
    icon: 'GRAD',
    title: Object.freeze({ ar: 'مولّد تدرّج CSS', en: 'CSS Gradient Generator' }),
    description: Object.freeze({
        ar: 'أنشئ كود linear-gradient جاهزًا للّصق مباشرة من زاوية ولونين تختارهما.',
        en: 'Generate ready-to-paste linear-gradient CSS from a chosen angle and two colors.',
    }),
    note: Object.freeze({
        ar: 'أدخل اللون بأي صيغة CSS صالحة: اسم اللون، أو HEX، أو rgb()، أو hsl().',
        en: 'Enter the color in any valid CSS format: a color name, HEX, rgb(), or hsl().',
    }),
    inputs: Object.freeze([
        numberInput('angle', 'زاوية التدرّج', 'Gradient angle', 90, { min: 0, max: 360, unit: { ar: 'درجة', en: 'deg' } }),
        textFieldInput('color1', 'اللون الأول', 'First color', '#2fb8a6'),
        textFieldInput('color2', 'اللون الثاني', 'Second color', '#e8b34d'),
    ]),
    calculate(values, language) {
        if (!isValidCssColor(values.color1) || !isValidCssColor(values.color2)) {
            throw new Error(localized(
                language,
                'أدخل قيمتي لون صالحتين (مثل #2fb8a6 أو rgb(47,184,166)).',
                'Enter two valid color values (like #2fb8a6 or rgb(47,184,166)).',
            ));
        }

        const angle = ((Number(values.angle) % 360) + 360) % 360;
        const css = `background: linear-gradient(${angle}deg, ${values.color1}, ${values.color2});`;

        return output(
            css,
            localized(language, 'كود التدرّج جاهز', 'Gradient CSS is ready'),
            localized(language, 'انسخ السطر والصقه في ملف CSS الخاص بك.', 'Copy the line and paste it into your CSS file.'),
        );
    },
});

const cssGeneratorToolDefinitions = Object.freeze({
    [gradientGenerator.id]: gradientGenerator,
});

export { cssGeneratorToolDefinitions };

// END OF FILE
