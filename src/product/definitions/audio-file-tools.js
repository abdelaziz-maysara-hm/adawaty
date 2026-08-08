import {
    audioBufferToWavBlob,
    changeAudioSpeed,
    concatAudioBuffers,
    cutAudioBuffer,
    decodeAudioFile,
    formatAudioDuration,
    loopAudioBuffer,
    processAudioBuffer,
    reverseAudioBuffer,
} from '../audio-processing.js';
import { processAudio } from '../ffmpeg-processing.js';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

const JSZIP_URL = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
let zipPromise;
function loadZip() {
    zipPromise ??= import(JSZIP_URL).then((module) => module.default);
    return zipPromise;
}

function audioFilesInput() {
    return Object.freeze({
        id: 'audioFiles',
        type: 'file',
        multiple: true,
        accept: 'audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/webm,audio/x-m4a,audio/aac,audio/flac,audio/opus,.mp3,.wav,.ogg,.m4a,.aac,.flac,.opus,.webm',
        label: Object.freeze({ ar: 'اختر ملفين صوتيين أو أكثر بالترتيب', en: 'Choose two or more audio files in order' }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function audioInput() {
    return Object.freeze({
        id: 'audio',
        type: 'file',
        accept: 'audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/webm,audio/x-m4a,audio/aac,audio/flac,audio/opus,.mp3,.wav,.ogg,.m4a,.aac,.flac,.opus,.webm',
        label: Object.freeze({ ar: 'اختر ملفًا صوتيًا', en: 'Choose audio file' }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function numberInput(id, ar, en, placeholder, min, max, unit = '') {
    return Object.freeze({
        id,
        type: 'number',
        min,
        max,
        step: 0.1,
        placeholder: String(placeholder),
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: unit, en: unit }),
    });
}

function audioTool(config) {
    return Object.freeze({
        category: 'audio',
        ...config,
    });
}

function wavResult(buffer, filename, language, label) {
    const blob = audioBufferToWavBlob(buffer);
    const channels = buffer.numberOfChannels;

    return {
        value: formatAudioDuration(buffer.duration),
        label: localized(language, label.ar, label.en),
        details: localized(
            language,
            `${buffer.sampleRate} هرتز · ${channels === 1 ? 'أحادي' : 'ستيريو'} · ${(blob.size / 1024 / 1024).toFixed(1)} ميجابايت`,
            `${buffer.sampleRate} Hz · ${channels === 1 ? 'Mono' : 'Stereo'} · ${(blob.size / 1024 / 1024).toFixed(1)} MB`,
        ),
        download: { blob, filename },
    };
}

const AUDIO_FORMATS = Object.freeze({
    mp3: {
        ext: 'mp3',
        mime: 'audio/mpeg',
        args: ['-c:a', 'libmp3lame', '-b:a', '192k'],
        label: { ar: 'MP3', en: 'MP3' },
    },
    wav: {
        ext: 'wav',
        mime: 'audio/wav',
        args: ['-c:a', 'pcm_s16le'],
        label: { ar: 'WAV', en: 'WAV' },
    },
    ogg: {
        ext: 'ogg',
        mime: 'audio/ogg',
        args: ['-c:a', 'libvorbis', '-q:a', '5'],
        label: { ar: 'OGG (Vorbis)', en: 'OGG (Vorbis)' },
    },
    m4a: {
        ext: 'm4a',
        mime: 'audio/mp4',
        args: ['-c:a', 'aac', '-b:a', '192k'],
        label: { ar: 'M4A (AAC)', en: 'M4A (AAC)' },
    },
    aac: {
        ext: 'aac',
        mime: 'audio/aac',
        args: ['-c:a', 'aac', '-b:a', '192k'],
        label: { ar: 'AAC', en: 'AAC' },
    },
    flac: {
        ext: 'flac',
        mime: 'audio/flac',
        args: ['-c:a', 'flac'],
        label: { ar: 'FLAC', en: 'FLAC' },
    },
    opus: {
        ext: 'opus',
        mime: 'audio/opus',
        args: ['-c:a', 'libopus', '-b:a', '128k'],
        label: { ar: 'Opus', en: 'Opus' },
    },
    webm: {
        ext: 'webm',
        mime: 'audio/webm',
        args: ['-c:a', 'libopus', '-b:a', '128k'],
        label: { ar: 'WebM (Opus)', en: 'WebM (Opus)' },
    },
});

const audioTrimmer = audioTool({
    id: 'audio-trimmer',
    icon: 'CUT',
    action: Object.freeze({ ar: 'قص الصوت', en: 'Trim audio' }),
    title: Object.freeze({ ar: 'قص الملفات الصوتية', en: 'Audio Trimmer' }),
    description: Object.freeze({
        ar: 'حدد وقت البداية والنهاية واستخرج الجزء المطلوب من التسجيل كملف WAV.',
        en: 'Choose start and end times and export the selected audio segment as WAV.',
    }),
    note: Object.freeze({
        ar: 'تتم المعالجة على جهازك، ويجب ألا يتجاوز وقت النهاية مدة الملف.',
        en: 'Processing stays on your device. The end time must not exceed the file duration.',
    }),
    inputs: Object.freeze([
        audioInput(),
        numberInput('start', 'وقت البداية', 'Start time', 0, 0, 86400, 'sec'),
        numberInput('end', 'وقت النهاية', 'End time', 30, 0.1, 86400, 'sec'),
    ]),
    async process(values, language) {
        const source = await decodeAudioFile(values.audio);

        if (values.end <= values.start) {
            throw new Error(localized(
                language,
                'يجب أن يكون وقت النهاية بعد وقت البداية.',
                'End time must be after start time.',
            ));
        }
        if (values.end > source.duration + 0.01) {
            throw new Error(localized(
                language,
                `مدة الملف ${source.duration.toFixed(1)} ثانية فقط.`,
                `The file is only ${source.duration.toFixed(1)} seconds long.`,
            ));
        }

        return wavResult(
            processAudioBuffer(source, {
                startSeconds: values.start,
                endSeconds: values.end,
            }),
            'adawaty-trimmed-audio.wav',
            language,
            { ar: 'المقطع الصوتي جاهز', en: 'Trimmed audio is ready' },
        );
    },
});

const volumeChanger = audioTool({
    id: 'audio-volume-changer',
    icon: 'VOL',
    action: Object.freeze({ ar: 'غيّر الصوت', en: 'Change volume' }),
    title: Object.freeze({ ar: 'رفع وخفض صوت الملف', en: 'Audio Volume Changer' }),
    description: Object.freeze({
        ar: 'ارفع أو اخفض مستوى صوت التسجيل بنسبة محددة ثم نزّل النتيجة بصيغة WAV.',
        en: 'Increase or reduce recording volume by a chosen percentage and export WAV.',
    }),
    note: Object.freeze({
        ar: 'قد تسبب النسب المرتفعة جدًا تشوهًا إذا كان التسجيل الأصلي مرتفعًا.',
        en: 'Very high gain can distort audio that is already loud.',
    }),
    inputs: Object.freeze([
        audioInput(),
        numberInput('volume', 'مستوى الصوت', 'Volume level', 120, 0, 300, '%'),
    ]),
    async process(values, language) {
        const source = await decodeAudioFile(values.audio);
        return wavResult(
            processAudioBuffer(source, { gain: values.volume / 100 }),
            'adawaty-volume-adjusted.wav',
            language,
            { ar: 'الصوت المعدّل جاهز', en: 'Adjusted audio is ready' },
        );
    },
});

const fadeEditor = audioTool({
    id: 'audio-fade-in-out-editor',
    icon: 'FADE',
    action: Object.freeze({ ar: 'طبّق التدرج', en: 'Apply fades' }),
    title: Object.freeze({ ar: 'إضافة Fade In وFade Out للصوت', en: 'Audio Fade In & Fade Out' }),
    description: Object.freeze({
        ar: 'أضف دخولًا وخروجًا تدريجيًا للصوت لتنعيم بداية التسجيل ونهايته.',
        en: 'Add gradual fade-in and fade-out effects for smoother audio starts and endings.',
    }),
    note: Object.freeze({
        ar: 'إذا تجاوزت مدة التدرج مدة الملف فسيتم دمج التأثيرين تلقائيًا.',
        en: 'If fade durations overlap, both envelopes are blended automatically.',
    }),
    inputs: Object.freeze([
        audioInput(),
        numberInput('fadeIn', 'مدة Fade In', 'Fade-in duration', 2, 0, 600, 'sec'),
        numberInput('fadeOut', 'مدة Fade Out', 'Fade-out duration', 2, 0, 600, 'sec'),
    ]),
    async process(values, language) {
        const source = await decodeAudioFile(values.audio);
        return wavResult(
            processAudioBuffer(source, {
                fadeInSeconds: values.fadeIn,
                fadeOutSeconds: values.fadeOut,
            }),
            'adawaty-faded-audio.wav',
            language,
            { ar: 'الصوت المتدرج جاهز', en: 'Faded audio is ready' },
        );
    },
});

const monoConverter = audioTool({
    id: 'stereo-to-mono-converter',
    icon: 'MONO',
    action: Object.freeze({ ar: 'حوّل إلى Mono', en: 'Convert to mono' }),
    title: Object.freeze({ ar: 'تحويل Stereo إلى Mono', en: 'Stereo to Mono Converter' }),
    description: Object.freeze({
        ar: 'ادمج قناتي الصوت في قناة Mono واحدة لتقليل الحجم وتحسين توافق التسجيلات الصوتية.',
        en: 'Mix stereo channels into one mono channel for smaller, voice-friendly audio.',
    }),
    note: Object.freeze({
        ar: 'يتم مزج جميع القنوات بالتساوي داخل المتصفح دون رفع الملف.',
        en: 'All channels are mixed evenly in the browser without uploading the file.',
    }),
    inputs: Object.freeze([audioInput()]),
    async process(values, language) {
        const source = await decodeAudioFile(values.audio);
        return wavResult(
            processAudioBuffer(source, { channelMode: 'mono' }),
            'adawaty-mono-audio.wav',
            language,
            { ar: 'ملف Mono جاهز', en: 'Mono audio is ready' },
        );
    },
});

const audioFormatConverter = audioTool({
    id: 'audio-format-converter',
    icon: 'MP3↔WAV',
    action: Object.freeze({ ar: 'حوّل الصوت', en: 'Convert audio' }),
    title: Object.freeze({ ar: 'تحويل صيغ الملفات الصوتية', en: 'Audio Format Converter' }),
    description: Object.freeze({
        ar: 'حوّل أي ملف صوتي شائع إلى MP3 أو WAV أو OGG أو M4A أو AAC أو FLAC أو Opus أو WebM داخل المتصفح.',
        en: 'Convert any common audio file to MP3, WAV, OGG, M4A, AAC, FLAC, Opus or WebM in your browser.',
    }),
    note: Object.freeze({
        ar: 'المعالجة محلية بالكامل عبر محرك ffmpeg داخل المتصفح. التحميل الأول للمحرك قد يستغرق لحظات. الملفات الطويلة تحتاج ذاكرة أكبر.',
        en: 'Processing is fully local via the in-browser ffmpeg engine. The first engine load may take a moment. Long files need more memory.',
    }),
    inputs: Object.freeze([
        audioInput(),
        Object.freeze({
            id: 'format',
            type: 'select',
            label: Object.freeze({ ar: 'صيغة الإخراج', en: 'Output format' }),
            unit: Object.freeze({ ar: '', en: '' }),
            options: Object.freeze(Object.entries(AUDIO_FORMATS).map(([value, format]) => Object.freeze({
                value,
                label: Object.freeze(format.label),
            }))),
        }),
    ]),
    async process(values, language) {
        const format = AUDIO_FORMATS[values.format] ?? AUDIO_FORMATS.mp3;
        const blob = await processAudio(
            values.audio,
            format.args,
            `converted.${format.ext}`,
            format.mime,
        );
        const base = values.audio.name.replace(/\.[^.]+$/, '') || 'audio';
        return {
            value: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
            label: localized(language, 'الملف الصوتي المحوّل جاهز', 'Converted audio is ready'),
            details: localized(
                language,
                `الصيغة: ${format.label.ar} · تمت المعالجة محليًا.`,
                `Format: ${format.label.en} · Processed locally.`,
            ),
            download: {
                blob,
                filename: `adawaty-${base}.${format.ext}`,
            },
        };
    },
});

const audioReverser = audioTool({
    id: 'audio-reverser',
    icon: 'REV',
    action: Object.freeze({ ar: 'اعكس الصوت', en: 'Reverse audio' }),
    title: Object.freeze({ ar: 'عكس التسجيل الصوتي', en: 'Audio Reverser' }),
    description: Object.freeze({
        ar: 'اعكس ترتيب التسجيل بالكامل من النهاية للبداية وصدّره كملف WAV.',
        en: 'Play the recording backwards, from end to start, and export it as WAV.',
    }),
    note: Object.freeze({
        ar: 'المعالجة تتم بالكامل داخل جهازك دون رفع الملف.',
        en: 'Processing happens entirely on your device; the file is never uploaded.',
    }),
    inputs: Object.freeze([audioInput()]),
    async process(values, language) {
        const source = await decodeAudioFile(values.audio);
        return wavResult(
            reverseAudioBuffer(source),
            'adawaty-reversed-audio.wav',
            language,
            { ar: 'الصوت المعكوس جاهز', en: 'Reversed audio is ready' },
        );
    },
});

const audioCutter = audioTool({
    id: 'audio-cutter',
    icon: 'CUT2',
    action: Object.freeze({ ar: 'احذف مقطعًا', en: 'Cut a segment' }),
    title: Object.freeze({ ar: 'حذف جزء من التسجيل', en: 'Audio Cutter' }),
    description: Object.freeze({
        ar: 'احذف المقطع بين وقتين محددين واحصل على باقي التسجيل مدمجًا كملف واحد.',
        en: 'Remove the segment between two times and get the rest of the recording joined into one file.',
    }),
    note: Object.freeze({
        ar: 'هذه الأداة عكس القص العادي: القص يحتفظ بالجزء المحدد، والحذف هنا يزيله ويدمج الباقي.',
        en: 'This is the opposite of trimming: trimming keeps the selected part, cutting removes it and joins what remains.',
    }),
    inputs: Object.freeze([
        audioInput(),
        numberInput('start', 'بداية الجزء المطلوب حذفه', 'Start of the part to remove', 5, 0, 86400, 'sec'),
        numberInput('end', 'نهاية الجزء المطلوب حذفه', 'End of the part to remove', 10, 0.1, 86400, 'sec'),
    ]),
    async process(values, language) {
        const source = await decodeAudioFile(values.audio);

        if (values.end <= values.start) {
            throw new Error(localized(
                language,
                'يجب أن تكون نهاية الجزء بعد بدايته.',
                'The segment end must be after its start.',
            ));
        }
        if (values.end > source.duration + 0.01) {
            throw new Error(localized(
                language,
                `مدة الملف ${source.duration.toFixed(1)} ثانية فقط.`,
                `The file is only ${source.duration.toFixed(1)} seconds long.`,
            ));
        }
        if (values.start <= 0.01 && values.end >= source.duration - 0.01) {
            throw new Error(localized(
                language,
                'لا يمكن حذف التسجيل بالكامل.',
                'The entire recording cannot be removed.',
            ));
        }

        return wavResult(
            cutAudioBuffer(source, values.start, values.end),
            'adawaty-cut-audio.wav',
            language,
            { ar: 'الصوت بعد الحذف جاهز', en: 'The trimmed-down audio is ready' },
        );
    },
});

const audioSplitter = audioTool({
    id: 'audio-splitter',
    icon: 'SPLIT',
    action: Object.freeze({ ar: 'قسّم الصوت', en: 'Split audio' }),
    title: Object.freeze({ ar: 'تقسيم التسجيل إلى جزأين', en: 'Audio Splitter' }),
    description: Object.freeze({
        ar: 'قسّم تسجيلًا صوتيًا إلى جزأين عند نقطة زمنية محددة، ونزّل الاثنين معًا داخل ملف ZIP.',
        en: 'Split a recording into two parts at a chosen point in time and download both inside one ZIP.',
    }),
    note: Object.freeze({
        ar: 'يصدر كل جزء بصيغة WAV. لتقسيم إلى أكثر من جزأين كرر الأداة على كل جزء.',
        en: 'Each part exports as WAV. To split into more than two parts, run the tool again on a part.',
    }),
    inputs: Object.freeze([
        audioInput(),
        numberInput('splitPoint', 'نقطة التقسيم', 'Split point', 30, 0.1, 86400, 'sec'),
    ]),
    async process(values, language) {
        const source = await decodeAudioFile(values.audio);

        if (values.splitPoint <= 0 || values.splitPoint >= source.duration) {
            throw new Error(localized(
                language,
                `اختر نقطة تقسيم بين 0 و${source.duration.toFixed(1)} ثانية.`,
                `Choose a split point between 0 and ${source.duration.toFixed(1)} seconds.`,
            ));
        }

        const firstPart = processAudioBuffer(source, { startSeconds: 0, endSeconds: values.splitPoint });
        const secondPart = processAudioBuffer(source, { startSeconds: values.splitPoint, endSeconds: source.duration });

        const Zip = await loadZip();
        const zip = new Zip();
        zip.file('adawaty-part-1.wav', audioBufferToWavBlob(firstPart));
        zip.file('adawaty-part-2.wav', audioBufferToWavBlob(secondPart));
        const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });

        return {
            value: `2 ${localized(language, 'أجزاء', 'parts')}`,
            label: localized(language, 'جزآ الصوت جاهزان', 'Both audio parts are ready'),
            details: localized(
                language,
                `الجزء الأول ${formatAudioDuration(firstPart.duration)} · الجزء الثاني ${formatAudioDuration(secondPart.duration)}`,
                `Part 1: ${formatAudioDuration(firstPart.duration)} · Part 2: ${formatAudioDuration(secondPart.duration)}`,
            ),
            download: { blob, filename: 'adawaty-split-audio.zip' },
        };
    },
});

const audioMerger = audioTool({
    id: 'audio-merger',
    icon: 'MERGE',
    action: Object.freeze({ ar: 'ادمج الملفات', en: 'Merge files' }),
    title: Object.freeze({ ar: 'دمج عدة ملفات صوتية في ملف واحد', en: 'Audio Merger' }),
    description: Object.freeze({
        ar: 'اجمع ملفين أو أكثر بالترتيب المختار في تسجيل واحد متصل، ونزّله كملف WAV.',
        en: 'Join two or more files in the order you pick into one continuous recording, exported as WAV.',
    }),
    note: Object.freeze({
        ar: 'يتم دمج الملفات بترتيب اختيارك بالضبط. الملفات بمعدلات عيّنات مختلفة قد تُعالج بجودة الملف الأول.',
        en: 'Files are joined in the exact order you select them. Files with different sample rates may follow the first file\u2019s quality.',
    }),
    inputs: Object.freeze([audioFilesInput()]),
    async process(values, language) {
        if (!Array.isArray(values.audioFiles) || values.audioFiles.length < 2) {
            throw new Error(localized(
                language,
                'اختر ملفين صوتيين على الأقل للدمج.',
                'Choose at least two audio files to merge.',
            ));
        }

        const decoded = await Promise.all(values.audioFiles.map((file) => decodeAudioFile(file)));
        const merged = concatAudioBuffers(decoded);

        return wavResult(
            merged,
            'adawaty-merged-audio.wav',
            language,
            { ar: 'الملف المدمج جاهز', en: 'The merged file is ready' },
        );
    },
});

const audioLooper = audioTool({
    id: 'audio-looper',
    icon: 'LOOP',
    action: Object.freeze({ ar: 'كرّر الصوت', en: 'Loop audio' }),
    title: Object.freeze({ ar: 'تكرار التسجيل عدة مرات', en: 'Audio Looper' }),
    description: Object.freeze({
        ar: 'كرّر تسجيلًا صوتيًا عددًا من المرات لإنشاء ملف أطول، مفيد للنغمات والتنبيهات المتكررة.',
        en: 'Repeat a recording a chosen number of times to create a longer file, useful for tones and repeating alerts.',
    }),
    note: Object.freeze({
        ar: 'التكرار الكبير مع ملفات طويلة قد يستهلك ذاكرة أكبر أثناء المعالجة.',
        en: 'A high repeat count on a long file may use more memory while processing.',
    }),
    inputs: Object.freeze([
        audioInput(),
        numberInput('times', 'عدد مرات التكرار', 'Repeat count', 3, 2, 50, ''),
    ]),
    async process(values, language) {
        const source = await decodeAudioFile(values.audio);
        const times = Math.round(values.times);

        return wavResult(
            loopAudioBuffer(source, times),
            'adawaty-looped-audio.wav',
            language,
            { ar: 'الصوت المكرر جاهز', en: 'The looped audio is ready' },
        );
    },
});

const audioSpeedChanger = audioTool({
    id: 'audio-speed-changer',
    icon: 'SPEED',
    action: Object.freeze({ ar: 'غيّر السرعة', en: 'Change speed' }),
    title: Object.freeze({ ar: 'تسريع أو إبطاء التسجيل', en: 'Audio Speed Changer' }),
    description: Object.freeze({
        ar: 'سرّع أو أبطئ ملفًا صوتيًا لضبط مدته أو أسلوب الاستماع إليه.',
        en: 'Speed up or slow down an audio file to adjust its duration or listening pace.',
    }),
    note: Object.freeze({
        ar: 'تغيير السرعة يغيّر طبقة الصوت أيضًا (كما في تسريع أو إبطاء شريط كاسيت)، فهذه ليست أداة تصحيح طبقة مستقلة عن السرعة.',
        en: 'Changing speed also shifts pitch (like a fast-forwarded or slowed cassette tape); this is not an independent pitch-correction tool.',
    }),
    inputs: Object.freeze([
        audioInput(),
        numberInput('rate', 'معدل السرعة', 'Speed rate', 1.5, 0.25, 3, 'x'),
    ]),
    async process(values, language) {
        const source = await decodeAudioFile(values.audio);
        const result = changeAudioSpeed(source, values.rate);

        return wavResult(
            result,
            'adawaty-speed-changed-audio.wav',
            language,
            { ar: 'الصوت بالسرعة الجديدة جاهز', en: 'The re-timed audio is ready' },
        );
    },
});

const audioFileToolDefinitions = Object.freeze({
    [audioTrimmer.id]: audioTrimmer,
    [volumeChanger.id]: volumeChanger,
    [fadeEditor.id]: fadeEditor,
    [monoConverter.id]: monoConverter,
    [audioFormatConverter.id]: audioFormatConverter,
    [audioReverser.id]: audioReverser,
    [audioCutter.id]: audioCutter,
    [audioSplitter.id]: audioSplitter,
    [audioMerger.id]: audioMerger,
    [audioLooper.id]: audioLooper,
    [audioSpeedChanger.id]: audioSpeedChanger,
});

export { audioFileToolDefinitions };

// END OF FILE
