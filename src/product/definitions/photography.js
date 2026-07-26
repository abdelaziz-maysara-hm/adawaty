const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 });

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
}

function field(id, ar, en, placeholder, options = {}) {
    return Object.freeze({
        id,
        type: 'number',
        min: options.min ?? 0,
        max: options.max ?? 1e15,
        step: options.step ?? 0.01,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze(options.unit ?? { ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

function tool(config) {
    return Object.freeze({
        id: config.id,
        category: 'image',
        icon: config.icon,
        title: Object.freeze(config.title),
        description: Object.freeze(config.description),
        note: Object.freeze(config.note),
        inputs: Object.freeze(config.inputs),
        calculate: config.calculate,
    });
}

function amount(value, unit = '') {
    return `${formatter.format(value)}${unit ? ` ${unit}` : ''}`;
}

function hyperfocalDistance(focalLength, aperture, circle) {
    const focalMetres = focalLength / 1000;
    return focalMetres ** 2 / (aperture * circle / 1000) + focalMetres;
}

const depthOfField = tool({
    id: 'depth-of-field-calculator',
    icon: 'DOF',
    title: { ar: 'حاسبة عمق المجال', en: 'Depth of Field Calculator' },
    description: { ar: 'احسب حدود عمق المجال القريب والبعيد من إعدادات العدسة.', en: 'Calculate near and far depth-of-field limits from lens settings.' },
    note: { ar: 'أدخل البعد البؤري ودائرة الالتباس بالملليمتر ومسافة الهدف بالمتر.', en: 'Enter focal length and circle of confusion in millimetres, subject distance in metres.' },
    inputs: [
        field('focalLength', 'البعد البؤري', 'Focal length', 50, { min: 0.1, unit: { ar: 'مم', en: 'mm' } }),
        field('aperture', 'فتحة العدسة', 'Aperture', 2.8, { min: 0.1 }),
        field('circle', 'دائرة الالتباس', 'Circle of confusion', 0.03, { min: 0.0001, unit: { ar: 'مم', en: 'mm' } }),
        field('distance', 'مسافة الهدف', 'Subject distance', 5, { min: 0.001, unit: { ar: 'م', en: 'm' } }),
    ],
    calculate(values, language) {
        const focalMetres = values.focalLength / 1000;
        const hyperfocal = hyperfocalDistance(values.focalLength, values.aperture, values.circle);
        const near = hyperfocal * values.distance / (hyperfocal + values.distance - focalMetres);
        const denominator = hyperfocal - values.distance + focalMetres;
        const far = denominator <= 0 ? localized(language, 'اللانهاية', 'Infinity') : amount(hyperfocal * values.distance / denominator, 'm');
        return output(`${localized(language, 'القريب', 'Near')}: ${amount(near, 'm')}\n${localized(language, 'البعيد', 'Far')}: ${far}`, localized(language, 'حدود عمق المجال', 'Depth of field limits'));
    },
});

const exposureValue = tool({
    id: 'camera-exposure-value-calculator',
    icon: 'EV',
    title: { ar: 'حاسبة قيمة التعريض', en: 'Camera Exposure Value Calculator' },
    description: { ar: 'احسب قيمة التعريض EV من فتحة العدسة وسرعة الغالق.', en: 'Calculate exposure value from aperture and shutter time.' },
    note: { ar: 'الحساب عند ISO 100 ويستخدم EV = log₂(N²/t).', en: 'Calculated at ISO 100 using EV = log₂(N²/t).' },
    inputs: [
        field('aperture', 'فتحة العدسة', 'Aperture', 8, { min: 0.1 }),
        field('shutter', 'زمن الغالق', 'Shutter time', 0.008, { min: 0.000001, unit: { ar: 'ثانية', en: 'seconds' } }),
    ],
    calculate: (values, language) => output(amount(Math.log2(values.aperture ** 2 / values.shutter), 'EV'), localized(language, 'قيمة التعريض', 'Exposure value')),
});

const shutterAngle = tool({
    id: 'shutter-angle-calculator',
    icon: '180°',
    title: { ar: 'حاسبة زاوية الغالق', en: 'Shutter Angle Calculator' },
    description: { ar: 'حوّل زمن التعريض ومعدل الإطارات إلى زاوية غالق.', en: 'Convert exposure time and frame rate to shutter angle.' },
    note: { ar: 'زاوية 180° شائعة للحصول على حركة طبيعية.', en: 'A 180° shutter is common for natural motion blur.' },
    inputs: [
        field('shutter', 'زمن التعريض', 'Exposure time', 0.020833, { min: 0.000001, unit: { ar: 'ثانية', en: 'seconds' } }),
        field('fps', 'معدل الإطارات', 'Frame rate', 24, { min: 0.001, unit: { ar: 'إطار/ث', en: 'fps' } }),
    ],
    calculate: (values, language) => output(amount(values.shutter * values.fps * 360, '°'), localized(language, 'زاوية الغالق', 'Shutter angle')),
});

const hyperfocal = tool({
    id: 'hyperfocal-distance-calculator',
    icon: 'H',
    title: { ar: 'حاسبة المسافة فائقة البؤرة', en: 'Hyperfocal Distance Calculator' },
    description: { ar: 'احسب مسافة التركيز التي تعطي أكبر عمق مجال حتى اللانهاية.', en: 'Calculate the focus distance that maximizes depth of field to infinity.' },
    note: { ar: 'تعتمد النتيجة على البعد البؤري والفتحة ودائرة الالتباس.', en: 'Depends on focal length, aperture and circle of confusion.' },
    inputs: [
        field('focalLength', 'البعد البؤري', 'Focal length', 35, { min: 0.1, unit: { ar: 'مم', en: 'mm' } }),
        field('aperture', 'فتحة العدسة', 'Aperture', 8, { min: 0.1 }),
        field('circle', 'دائرة الالتباس', 'Circle of confusion', 0.03, { min: 0.0001, unit: { ar: 'مم', en: 'mm' } }),
    ],
    calculate: (values, language) => output(amount(hyperfocalDistance(values.focalLength, values.aperture, values.circle), 'm'), localized(language, 'المسافة فائقة البؤرة', 'Hyperfocal distance')),
});

const equivalentFocal = tool({
    id: 'crop-factor-focal-length-calculator',
    icon: 'FF',
    title: { ar: 'حاسبة البعد البؤري المكافئ', en: 'Crop Factor Focal Length Calculator' },
    description: { ar: 'احسب البعد البؤري المكافئ لكاميرا بإطار كامل.', en: 'Calculate full-frame-equivalent focal length from crop factor.' },
    note: { ar: 'لا يغير معامل القص البعد البؤري الحقيقي للعدسة.', en: 'Crop factor does not change the lens physical focal length.' },
    inputs: [
        field('focalLength', 'البعد البؤري الحقيقي', 'Actual focal length', 35, { min: 0.1, unit: { ar: 'مم', en: 'mm' } }),
        field('cropFactor', 'معامل القص', 'Crop factor', 1.5, { min: 0.01 }),
    ],
    calculate: (values, language) => output(amount(values.focalLength * values.cropFactor, 'mm'), localized(language, 'البعد المكافئ', 'Equivalent focal length')),
});

const megapixels = tool({
    id: 'image-megapixel-calculator',
    icon: 'MP',
    title: { ar: 'حاسبة ميجابكسل الصورة', en: 'Image Megapixel Calculator' },
    description: { ar: 'احسب دقة الصورة بالميجابكسل من العرض والارتفاع.', en: 'Calculate image resolution in megapixels from width and height.' },
    note: { ar: 'الميجابكسل يساوي مليون بكسل.', en: 'One megapixel equals one million pixels.' },
    inputs: [
        field('width', 'العرض', 'Width', 6000, { min: 1, step: 1, unit: { ar: 'بكسل', en: 'px' } }),
        field('height', 'الارتفاع', 'Height', 4000, { min: 1, step: 1, unit: { ar: 'بكسل', en: 'px' } }),
    ],
    calculate: (values, language) => output(amount(values.width * values.height / 1e6, 'MP'), localized(language, 'دقة الصورة', 'Image resolution')),
});

const printSize = tool({
    id: 'photo-print-size-calculator',
    icon: 'DPI',
    title: { ar: 'حاسبة حجم طباعة الصورة', en: 'Photo Print Size Calculator' },
    description: { ar: 'احسب أبعاد الطباعة من أبعاد الصورة وكثافة الطباعة.', en: 'Calculate print dimensions from pixel size and print density.' },
    note: { ar: '300 DPI معيار شائع للطباعة عالية الجودة.', en: '300 DPI is common for high-quality printing.' },
    inputs: [
        field('width', 'عرض الصورة', 'Image width', 6000, { min: 1, step: 1, unit: { ar: 'بكسل', en: 'px' } }),
        field('height', 'ارتفاع الصورة', 'Image height', 4000, { min: 1, step: 1, unit: { ar: 'بكسل', en: 'px' } }),
        field('dpi', 'دقة الطباعة', 'Print density', 300, { min: 1, unit: { ar: 'نقطة/بوصة', en: 'DPI' } }),
    ],
    calculate(values, language) {
        const width = values.width / values.dpi;
        const height = values.height / values.dpi;
        return output(`${amount(width)} × ${amount(height)} in`, localized(language, 'حجم الطباعة', 'Print size'), `${amount(width * 2.54)} × ${amount(height * 2.54)} cm`);
    },
});

const photoStorage = tool({
    id: 'photo-storage-capacity-calculator',
    icon: 'CARD',
    title: { ar: 'حاسبة سعة تخزين الصور', en: 'Photo Storage Capacity Calculator' },
    description: { ar: 'قدّر عدد الصور التي تتسع لها بطاقة ذاكرة.', en: 'Estimate how many photos fit on a memory card.' },
    note: { ar: 'الحجم الفعلي للصورة يختلف باختلاف المحتوى والضغط.', en: 'Actual photo size varies with content and compression.' },
    inputs: [
        field('storage', 'سعة التخزين', 'Storage capacity', 64, { min: 0.001, unit: { ar: 'جيجابايت', en: 'GB' } }),
        field('photoSize', 'متوسط حجم الصورة', 'Average photo size', 25, { min: 0.001, unit: { ar: 'ميجابايت', en: 'MB' } }),
    ],
    calculate: (values, language) => output(Math.floor(values.storage * 1000 / values.photoSize), localized(language, 'عدد الصور التقريبي', 'Estimated photo count')),
});

const timelapse = tool({
    id: 'timelapse-duration-calculator',
    icon: 'TL',
    title: { ar: 'حاسبة مدة فيديو التايم لابس', en: 'Timelapse Duration Calculator' },
    description: { ar: 'احسب عدد اللقطات ومدة الفيديو الناتج من فترة التصوير.', en: 'Calculate frame count and output duration from a timelapse session.' },
    note: { ar: 'يشمل الحساب لقطة البداية.', en: 'The calculation includes the initial frame.' },
    inputs: [
        field('shootMinutes', 'مدة التصوير', 'Shoot duration', 60, { min: 0.001, unit: { ar: 'دقيقة', en: 'minutes' } }),
        field('interval', 'الفاصل بين اللقطات', 'Shot interval', 5, { min: 0.001, unit: { ar: 'ثانية', en: 'seconds' } }),
        field('fps', 'إطارات الفيديو الناتج', 'Output frame rate', 30, { min: 0.001, unit: { ar: 'إطار/ث', en: 'fps' } }),
    ],
    calculate(values, language) {
        const frames = Math.floor(values.shootMinutes * 60 / values.interval) + 1;
        return output(amount(frames / values.fps, 'seconds'), localized(language, 'مدة الفيديو الناتج', 'Output video duration'), `${localized(language, 'عدد اللقطات', 'Frames')}: ${frames}`);
    },
});

const ndExposure = tool({
    id: 'nd-filter-exposure-calculator',
    icon: 'ND',
    title: { ar: 'حاسبة تعريض فلتر ND', en: 'ND Filter Exposure Calculator' },
    description: { ar: 'احسب زمن التعريض الجديد بعد إضافة فلتر كثافة محايدة.', en: 'Calculate new exposure time after adding a neutral-density filter.' },
    note: { ar: 'كل وقفة ضوئية تضاعف زمن التعريض.', en: 'Each stop doubles exposure time.' },
    inputs: [
        field('baseExposure', 'زمن التعريض الأساسي', 'Base exposure', 0.008, { min: 0.000001, unit: { ar: 'ثانية', en: 'seconds' } }),
        field('stops', 'قوة الفلتر بالوقفات', 'Filter stops', 10, { min: 0, max: 30 }),
    ],
    calculate: (values, language) => output(amount(values.baseExposure * 2 ** values.stops, 'seconds'), localized(language, 'زمن التعريض الجديد', 'New exposure time')),
});

const photographyDefinitions = Object.freeze({
    [depthOfField.id]: depthOfField,
    [exposureValue.id]: exposureValue,
    [shutterAngle.id]: shutterAngle,
    [hyperfocal.id]: hyperfocal,
    [equivalentFocal.id]: equivalentFocal,
    [megapixels.id]: megapixels,
    [printSize.id]: printSize,
    [photoStorage.id]: photoStorage,
    [timelapse.id]: timelapse,
    [ndExposure.id]: ndExposure,
});

export { photographyDefinitions };

// END OF FILE
