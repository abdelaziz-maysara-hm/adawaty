import { processMedia } from '../ffmpeg-processing.js';

function localized(language, ar, en) { return language === 'ar' ? ar : en; }
function gifInput() { return Object.freeze({ id: 'gif', type: 'file', accept: 'image/gif,.gif', label: Object.freeze({ ar: 'اختر ملف GIF', en: 'Choose a GIF file' }), unit: Object.freeze({ ar: '', en: '' }) }); }
function numberInput(id, ar, en, min, max, value, unitAr = '', unitEn = '') { return Object.freeze({ id, type: 'number', min, max, defaultValue: value, label: Object.freeze({ ar, en }), unit: Object.freeze({ ar: unitAr, en: unitEn }) }); }
function assertGif(file, language) { if (!(file instanceof File) || !/\.gif$/i.test(file.name)) throw new Error(localized(language, 'اختر ملف GIF صالحًا.', 'Choose a valid GIF file.')); }
function name(file, suffix, extension = 'gif') { return `${file.name.replace(/\.gif$/i, '')}-${suffix}.${extension}`; }
function output(blob, filename, language, ar, en) { return { value: localized(language, 'تمت المعالجة', 'Processing complete'), label: localized(language, ar, en), details: `${(blob.size / 1024).toFixed(1)} KB`, download: { blob, filename } }; }

function gifScaleFilter(width, height) {
    const w = Math.max(16, Math.min(4096, Math.round(Number(width) || 640)));
    const h = Math.max(16, Math.min(4096, Math.round(Number(height) || 480)));
    return `scale=${w}:${h}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=black@0`;
}

function speedFactor(value) { return Math.max(0.25, Math.min(4, Number(value) || 1)); }

const gifCompressor = Object.freeze({
    id: 'gif-compressor', category: 'image', icon: 'GIF↓', action: Object.freeze({ ar: 'اضغط GIF', en: 'Compress GIF' }),
    title: Object.freeze({ ar: 'ضغط صور GIF المتحركة', en: 'GIF Compressor' }),
    description: Object.freeze({ ar: 'قلّل حجم GIF المتحرك بخفض معدل الإطارات والألوان مع الحفاظ على الحركة.', en: 'Reduce animated GIF size by optimizing frame rate and colors while preserving animation.' }),
    note: Object.freeze({ ar: 'تتم المعالجة محليًا وقد تستغرق الملفات الطويلة وقتًا.', en: 'Processing stays local; long animations may take time.' }), tags: Object.freeze(['gif', 'compress', 'animation', 'reduce size', 'image', 'processing']),
    inputs: Object.freeze([gifInput(), numberInput('fps', 'الإطارات في الثانية', 'Frames per second', 5, 30, 15, 'إطار/ث', 'fps')]),
    async process(values, language) { assertGif(values.gif, language); const fps = Math.max(5, Math.min(30, Math.round(Number(values.fps) || 15))); const blob = await processMedia(values.gif, ['-vf', `fps=${fps},split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3`, '-loop', '0'], 'compressed.gif', 'image/gif'); return output(blob, name(values.gif, 'compressed'), language, 'ملف GIF المضغوط جاهز', 'Compressed GIF is ready'); },
});

const gifSpeed = Object.freeze({
    id: 'gif-speed-changer', category: 'image', icon: 'GIF×', action: Object.freeze({ ar: 'غيّر السرعة', en: 'Change speed' }),
    title: Object.freeze({ ar: 'تغيير سرعة GIF', en: 'GIF Speed Changer' }),
    description: Object.freeze({ ar: 'سرّع أو أبطئ حركة GIF بنسبة من ربع السرعة إلى أربعة أضعاف.', en: 'Speed up or slow down a GIF animation from quarter speed to four times faster.' }),
    note: Object.freeze({ ar: 'تعمل الأداة محليًا وتحافظ على تكرار الحركة.', en: 'The tool runs locally and preserves animation looping.' }), tags: Object.freeze(['gif', 'speed', 'slow motion', 'animation', 'image', 'processing']),
    inputs: Object.freeze([gifInput(), numberInput('speed', 'معامل السرعة', 'Speed multiplier', 0.25, 4, 1, '×', '×')]),
    async process(values, language) { assertGif(values.gif, language); const factor = speedFactor(values.speed); const blob = await processMedia(values.gif, ['-filter_complex', `[0:v]setpts=PTS/${factor},split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`, '-loop', '0'], 'speed.gif', 'image/gif'); return output(blob, name(values.gif, 'speed'), language, 'ملف GIF بالسرعة الجديدة جاهز', 'Updated-speed GIF is ready'); },
});

const gifResizer = Object.freeze({
    id: 'gif-resizer', category: 'image', icon: 'GIF↔', action: Object.freeze({ ar: 'غيّر الأبعاد', en: 'Resize GIF' }),
    title: Object.freeze({ ar: 'تغيير أبعاد GIF', en: 'GIF Resizer' }),
    description: Object.freeze({ ar: 'غيّر عرض وارتفاع GIF المتحرك مع الحفاظ على النسبة وإضافة مساحة شفافة عند الحاجة.', en: 'Resize an animated GIF while preserving aspect ratio and adding transparent padding when needed.' }),
    note: Object.freeze({ ar: 'الحد الأقصى 4096 بكسل لكل بُعد.', en: 'Maximum size is 4096 pixels per dimension.' }), tags: Object.freeze(['gif', 'resize', 'dimensions', 'animation', 'image', 'processing']),
    inputs: Object.freeze([gifInput(), numberInput('width', 'العرض', 'Width', 16, 4096, 640, 'بكسل', 'px'), numberInput('height', 'الارتفاع', 'Height', 16, 4096, 480, 'بكسل', 'px')]),
    async process(values, language) { assertGif(values.gif, language); const filter = `${gifScaleFilter(values.width, values.height)},split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`; const blob = await processMedia(values.gif, ['-vf', filter, '-loop', '0'], 'resized.gif', 'image/gif'); return output(blob, name(values.gif, 'resized'), language, 'ملف GIF بالحجم الجديد جاهز', 'Resized GIF is ready'); },
});

const gifToMp4 = Object.freeze({
    id: 'gif-to-mp4-converter', category: 'video', icon: 'GIF→MP4', action: Object.freeze({ ar: 'حوّل إلى MP4', en: 'Convert to MP4' }),
    title: Object.freeze({ ar: 'تحويل GIF إلى MP4', en: 'GIF to MP4 Converter' }),
    description: Object.freeze({ ar: 'حوّل GIF المتحرك إلى فيديو MP4 متوافق وأصغر حجمًا للمشاركة.', en: 'Convert an animated GIF into a compatible, usually smaller MP4 video for sharing.' }),
    note: Object.freeze({ ar: 'الفيديو الناتج بلا صوت ويكرر الحركة مرة واحدة.', en: 'The output video has no audio and plays the animation once.' }), tags: Object.freeze(['gif', 'mp4', 'video', 'converter', 'animation', 'processing']), inputs: Object.freeze([gifInput()]),
    async process(values, language) { assertGif(values.gif, language); const blob = await processMedia(values.gif, ['-movflags', '+faststart', '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2:flags=lanczos', '-an'], 'converted.mp4', 'video/mp4'); return output(blob, name(values.gif, 'converted', 'mp4'), language, 'فيديو MP4 جاهز', 'MP4 video is ready'); },
});

const gifReverser = Object.freeze({
    id: 'gif-reverser', category: 'image', icon: 'GIF↶', action: Object.freeze({ ar: 'اعكس الحركة', en: 'Reverse GIF' }),
    title: Object.freeze({ ar: 'عكس حركة GIF', en: 'Reverse GIF Animation' }),
    description: Object.freeze({ ar: 'اعكس ترتيب إطارات GIF لتعمل الحركة من النهاية إلى البداية.', en: 'Reverse GIF frame order so the animation plays from end to beginning.' }),
    note: Object.freeze({ ar: 'تتم المعالجة محليًا وقد تحتاج الذاكرة مع الملفات الطويلة.', en: 'Processing is local and long GIFs may require more memory.' }), tags: Object.freeze(['gif', 'reverse', 'animation', 'image', 'effects', 'processing']), inputs: Object.freeze([gifInput()]),
    async process(values, language) { assertGif(values.gif, language); const blob = await processMedia(values.gif, ['-filter_complex', '[0:v]reverse,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse', '-loop', '0'], 'reversed.gif', 'image/gif'); return output(blob, name(values.gif, 'reversed'), language, 'ملف GIF المعكوس جاهز', 'Reversed GIF is ready'); },
});

const gifProcessingToolDefinitions = Object.freeze({ [gifCompressor.id]: gifCompressor, [gifSpeed.id]: gifSpeed, [gifResizer.id]: gifResizer, [gifToMp4.id]: gifToMp4, [gifReverser.id]: gifReverser });
export { gifProcessingToolDefinitions, gifScaleFilter, speedFactor };

// END OF FILE
