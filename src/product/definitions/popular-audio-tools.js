import { processAudio, processMedia } from '../ffmpeg-processing.js';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function audioInput() {
    return Object.freeze({
        id: 'audio',
        type: 'file',
        accept: 'audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/webm,audio/x-m4a,audio/aac,audio/flac,audio/opus,.mp3,.wav,.ogg,.m4a,.aac,.flac,.opus,.webm',
        label: Object.freeze({ ar: 'اختر ملفًا صوتيًا', en: 'Choose an audio file' }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function videoInput() {
    return Object.freeze({
        id: 'video',
        type: 'file',
        accept: 'video/mp4,.mp4',
        label: Object.freeze({ ar: 'اختر فيديو MP4', en: 'Choose an MP4 video' }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function selectInput(id, ar, en, options) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map((option) => Object.freeze({
            value: option.value,
            label: Object.freeze(option.label),
        }))),
    });
}

function outputName(file, suffix) {
    const base = file.name.replace(/\.[^.]+$/, '') || 'audio';
    return `adawaty-${base}-${suffix}.mp3`;
}

function result(blob, filename, language, ar, en) {
    return {
        value: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
        label: localized(language, ar, en),
        details: localized(language, 'تمت المعالجة محليًا على جهازك.', 'Processed locally on your device.'),
        download: { blob, filename },
    };
}

function noiseReductionFilter(level) {
    const noiseFloor = Object.freeze({ light: -20, balanced: -25, strong: -30 })[level] ?? -25;
    return `afftdn=nf=${noiseFloor}`;
}

function bassBoostFilter(gain) {
    const safeGain = Math.max(3, Math.min(18, Number(gain) || 6));
    return `bass=g=${safeGain}:f=110`;
}

const mp4ToMp3 = Object.freeze({
    id: 'mp4-to-mp3-converter', category: 'audio', icon: 'MP3',
    action: Object.freeze({ ar: 'حوّل إلى MP3', en: 'Convert to MP3' }),
    title: Object.freeze({ ar: 'تحويل MP4 إلى MP3', en: 'MP4 to MP3 Converter' }),
    description: Object.freeze({ ar: 'استخرج الصوت من فيديو MP4 واحفظه كملف MP3 عالي الجودة دون رفع الفيديو.', en: 'Extract audio from an MP4 video and save it as a high-quality MP3 without uploading the video.' }),
    note: Object.freeze({ ar: 'تتم المعالجة داخل المتصفح؛ قد تحتاج الفيديوهات الطويلة إلى وقت وذاكرة أكبر.', en: 'Processing happens in your browser; long videos may need more time and memory.' }),
    tags: Object.freeze(['mp4', 'mp3', 'video to audio', 'extract audio', 'converter', 'processing']),
    inputs: Object.freeze([videoInput()]),
    async process(values, language) {
        const blob = await processMedia(values.video, ['-vn', '-c:a', 'libmp3lame', '-q:a', '2'], 'audio.mp3', 'audio/mpeg');
        return result(blob, outputName(values.video, 'audio'), language, 'ملف MP3 جاهز', 'MP3 audio is ready');
    },
});

const audioNoiseRemover = Object.freeze({
    id: 'audio-noise-remover', category: 'audio', icon: 'DENOISE',
    action: Object.freeze({ ar: 'أزل الضوضاء', en: 'Remove noise' }),
    title: Object.freeze({ ar: 'إزالة الضوضاء من الصوت', en: 'Audio Noise Remover' }),
    description: Object.freeze({ ar: 'خفّض ضوضاء الخلفية الثابتة مثل الهسيس وصوت المروحة من التسجيلات الصوتية.', en: 'Reduce steady background noise such as hiss and fan sounds from audio recordings.' }),
    note: Object.freeze({ ar: 'اختر المستوى المتوازن أولًا؛ المعالجة القوية قد تؤثر في تفاصيل الصوت الهادئ.', en: 'Start with balanced mode; strong reduction may affect quiet audio details.' }),
    tags: Object.freeze(['audio', 'noise remover', 'denoise', 'background noise', 'voice', 'processing']),
    inputs: Object.freeze([audioInput(), selectInput('strength', 'قوة إزالة الضوضاء', 'Noise reduction strength', [
        { value: 'light', label: { ar: 'خفيفة', en: 'Light' } },
        { value: 'balanced', label: { ar: 'متوازنة', en: 'Balanced' } },
        { value: 'strong', label: { ar: 'قوية', en: 'Strong' } },
    ])]),
    async process(values, language) {
        const blob = await processAudio(values.audio, ['-af', noiseReductionFilter(values.strength), '-c:a', 'libmp3lame', '-b:a', '192k'], 'denoised.mp3', 'audio/mpeg');
        return result(blob, outputName(values.audio, 'denoised'), language, 'الصوت المنقّى جاهز', 'Cleaned audio is ready');
    },
});

const vocalRemover = Object.freeze({
    id: 'vocal-remover', category: 'audio', icon: 'VOCAL−',
    action: Object.freeze({ ar: 'أزل الغناء', en: 'Remove vocals' }),
    title: Object.freeze({ ar: 'إزالة الصوت البشري من الأغنية', en: 'Vocal Remover' }),
    description: Object.freeze({ ar: 'قلّل الغناء الموجود في منتصف قنوات Stereo لإنشاء مسار موسيقي مناسب للتدريب والكاريوكي.', en: 'Reduce centered vocals in stereo tracks to create an instrumental track for practice or karaoke.' }),
    note: Object.freeze({ ar: 'تختلف النتيجة حسب توزيع الأغنية؛ تعمل أفضل عندما يكون الغناء في المنتصف والآلات موزعة يمينًا ويسارًا.', en: 'Results depend on the mix and work best when vocals are centered and instruments are spread across stereo channels.' }),
    tags: Object.freeze(['vocal remover', 'karaoke', 'instrumental', 'audio', 'music', 'processing']),
    inputs: Object.freeze([audioInput()]),
    async process(values, language) {
        const blob = await processAudio(values.audio, ['-af', 'pan=stereo|c0=c0-c1|c1=c1-c0', '-c:a', 'libmp3lame', '-b:a', '192k'], 'instrumental.mp3', 'audio/mpeg');
        return result(blob, outputName(values.audio, 'instrumental'), language, 'المسار الموسيقي جاهز', 'Instrumental track is ready');
    },
});

const audioNormalizer = Object.freeze({
    id: 'audio-normalizer', category: 'audio', icon: 'LUFS',
    action: Object.freeze({ ar: 'وحّد مستوى الصوت', en: 'Normalize audio' }),
    title: Object.freeze({ ar: 'توحيد مستوى الصوت', en: 'Audio Normalizer' }),
    description: Object.freeze({ ar: 'وازن مستوى الصوت تلقائيًا إلى معيار مناسب للبودكاست والفيديو مع تقليل القفزات المزعجة.', en: 'Automatically balance loudness to a podcast- and video-friendly target while reducing jarring volume changes.' }),
    note: Object.freeze({ ar: 'تستخدم الأداة معيار Loudness عند ‎-16 LUFS وحد ذروة آمن.', en: 'The tool targets -16 LUFS with a safe true-peak limit.' }),
    tags: Object.freeze(['audio normalizer', 'loudness', 'lufs', 'podcast', 'volume', 'processing']),
    inputs: Object.freeze([audioInput()]),
    async process(values, language) {
        const blob = await processAudio(values.audio, ['-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-c:a', 'libmp3lame', '-b:a', '192k'], 'normalized.mp3', 'audio/mpeg');
        return result(blob, outputName(values.audio, 'normalized'), language, 'الصوت الموحّد جاهز', 'Normalized audio is ready');
    },
});

const bassBooster = Object.freeze({
    id: 'bass-booster', category: 'audio', icon: 'BASS+',
    action: Object.freeze({ ar: 'عزّز الـBass', en: 'Boost bass' }),
    title: Object.freeze({ ar: 'تعزيز الـBass في الصوت', en: 'Bass Booster' }),
    description: Object.freeze({ ar: 'قوِّ الترددات المنخفضة في الموسيقى والتسجيلات بدرجات آمنة قابلة للاختيار.', en: 'Boost low frequencies in music and recordings using selectable, safe strength levels.' }),
    note: Object.freeze({ ar: 'ابدأ بتعزيز متوسط لتجنب التشويه مع الملفات مرتفعة الصوت.', en: 'Start with medium boost to avoid distortion on already loud files.' }),
    tags: Object.freeze(['bass booster', 'audio enhancer', 'music', 'equalizer', 'mp3', 'processing']),
    inputs: Object.freeze([audioInput(), selectInput('gain', 'قوة التعزيز', 'Boost strength', [
        { value: '3', label: { ar: 'خفيفة', en: 'Light' } },
        { value: '6', label: { ar: 'متوسطة', en: 'Medium' } },
        { value: '12', label: { ar: 'قوية', en: 'Strong' } },
    ])]),
    async process(values, language) {
        const blob = await processAudio(values.audio, ['-af', bassBoostFilter(values.gain), '-c:a', 'libmp3lame', '-b:a', '192k'], 'bass-boosted.mp3', 'audio/mpeg');
        return result(blob, outputName(values.audio, 'bass-boosted'), language, 'الصوت المحسّن جاهز', 'Bass-boosted audio is ready');
    },
});

const popularAudioToolDefinitions = Object.freeze({
    [mp4ToMp3.id]: mp4ToMp3,
    [audioNoiseRemover.id]: audioNoiseRemover,
    [vocalRemover.id]: vocalRemover,
    [audioNormalizer.id]: audioNormalizer,
    [bassBooster.id]: bassBooster,
});

export { bassBoostFilter, noiseReductionFilter, popularAudioToolDefinitions };

// END OF FILE
