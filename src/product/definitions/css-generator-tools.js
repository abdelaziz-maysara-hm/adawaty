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

function selectInput(id, ar, en, options) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map(([value, optAr, optEn]) => Object.freeze({
            value,
            label: Object.freeze({ ar: optAr, en: optEn }),
        }))),
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

const shadowGenerator = cssTool({
    id: 'css-box-shadow-generator',
    icon: 'SHDW',
    title: Object.freeze({ ar: 'مولّد ظل CSS', en: 'CSS Box Shadow Generator' }),
    description: Object.freeze({
        ar: 'أنشئ كود box-shadow من إزاحة أفقية ورأسية ومقدار تمويه وانتشار ولون.',
        en: 'Generate box-shadow CSS from horizontal/vertical offset, blur, spread, and color.',
    }),
    note: Object.freeze({
        ar: 'اختر الظل الداخلي (Inset) لو محتاج تأثير غائر بدل ظل خارجي بارز.',
        en: 'Choose inset if you need a sunken effect instead of a raised outer shadow.',
    }),
    inputs: Object.freeze([
        numberInput('x', 'الإزاحة الأفقية', 'Horizontal offset', 0, { min: -100, max: 100, unit: { ar: 'بكسل', en: 'px' } }),
        numberInput('y', 'الإزاحة الرأسية', 'Vertical offset', 4, { min: -100, max: 100, unit: { ar: 'بكسل', en: 'px' } }),
        numberInput('blur', 'مقدار التمويه', 'Blur radius', 12, { min: 0, max: 200, unit: { ar: 'بكسل', en: 'px' } }),
        numberInput('spread', 'مقدار الانتشار', 'Spread radius', 0, { min: -100, max: 100, unit: { ar: 'بكسل', en: 'px' } }),
        textFieldInput('color', 'اللون', 'Color', 'rgba(0,0,0,0.3)'),
        selectInput('inset', 'نوع الظل', 'Shadow type', [
            ['outset', 'خارجي (افتراضي)', 'Outset (default)'],
            ['inset', 'داخلي (Inset)', 'Inset'],
        ]),
    ]),
    calculate(values, language) {
        if (!isValidCssColor(values.color)) {
            throw new Error(localized(
                language,
                'أدخل قيمة لون صالحة (مثل rgba(0,0,0,0.3) أو #333).',
                'Enter a valid color value (like rgba(0,0,0,0.3) or #333).',
            ));
        }

        const insetPrefix = values.inset === 'inset' ? 'inset ' : '';
        const css = `box-shadow: ${insetPrefix}${values.x}px ${values.y}px ${values.blur}px ${values.spread}px ${values.color};`;

        return output(
            css,
            localized(language, 'كود الظل جاهز', 'Box shadow CSS is ready'),
            localized(language, 'انسخ السطر والصقه في ملف CSS الخاص بك.', 'Copy the line and paste it into your CSS file.'),
        );
    },
});

const borderRadiusGenerator = cssTool({
    id: 'css-border-radius-generator',
    icon: 'RAD',
    title: Object.freeze({ ar: 'مولّد استدارة الحواف CSS', en: 'CSS Border Radius Generator' }),
    description: Object.freeze({
        ar: 'حدد استدارة كل زاوية من زوايا العنصر الأربع وأنشئ كود border-radius جاهزًا.',
        en: 'Set each of the element\u2019s four corner radii and generate ready border-radius CSS.',
    }),
    note: Object.freeze({
        ar: 'لو الزوايا الأربع متساوية، الكود يُبسَّط تلقائيًا لقيمة واحدة بدل تكرارها أربع مرات.',
        en: 'If all four corners match, the code automatically collapses to a single value instead of repeating it four times.',
    }),
    inputs: Object.freeze([
        numberInput('topLeft', 'أعلى يسار', 'Top-left', 8, { min: 0, max: 500, unit: { ar: 'بكسل', en: 'px' } }),
        numberInput('topRight', 'أعلى يمين', 'Top-right', 8, { min: 0, max: 500, unit: { ar: 'بكسل', en: 'px' } }),
        numberInput('bottomRight', 'أسفل يمين', 'Bottom-right', 8, { min: 0, max: 500, unit: { ar: 'بكسل', en: 'px' } }),
        numberInput('bottomLeft', 'أسفل يسار', 'Bottom-left', 8, { min: 0, max: 500, unit: { ar: 'بكسل', en: 'px' } }),
    ]),
    calculate(values, language) {
        const { topLeft, topRight, bottomRight, bottomLeft } = values;
        const allEqual = topLeft === topRight && topRight === bottomRight && bottomRight === bottomLeft;
        const css = allEqual
            ? `border-radius: ${topLeft}px;`
            : `border-radius: ${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px;`;

        return output(
            css,
            localized(language, 'كود الاستدارة جاهز', 'Border-radius CSS is ready'),
            localized(language, 'الترتيب: أعلى يسار، أعلى يمين، أسفل يمين، أسفل يسار.', 'Order: top-left, top-right, bottom-right, bottom-left.'),
        );
    },
});

const cssGeneratorToolDefinitions = Object.freeze({
    [gradientGenerator.id]: gradientGenerator,
    [shadowGenerator.id]: shadowGenerator,
    [borderRadiusGenerator.id]: borderRadiusGenerator,
});

export { cssGeneratorToolDefinitions };

// END OF FILE
