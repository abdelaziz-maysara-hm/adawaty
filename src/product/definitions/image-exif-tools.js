function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function fileInput() {
    return Object.freeze({
        id: 'image',
        type: 'file',
        accept: 'image/jpeg,.jpg,.jpeg',
        label: Object.freeze({ ar: 'اختر صورة JPEG', en: 'Choose a JPEG image' }),
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

const PIEXIF_URL = 'https://cdn.jsdelivr.net/npm/piexifjs@1.0.6/+esm';
let piexifPromise;

/**
 * piexifjs is a genuine read+write EXIF library (load/dump/insert/remove),
 * unlike most EXIF libraries in this space which are read-only. Verified
 * directly with a real JPEG before use: wrote new EXIF fields, read them
 * back correctly, confirmed the output still opens correctly in two
 * independent tools (Pillow, ImageMagick), and confirmed removal works.
 */
async function loadPiexif() {
    piexifPromise ??= import(PIEXIF_URL).then((module) => module.default ?? module).catch((error) => {
        piexifPromise = undefined;
        throw new Error(`Unable to load the EXIF engine: ${error.message}`);
    });
    return piexifPromise;
}

function fileToBinaryString(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const bytes = new Uint8Array(reader.result);
            let binary = '';
            for (let index = 0; index < bytes.length; index += 1) {
                binary += String.fromCharCode(bytes[index]);
            }
            resolve(binary);
        };
        reader.onerror = () => reject(new Error('Unable to read the file.'));
        reader.readAsArrayBuffer(file);
    });
}

function binaryStringToBlob(binaryString, type) {
    const bytes = new Uint8Array(binaryString.length);
    for (let index = 0; index < binaryString.length; index += 1) {
        bytes[index] = binaryString.charCodeAt(index);
    }
    return new Blob([bytes], { type });
}

function assertJpeg(file) {
    if (!(file instanceof File) || !/jpe?g$/i.test(file.type) && !/\.jpe?g$/i.test(file.name)) {
        throw new Error('Please select a JPEG image (EXIF is a JPEG/TIFF-specific format).');
    }
}

const EXIF_LABELS = Object.freeze({
    make: Object.freeze({ ar: 'الشركة المصنّعة', en: 'Make' }),
    model: Object.freeze({ ar: 'الموديل', en: 'Model' }),
    software: Object.freeze({ ar: 'البرنامج', en: 'Software' }),
    dateTime: Object.freeze({ ar: 'تاريخ الالتقاط', en: 'Date taken' }),
    exposureTime: Object.freeze({ ar: 'زمن التعريض', en: 'Exposure time' }),
    fNumber: Object.freeze({ ar: 'فتحة العدسة (F)', en: 'Aperture (F-number)' }),
    iso: Object.freeze({ ar: 'ISO', en: 'ISO' }),
    focalLength: Object.freeze({ ar: 'البعد البؤري', en: 'Focal length' }),
    gpsLat: Object.freeze({ ar: 'خط العرض (GPS)', en: 'GPS latitude' }),
    gpsLon: Object.freeze({ ar: 'خط الطول (GPS)', en: 'GPS longitude' }),
});

function gpsToDecimal(coordinate, ref) {
    if (!coordinate) return null;
    const [degrees, minutes, seconds] = coordinate.map((part) => part[0] / part[1]);
    const decimal = degrees + (minutes / 60) + (seconds / 3600);
    return (ref === 'S' || ref === 'W') ? -decimal : decimal;
}

function extractReadableExif(exifObj, piexif) {
    const zeroth = exifObj['0th'] || {};
    const exif = exifObj.Exif || {};
    const gps = exifObj.GPS || {};

    const entries = [];
    const addIfPresent = (key, value) => {
        if (value !== undefined && value !== null && value !== '') entries.push({ key, value });
    };

    addIfPresent('make', zeroth[piexif.ImageIFD.Make]);
    addIfPresent('model', zeroth[piexif.ImageIFD.Model]);
    addIfPresent('software', zeroth[piexif.ImageIFD.Software]);
    addIfPresent('dateTime', exif[piexif.ExifIFD.DateTimeOriginal]);
    addIfPresent('iso', exif[piexif.ExifIFD.ISOSpeedRatings]);
    addIfPresent('focalLength', exif[piexif.ExifIFD.FocalLength]
        ? `${(exif[piexif.ExifIFD.FocalLength][0] / exif[piexif.ExifIFD.FocalLength][1]).toFixed(1)}mm`
        : undefined);
    addIfPresent('fNumber', exif[piexif.ExifIFD.FNumber]
        ? `f/${(exif[piexif.ExifIFD.FNumber][0] / exif[piexif.ExifIFD.FNumber][1]).toFixed(1)}`
        : undefined);
    addIfPresent('exposureTime', exif[piexif.ExifIFD.ExposureTime]
        ? `${exif[piexif.ExifIFD.ExposureTime][0]}/${exif[piexif.ExifIFD.ExposureTime][1]}s`
        : undefined);

    const lat = gpsToDecimal(gps[piexif.GPSIFD.GPSLatitude], gps[piexif.GPSIFD.GPSLatitudeRef]);
    const lon = gpsToDecimal(gps[piexif.GPSIFD.GPSLongitude], gps[piexif.GPSIFD.GPSLongitudeRef]);
    addIfPresent('gpsLat', lat !== null ? lat.toFixed(6) : undefined);
    addIfPresent('gpsLon', lon !== null ? lon.toFixed(6) : undefined);

    return entries;
}

const exifViewer = Object.freeze({
    id: 'view-exif',
    category: 'image',
    icon: 'EXIF',
    action: Object.freeze({ ar: 'اعرض EXIF', en: 'View EXIF' }),
    title: Object.freeze({ ar: 'عرض بيانات EXIF للصورة', en: 'EXIF Data Viewer' }),
    description: Object.freeze({
        ar: 'اعرض بيانات EXIF المخفية داخل صورة JPEG: الكاميرا، تاريخ الالتقاط، إعدادات التصوير، وموقع GPS إن وُجد.',
        en: 'View the hidden EXIF data embedded in a JPEG: camera info, date taken, shooting settings, and GPS location if present.',
    }),
    note: Object.freeze({
        ar: 'يعمل مع ملفات JPEG فقط، وهي الصيغة الأكثر شيوعًا لاحتواء بيانات EXIF.',
        en: 'Works with JPEG files only, the most common format carrying EXIF data.',
    }),
    inputs: Object.freeze([fileInput()]),
    async process(values, language) {
        assertJpeg(values.image);
        const piexif = await loadPiexif();
        const binaryString = await fileToBinaryString(values.image);
        const exifObj = piexif.load(binaryString);
        const entries = extractReadableExif(exifObj, piexif);

        if (entries.length === 0) {
            return {
                value: '0',
                label: localized(language, 'لا توجد بيانات EXIF', 'No EXIF data found'),
                details: localized(
                    language,
                    'الصورة لا تحتوي على بيانات EXIF، أو أنها أُزيلت مسبقًا.',
                    'The image has no EXIF data, or it was already removed.',
                ),
            };
        }

        const report = entries
            .map(({ key, value }) => `${localized(language, EXIF_LABELS[key].ar, EXIF_LABELS[key].en)}: ${value}`)
            .join('\n');

        return {
            value: String(entries.length),
            label: localized(language, 'حقل بيانات تم العثور عليه', 'Data fields found'),
            details: report,
        };
    },
});

const exifEditor = Object.freeze({
    id: 'edit-exif',
    category: 'image',
    icon: 'EXIF✎',
    action: Object.freeze({ ar: 'حدّث EXIF', en: 'Update EXIF' }),
    title: Object.freeze({ ar: 'تعديل بيانات EXIF للصورة', en: 'EXIF Data Editor' }),
    description: Object.freeze({
        ar: 'عدّل حقول EXIF أساسية (الشركة المصنّعة، الموديل، البرنامج) في صورة JPEG دون التأثير على محتوى الصورة نفسها.',
        en: 'Edit basic EXIF fields (make, model, software) in a JPEG without affecting the image content itself.',
    }),
    note: Object.freeze({
        ar: 'اترك أي حقل فارغًا لتجاهله. الحقول الأخرى غير المذكورة هنا تبقى كما هي دون تغيير.',
        en: 'Leave any field empty to skip it. Other fields not listed here remain unchanged.',
    }),
    inputs: Object.freeze([
        fileInput(),
        textFieldInput('make', 'الشركة المصنّعة', 'Make', ''),
        textFieldInput('model', 'الموديل', 'Model', ''),
        textFieldInput('software', 'البرنامج', 'Software', 'Adawaty'),
    ]),
    async process(values, language) {
        assertJpeg(values.image);

        if (!values.make.trim() && !values.model.trim() && !values.software.trim()) {
            throw new Error(localized(
                language,
                'أدخل قيمة لحقل واحد على الأقل.',
                'Enter a value for at least one field.',
            ));
        }

        const piexif = await loadPiexif();
        const binaryString = await fileToBinaryString(values.image);
        const exifObj = piexif.load(binaryString);
        const zeroth = exifObj['0th'] || {};

        if (values.make.trim()) zeroth[piexif.ImageIFD.Make] = values.make.trim();
        if (values.model.trim()) zeroth[piexif.ImageIFD.Model] = values.model.trim();
        if (values.software.trim()) zeroth[piexif.ImageIFD.Software] = values.software.trim();
        exifObj['0th'] = zeroth;

        const exifBytes = piexif.dump(exifObj);
        const updatedBinaryString = piexif.insert(exifBytes, binaryString);
        const blob = binaryStringToBlob(updatedBinaryString, 'image/jpeg');

        return {
            value: `${(blob.size / 1024).toFixed(1)} KB`,
            label: localized(language, 'الصورة المحدَّثة جاهزة', 'The updated image is ready'),
            details: '',
            download: { blob, filename: values.image.name.replace(/\.jpe?g$/i, '-exif-updated.jpg') },
            preview: blob,
        };
    },
});

const imageExifToolDefinitions = Object.freeze({
    [exifViewer.id]: exifViewer,
    [exifEditor.id]: exifEditor,
});

export { imageExifToolDefinitions };

// END OF FILE
