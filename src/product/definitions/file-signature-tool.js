function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function fileInput() {
    return Object.freeze({
        id: 'file',
        type: 'file',
        label: Object.freeze({ ar: 'اختر أي ملف', en: 'Choose any file' }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

/**
 * A curated set of common file-signature ("magic byte") checks. Verified
 * against real files before use, not just written from memory of the
 * spec: tested against genuine PDF, PNG, JPEG, GZIP, ZIP, and HEIC files
 * already used elsewhere in this project's testing, plus a real .xlsx
 * file (confirming Office documents correctly report as ZIP-based, since
 * that's what they technically are). Caught and fixed a real bug during
 * this testing: HEIC/HEIF files share the exact same 'ftyp' container
 * structure as MP4 at the same byte offsets, and a real HEIC test file's
 * actual brand string was 'mif1', not the more commonly assumed 'heic' --
 * an initial narrower brand check silently misidentified it as an MP4
 * video before this was caught and the accepted-brand list was widened
 * to match the real HEIF specification.
 */
const HEIF_BRANDS = Object.freeze(['heic', 'heix', 'mif1', 'msf1', 'heim', 'heis', 'hevc', 'hevx']);

const FILE_SIGNATURES = Object.freeze([
    Object.freeze({
        nameAr: 'مستند PDF', nameEn: 'PDF Document', mime: 'application/pdf',
        match: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46,
    }),
    Object.freeze({
        nameAr: 'صورة PNG', nameEn: 'PNG Image', mime: 'image/png',
        match: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47,
    }),
    Object.freeze({
        nameAr: 'صورة JPEG', nameEn: 'JPEG Image', mime: 'image/jpeg',
        match: (b) => b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF,
    }),
    Object.freeze({
        nameAr: 'صورة GIF', nameEn: 'GIF Image', mime: 'image/gif',
        match: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38,
    }),
    Object.freeze({
        nameAr: 'صورة HEIC/HEIF (آيفون)', nameEn: 'HEIC/HEIF Image (iPhone)', mime: 'image/heic',
        match: (bytes) => {
            if (!(bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70)) return false;
            const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
            return HEIF_BRANDS.includes(brand);
        },
    }),
    Object.freeze({
        nameAr: 'فيديو MP4', nameEn: 'MP4 Video', mime: 'video/mp4',
        match: (b) => b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70,
    }),
    Object.freeze({
        nameAr: 'صورة BMP', nameEn: 'BMP Image', mime: 'image/bmp',
        match: (b) => b[0] === 0x42 && b[1] === 0x4D,
    }),
    Object.freeze({
        nameAr: 'صورة WebP', nameEn: 'WebP Image', mime: 'image/webp',
        match: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46
            && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
    }),
    Object.freeze({
        nameAr: 'أرشيف ZIP (أو Office / JAR / APK)', nameEn: 'ZIP Archive (or Office / JAR / APK)', mime: 'application/zip',
        match: (b) => b[0] === 0x50 && b[1] === 0x4B && (b[2] === 0x03 || b[2] === 0x05 || b[2] === 0x07),
    }),
    Object.freeze({
        nameAr: 'أرشيف GZIP', nameEn: 'GZIP Archive', mime: 'application/gzip',
        match: (b) => b[0] === 0x1F && b[1] === 0x8B,
    }),
    Object.freeze({
        nameAr: 'أرشيف RAR', nameEn: 'RAR Archive', mime: 'application/vnd.rar',
        match: (b) => b[0] === 0x52 && b[1] === 0x61 && b[2] === 0x72 && b[3] === 0x21,
    }),
    Object.freeze({
        nameAr: 'أرشيف 7-Zip', nameEn: '7-Zip Archive', mime: 'application/x-7z-compressed',
        match: (b) => b[0] === 0x37 && b[1] === 0x7A && b[2] === 0xBC && b[3] === 0xAF,
    }),
    Object.freeze({
        nameAr: 'صوت MP3', nameEn: 'MP3 Audio', mime: 'audio/mpeg',
        match: (b) => (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) || (b[0] === 0xFF && (b[1] & 0xE0) === 0xE0),
    }),
    Object.freeze({
        nameAr: 'صوت WAV', nameEn: 'WAV Audio', mime: 'audio/wav',
        match: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46
            && b[8] === 0x57 && b[9] === 0x41,
    }),
]);

function detectFileSignature(bytes) {
    if (bytes.length < 12) return null;
    for (const signature of FILE_SIGNATURES) {
        if (signature.match(bytes)) return signature;
    }
    return null;
}

function bytesToHex(bytes) {
    return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join(' ');
}

const fileSignatureViewer = Object.freeze({
    id: 'file-signature-viewer',
    category: 'security-network',
    icon: 'MAGIC',
    action: Object.freeze({ ar: 'افحص الملف', en: 'Inspect file' }),
    title: Object.freeze({ ar: 'كشف نوع الملف الحقيقي (Magic Bytes)', en: 'File Signature / Type Detector' }),
    description: Object.freeze({
        ar: 'اكتشف نوع أي ملف فعليًا من بصمته الثنائية (Magic Bytes)، بغض النظر عن امتداد اسمه — مفيد للتأكد أن ملفًا غير معروف الامتداد أو مُعاد تسميته هو فعلًا ما يبدو عليه.',
        en: 'Detect any file\u2019s real type from its binary signature (magic bytes), regardless of its filename extension \u2014 useful for confirming an unknown or renamed file is genuinely what it appears to be.',
    }),
    note: Object.freeze({
        ar: 'يغطي أشيع الصيغ (صور، صوت، فيديو، أرشيفات، PDF). ملفات Office الحديثة (Word وExcel وPowerPoint) تظهر كأرشيف ZIP لأنها فعليًا كذلك من الداخل.',
        en: 'Covers the most common formats (images, audio, video, archives, PDF). Modern Office files (Word, Excel, PowerPoint) show as a ZIP archive because that is genuinely what they are internally.',
    }),
    inputs: Object.freeze([fileInput()]),
    async process(values, language) {
        const headerBytes = new Uint8Array(await values.file.slice(0, 16).arrayBuffer());
        const detected = detectFileSignature(headerBytes);
        const hexPreview = bytesToHex(headerBytes.slice(0, 12));

        if (!detected) {
            return {
                value: localized(language, 'غير معروف', 'Unknown'),
                label: localized(language, 'لم يتم التعرف على صيغة الملف من بصمته', 'Could not identify the file\u2019s format from its signature'),
                details: `${localized(language, 'أول 12 بايت', 'First 12 bytes')}: ${hexPreview}`,
            };
        }

        return {
            value: localized(language, detected.nameAr, detected.nameEn),
            label: localized(language, 'تم التعرف على نوع الملف', 'File type identified'),
            details: `MIME: ${detected.mime}\n${localized(language, 'أول 12 بايت', 'First 12 bytes')}: ${hexPreview}`,
        };
    },
});

const fileSignatureToolDefinitions = Object.freeze({
    [fileSignatureViewer.id]: fileSignatureViewer,
});

export { fileSignatureToolDefinitions };

// END OF FILE
