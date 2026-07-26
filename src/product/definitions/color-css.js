const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 4,
});

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
}

function numberInput(id, label, placeholder, options = {}) {
    return Object.freeze({
        id,
        type: 'number',
        min: options.min ?? 0,
        max: options.max ?? 1_000_000,
        step: options.step ?? 'any',
        label: Object.freeze(label),
        unit: Object.freeze(options.unit ?? { ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

function textInput(id, label, placeholder) {
    return Object.freeze({
        id,
        type: 'textarea',
        rows: 2,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function selectInput(id, label, options) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map((option) => Object.freeze({
            value: option.value,
            label: Object.freeze(option.label),
        }))),
    });
}

function parseHex(value, language = 'en') {
    let hex = String(value).trim().replace(/^#/, '');
    if (/^[a-f\d]{3}$/i.test(hex)) {
        hex = [...hex].map((character) => character.repeat(2)).join('');
    }
    if (!/^[a-f\d]{6}$/i.test(hex)) {
        throw new Error(localized(language, 'أدخل لون HEX صالحًا.', 'Enter a valid HEX color.'));
    }
    return [
        Number.parseInt(hex.slice(0, 2), 16),
        Number.parseInt(hex.slice(2, 4), 16),
        Number.parseInt(hex.slice(4, 6), 16),
    ];
}

function toHex(red, green, blue) {
    return `#${[red, green, blue]
        .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()}`;
}

function rgbToHsl(red, green, blue) {
    const channels = [red / 255, green / 255, blue / 255];
    const maximum = Math.max(...channels);
    const minimum = Math.min(...channels);
    const delta = maximum - minimum;
    const lightness = (maximum + minimum) / 2;
    let hue = 0;

    if (delta) {
        if (maximum === channels[0]) {
            hue = 60 * (((channels[1] - channels[2]) / delta) % 6);
        } else if (maximum === channels[1]) {
            hue = 60 * (((channels[2] - channels[0]) / delta) + 2);
        } else {
            hue = 60 * (((channels[0] - channels[1]) / delta) + 4);
        }
    }

    if (hue < 0) {
        hue += 360;
    }

    const saturation = delta
        ? delta / (1 - Math.abs((2 * lightness) - 1))
        : 0;

    return [hue, saturation * 100, lightness * 100];
}

function relativeLuminance(rgb) {
    const channels = rgb.map((channel) => {
        const value = channel / 255;
        return value <= 0.04045
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
    });
    return (0.2126 * channels[0])
        + (0.7152 * channels[1])
        + (0.0722 * channels[2]);
}

function validateChannel(value, language) {
    if (!Number.isInteger(value) || value < 0 || value > 255) {
        throw new Error(localized(language, 'قنوات RGB يجب أن تكون أعدادًا صحيحة بين 0 و255.', 'RGB channels must be integers from 0 to 255.'));
    }
}

const rgbInputs = Object.freeze([
    numberInput('red', { ar: 'الأحمر', en: 'Red' }, 64, { max: 255, step: 1 }),
    numberInput('green', { ar: 'الأخضر', en: 'Green' }, 128, { max: 255, step: 1 }),
    numberInput('blue', { ar: 'الأزرق', en: 'Blue' }, 255, { max: 255, step: 1 }),
]);

const hexToRgb = Object.freeze({
    id: 'hex-to-rgb-converter',
    category: 'color-css',
    icon: '#',
    title: Object.freeze({ ar: 'تحويل HEX إلى RGB', en: 'HEX to RGB Converter' }),
    description: Object.freeze({ ar: 'حوّل ألوان HEX المختصرة أو الكاملة إلى قيم RGB.', en: 'Convert short or full HEX colors into RGB values.' }),
    note: Object.freeze({ ar: 'تدعم الأداة صيغتي #RGB و#RRGGBB.', en: 'Supports both #RGB and #RRGGBB formats.' }),
    inputs: Object.freeze([textInput('hex', { ar: 'لون HEX', en: 'HEX color' }, '#4080FF')]),
    calculate(values, language) {
        const [red, green, blue] = parseHex(values.hex, language);
        return output(`rgb(${red}, ${green}, ${blue})`, localized(language, 'قيمة RGB', 'RGB value'), `${red}, ${green}, ${blue}`);
    },
});

const rgbToHex = Object.freeze({
    id: 'rgb-to-hex-converter',
    category: 'color-css',
    icon: 'RGB',
    title: Object.freeze({ ar: 'تحويل RGB إلى HEX', en: 'RGB to HEX Converter' }),
    description: Object.freeze({ ar: 'حوّل قنوات الأحمر والأخضر والأزرق إلى لون HEX.', en: 'Convert red, green and blue channels into a HEX color.' }),
    note: Object.freeze({ ar: 'يجب أن تكون كل قناة عددًا صحيحًا بين 0 و255.', en: 'Each channel must be an integer from 0 to 255.' }),
    inputs: rgbInputs,
    calculate(values, language) {
        for (const channel of [values.red, values.green, values.blue]) {
            validateChannel(channel, language);
        }
        return output(toHex(values.red, values.green, values.blue), localized(language, 'لون HEX', 'HEX color'));
    },
});

const rgbToHslTool = Object.freeze({
    id: 'rgb-to-hsl-converter',
    category: 'color-css',
    icon: 'HSL',
    title: Object.freeze({ ar: 'تحويل RGB إلى HSL', en: 'RGB to HSL Converter' }),
    description: Object.freeze({ ar: 'حوّل لون RGB إلى الدرجة والتشبع والإضاءة.', en: 'Convert RGB color values to hue, saturation and lightness.' }),
    note: Object.freeze({ ar: 'HSL مفيدة لتعديل الألوان برمجيًا داخل CSS.', en: 'HSL is useful for programmatic color adjustments in CSS.' }),
    inputs: rgbInputs,
    calculate(values, language) {
        for (const channel of [values.red, values.green, values.blue]) {
            validateChannel(channel, language);
        }
        const [hue, saturation, lightness] = rgbToHsl(values.red, values.green, values.blue);
        return output(
            `hsl(${Math.round(hue)}, ${saturation.toFixed(1)}%, ${lightness.toFixed(1)}%)`,
            localized(language, 'قيمة HSL', 'HSL value'),
        );
    },
});

const contrastChecker = Object.freeze({
    id: 'wcag-contrast-checker',
    category: 'color-css',
    icon: 'Aa',
    title: Object.freeze({ ar: 'فاحص تباين WCAG', en: 'WCAG Contrast Checker' }),
    description: Object.freeze({ ar: 'احسب نسبة التباين بين لون النص والخلفية وفق WCAG.', en: 'Calculate text and background contrast ratio using WCAG rules.' }),
    note: Object.freeze({ ar: 'النص العادي يحتاج 4.5:1 لمستوى AA و7:1 لمستوى AAA.', en: 'Normal text needs 4.5:1 for AA and 7:1 for AAA.' }),
    inputs: Object.freeze([
        textInput('foreground', { ar: 'لون النص', en: 'Text color' }, '#111827'),
        textInput('background', { ar: 'لون الخلفية', en: 'Background color' }, '#FFFFFF'),
    ]),
    calculate(values, language) {
        const first = relativeLuminance(parseHex(values.foreground, language));
        const second = relativeLuminance(parseHex(values.background, language));
        const ratio = (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
        const rating = ratio >= 7
            ? 'AAA'
            : ratio >= 4.5 ? 'AA' : localized(language, 'غير ناجح للنص العادي', 'Fails normal text');
        return output(`${ratio.toFixed(2)}:1`, localized(language, 'نسبة التباين', 'Contrast ratio'), rating);
    },
});

const colorBlender = Object.freeze({
    id: 'color-blender',
    category: 'color-css',
    icon: '50%',
    title: Object.freeze({ ar: 'أداة مزج الألوان', en: 'Color Blender' }),
    description: Object.freeze({ ar: 'امزج لونين بنسبة قابلة للتعديل واحصل على لون HEX جديد.', en: 'Blend two colors with an adjustable ratio and get a new HEX color.' }),
    note: Object.freeze({ ar: 'النسبة تمثل مساهمة اللون الثاني في النتيجة.', en: 'The percentage controls the second color contribution.' }),
    inputs: Object.freeze([
        textInput('first', { ar: 'اللون الأول', en: 'First color' }, '#2563EB'),
        textInput('second', { ar: 'اللون الثاني', en: 'Second color' }, '#F43F5E'),
        numberInput('amount', { ar: 'نسبة اللون الثاني', en: 'Second color amount' }, 50, { max: 100, unit: { ar: '%', en: '%' } }),
    ]),
    calculate(values, language) {
        const first = parseHex(values.first, language);
        const second = parseHex(values.second, language);
        const ratio = values.amount / 100;
        const blended = first.map((channel, index) => (
            channel + ((second[index] - channel) * ratio)
        ));
        return output(toHex(...blended), localized(language, 'اللون الممزوج', 'Blended color'), `color-mix(in srgb, ${values.first} ${100 - values.amount}%, ${values.second} ${values.amount}%)`);
    },
});

const tintShade = Object.freeze({
    id: 'color-tint-shade-generator',
    category: 'color-css',
    icon: '±',
    title: Object.freeze({ ar: 'مولد درجات اللون', en: 'Color Tint & Shade Generator' }),
    description: Object.freeze({ ar: 'أنشئ درجة أفتح أو أغمق من لون HEX.', en: 'Create a lighter tint or darker shade from a HEX color.' }),
    note: Object.freeze({ ar: 'يمزج التفتيح مع الأبيض والتغميق مع الأسود.', en: 'Tints mix with white and shades mix with black.' }),
    inputs: Object.freeze([
        textInput('color', { ar: 'اللون الأساسي', en: 'Base color' }, '#14B8A6'),
        selectInput('mode', { ar: 'العملية', en: 'Operation' }, [
            { value: 'tint', label: { ar: 'تفتيح', en: 'Tint' } },
            { value: 'shade', label: { ar: 'تغميق', en: 'Shade' } },
        ]),
        numberInput('amount', { ar: 'النسبة', en: 'Amount' }, 20, { max: 100, unit: { ar: '%', en: '%' } }),
    ]),
    calculate(values, language) {
        const color = parseHex(values.color, language);
        const target = values.mode === 'tint' ? 255 : 0;
        const ratio = values.amount / 100;
        const adjusted = color.map((channel) => channel + ((target - channel) * ratio));
        return output(toHex(...adjusted), localized(language, 'اللون الناتج', 'Generated color'));
    },
});

const gradientGenerator = Object.freeze({
    id: 'css-linear-gradient-generator',
    category: 'color-css',
    icon: 'CSS',
    title: Object.freeze({ ar: 'مولد تدرج CSS', en: 'CSS Linear Gradient Generator' }),
    description: Object.freeze({ ar: 'أنشئ كود تدرج خطي بين لونين بزاوية محددة.', en: 'Generate a linear gradient between two colors at a chosen angle.' }),
    note: Object.freeze({ ar: 'انسخ الناتج مباشرة إلى خاصية background.', en: 'Copy the result directly into a background declaration.' }),
    inputs: Object.freeze([
        textInput('first', { ar: 'اللون الأول', en: 'First color' }, '#06B6D4'),
        textInput('second', { ar: 'اللون الثاني', en: 'Second color' }, '#8B5CF6'),
        numberInput('angle', { ar: 'الزاوية', en: 'Angle' }, 135, { max: 360, unit: { ar: 'درجة', en: 'deg' } }),
    ]),
    calculate(values, language) {
        const first = toHex(...parseHex(values.first, language));
        const second = toHex(...parseHex(values.second, language));
        return output(
            `background: linear-gradient(${values.angle}deg, ${first}, ${second});`,
            localized(language, 'كود CSS', 'CSS code'),
        );
    },
});

const boxShadowGenerator = Object.freeze({
    id: 'css-box-shadow-generator',
    category: 'color-css',
    icon: '▣',
    title: Object.freeze({ ar: 'مولد ظل CSS', en: 'CSS Box Shadow Generator' }),
    description: Object.freeze({ ar: 'أنشئ خاصية box-shadow بإزاحات وتمويه وانتشار قابلة للتخصيص.', en: 'Generate a box-shadow with customizable offsets, blur and spread.' }),
    note: Object.freeze({ ar: 'يمكن استخدام قيم سالبة للإزاحة والانتشار.', en: 'Offsets and spread may use negative values.' }),
    inputs: Object.freeze([
        numberInput('x', { ar: 'الإزاحة الأفقية', en: 'Horizontal offset' }, 0, { min: -200, max: 200, unit: { ar: 'px', en: 'px' } }),
        numberInput('y', { ar: 'الإزاحة الرأسية', en: 'Vertical offset' }, 12, { min: -200, max: 200, unit: { ar: 'px', en: 'px' } }),
        numberInput('blur', { ar: 'التمويه', en: 'Blur' }, 30, { max: 300, unit: { ar: 'px', en: 'px' } }),
        numberInput('spread', { ar: 'الانتشار', en: 'Spread' }, -8, { min: -200, max: 200, unit: { ar: 'px', en: 'px' } }),
        textInput('color', { ar: 'لون الظل', en: 'Shadow color' }, '#0F172A'),
    ]),
    calculate(values, language) {
        const color = toHex(...parseHex(values.color, language));
        return output(
            `box-shadow: ${values.x}px ${values.y}px ${values.blur}px ${values.spread}px ${color};`,
            localized(language, 'كود CSS', 'CSS code'),
        );
    },
});

const borderRadiusGenerator = Object.freeze({
    id: 'css-border-radius-generator',
    category: 'color-css',
    icon: '◜',
    title: Object.freeze({ ar: 'مولد Border Radius', en: 'CSS Border Radius Generator' }),
    description: Object.freeze({ ar: 'أنشئ نصف قطر مختلفًا لكل زاوية في العنصر.', en: 'Generate individual border radii for every element corner.' }),
    note: Object.freeze({ ar: 'ترتيب القيم: أعلى يمين، أسفل يمين، أسفل يسار، أعلى يسار.', en: 'Order: top-left, top-right, bottom-right, bottom-left.' }),
    inputs: Object.freeze([
        numberInput('topLeft', { ar: 'أعلى يسار', en: 'Top left' }, 24, { max: 500, unit: { ar: 'px', en: 'px' } }),
        numberInput('topRight', { ar: 'أعلى يمين', en: 'Top right' }, 24, { max: 500, unit: { ar: 'px', en: 'px' } }),
        numberInput('bottomRight', { ar: 'أسفل يمين', en: 'Bottom right' }, 24, { max: 500, unit: { ar: 'px', en: 'px' } }),
        numberInput('bottomLeft', { ar: 'أسفل يسار', en: 'Bottom left' }, 24, { max: 500, unit: { ar: 'px', en: 'px' } }),
    ]),
    calculate(values, language) {
        return output(
            `border-radius: ${values.topLeft}px ${values.topRight}px ${values.bottomRight}px ${values.bottomLeft}px;`,
            localized(language, 'كود CSS', 'CSS code'),
        );
    },
});

const clampCalculator = Object.freeze({
    id: 'css-clamp-calculator',
    category: 'color-css',
    icon: 'clamp',
    title: Object.freeze({ ar: 'حاسبة CSS clamp', en: 'CSS clamp() Calculator' }),
    description: Object.freeze({ ar: 'أنشئ قيمة CSS مرنة تتدرج بين حد أدنى وأقصى حسب عرض الشاشة.', en: 'Generate a fluid CSS value that scales between minimum and maximum viewport widths.' }),
    note: Object.freeze({ ar: 'النتيجة مناسبة لأحجام الخطوط والمسافات المرنة.', en: 'Useful for fluid typography and responsive spacing.' }),
    inputs: Object.freeze([
        numberInput('minSize', { ar: 'الحجم الأدنى', en: 'Minimum size' }, 16, { min: 0.01, unit: { ar: 'px', en: 'px' } }),
        numberInput('maxSize', { ar: 'الحجم الأقصى', en: 'Maximum size' }, 32, { min: 0.01, unit: { ar: 'px', en: 'px' } }),
        numberInput('minViewport', { ar: 'أقل عرض شاشة', en: 'Minimum viewport' }, 320, { min: 1, unit: { ar: 'px', en: 'px' } }),
        numberInput('maxViewport', { ar: 'أكبر عرض شاشة', en: 'Maximum viewport' }, 1200, { min: 1, unit: { ar: 'px', en: 'px' } }),
    ]),
    calculate(values, language) {
        if (values.maxSize <= values.minSize || values.maxViewport <= values.minViewport) {
            throw new Error(localized(language, 'يجب أن تكون القيم القصوى أكبر من القيم الدنيا.', 'Maximum values must be greater than minimum values.'));
        }
        const slope = (values.maxSize - values.minSize)
            / (values.maxViewport - values.minViewport);
        const intercept = values.minSize - (slope * values.minViewport);
        const preferredRem = intercept / 16;
        const viewportCoefficient = slope * 100;
        return output(
            `clamp(${formatter.format(values.minSize / 16)}rem, ${formatter.format(preferredRem)}rem + ${formatter.format(viewportCoefficient)}vw, ${formatter.format(values.maxSize / 16)}rem)`,
            localized(language, 'قيمة clamp()', 'clamp() value'),
        );
    },
});

const colorCssDefinitions = Object.freeze({
    [hexToRgb.id]: hexToRgb,
    [rgbToHex.id]: rgbToHex,
    [rgbToHslTool.id]: rgbToHslTool,
    [contrastChecker.id]: contrastChecker,
    [colorBlender.id]: colorBlender,
    [tintShade.id]: tintShade,
    [gradientGenerator.id]: gradientGenerator,
    [boxShadowGenerator.id]: boxShadowGenerator,
    [borderRadiusGenerator.id]: borderRadiusGenerator,
    [clampCalculator.id]: clampCalculator,
});

export { colorCssDefinitions };

// END OF FILE
