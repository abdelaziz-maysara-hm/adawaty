import { canvasToBlob } from '../image-processing.js';
import { decodeAudioFile, formatAudioDuration } from '../audio-processing.js';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
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

/** Returns [min, max] amplitude pairs across `targetWidth` evenly-sized blocks. */
function computeWaveformPeaks(channelData, targetWidth) {
    const blockSize = Math.max(1, Math.floor(channelData.length / targetWidth));
    const peaks = [];

    for (let column = 0; column < targetWidth; column += 1) {
        let min = 1;
        let max = -1;
        const start = column * blockSize;
        const end = Math.min(channelData.length, start + blockSize);

        for (let index = start; index < end; index += 1) {
            const value = channelData[index];
            if (value < min) min = value;
            if (value > max) max = value;
        }

        peaks.push([min, max]);
    }

    return peaks;
}

/**
 * Finds continuous stretches where every sample's absolute amplitude stays
 * below `thresholdAmplitude`, keeping only stretches at least
 * `minGapSeconds` long. Returns [{ start, end }] in seconds.
 */
function detectSilenceGaps(channelData, sampleRate, thresholdAmplitude, minGapSeconds) {
    const minGapSamples = Math.round(minGapSeconds * sampleRate);
    const gaps = [];
    let silenceStart = null;

    for (let index = 0; index < channelData.length; index += 1) {
        const isSilent = Math.abs(channelData[index]) < thresholdAmplitude;

        if (isSilent && silenceStart === null) {
            silenceStart = index;
        } else if (!isSilent && silenceStart !== null) {
            if (index - silenceStart >= minGapSamples) {
                gaps.push({ start: silenceStart / sampleRate, end: index / sampleRate });
            }
            silenceStart = null;
        }
    }

    if (silenceStart !== null && channelData.length - silenceStart >= minGapSamples) {
        gaps.push({ start: silenceStart / sampleRate, end: channelData.length / sampleRate });
    }

    return gaps;
}

function formatTimestamp(seconds) {
    const totalSeconds = Math.max(0, seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remaining = (totalSeconds % 60).toFixed(1);
    return `${minutes}:${remaining.padStart(4, '0')}`;
}

const waveformViewer = audioTool({
    id: 'audio-waveform-viewer',
    icon: 'WAVE',
    action: Object.freeze({ ar: 'ارسم الموجة', en: 'Draw waveform' }),
    title: Object.freeze({ ar: 'عرض الشكل الموجي للصوت', en: 'Audio Waveform Viewer' }),
    description: Object.freeze({
        ar: 'ارسم الشكل الموجي الكامل لملف صوتي ونزّله كصورة PNG، مفيد للمعاينة أو التوثيق.',
        en: 'Render a full audio waveform and download it as a PNG image, useful for preview or documentation.',
    }),
    note: Object.freeze({
        ar: 'الرسم يعتمد على متوسط القناة الأولى للملفات متعددة القنوات. تتم المعالجة محليًا داخل جهازك.',
        en: 'Multi-channel files are drawn from the first channel. Processing stays on your device.',
    }),
    inputs: Object.freeze([audioInput()]),
    async process(values, language) {
        const source = await decodeAudioFile(values.audio);
        const width = 1200;
        const height = 300;
        const peaks = computeWaveformPeaks(source.getChannelData(0), width);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');

        context.fillStyle = '#0f1416';
        context.fillRect(0, 0, width, height);
        context.fillStyle = '#2fb8a6';
        const midY = height / 2;

        peaks.forEach(([min, max], column) => {
            const y1 = midY - max * midY;
            const y2 = midY - min * midY;
            context.fillRect(column, y1, 1, Math.max(1, y2 - y1));
        });

        const blob = await canvasToBlob(canvas, 'image/png');

        return {
            value: formatAudioDuration(source.duration),
            label: localized(language, 'صورة الموجة جاهزة', 'The waveform image is ready'),
            details: localized(
                language,
                `${width}×${height} بكسل · ${source.sampleRate} هرتز`,
                `${width}×${height} px · ${source.sampleRate} Hz`,
            ),
            download: { blob, filename: 'adawaty-waveform.png' },
        };
    },
});

const silenceDetector = audioTool({
    id: 'audio-silence-detector',
    icon: 'SILENCE',
    action: Object.freeze({ ar: 'اكتشف الصمت', en: 'Detect silence' }),
    title: Object.freeze({ ar: 'اكتشاف فترات الصمت في التسجيل', en: 'Audio Silence Detector' }),
    description: Object.freeze({
        ar: 'حدد فترات الصمت أو الضوضاء المنخفضة جدًا داخل تسجيل صوتي، مفيد لتنظيف المقاطع أو مراجعة التسجيلات الطويلة.',
        en: 'Locate silent or very-low-noise stretches inside a recording, useful for cleanup or reviewing long recordings.',
    }),
    note: Object.freeze({
        ar: 'هذه أداة كشف فقط ولا تعدّل الملف. اضبط الحساسية والمدة الدنيا حسب طبيعة تسجيلك.',
        en: 'This is a detection-only tool and does not modify the file. Tune sensitivity and minimum duration to your recording.',
    }),
    inputs: Object.freeze([
        audioInput(),
        numberInput('threshold', 'حساسية الصمت', 'Silence sensitivity', 2, 0.1, 20, '%'),
        numberInput('minDuration', 'أقل مدة صمت تُحتسب', 'Minimum silence duration', 1, 0.1, 60, 'sec'),
    ]),
    async process(values, language) {
        const source = await decodeAudioFile(values.audio);
        const thresholdAmplitude = values.threshold / 100;
        const gaps = detectSilenceGaps(
            source.getChannelData(0),
            source.sampleRate,
            thresholdAmplitude,
            values.minDuration,
        );

        if (gaps.length === 0) {
            return {
                value: '0',
                label: localized(language, 'لم يتم العثور على فترات صمت', 'No silence detected'),
                details: localized(
                    language,
                    'جرّب رفع نسبة الحساسية أو تقليل أقل مدة إذا كنت تتوقع نتائج مختلفة.',
                    'Try raising sensitivity or lowering the minimum duration if you expected different results.',
                ),
            };
        }

        const totalSilence = gaps.reduce((sum, gap) => sum + (gap.end - gap.start), 0);
        const listPreview = gaps
            .slice(0, 10)
            .map((gap) => `${formatTimestamp(gap.start)} → ${formatTimestamp(gap.end)}`)
            .join(' · ');
        const remainder = gaps.length > 10
            ? localized(language, ` (+${gaps.length - 10} أخرى)`, ` (+${gaps.length - 10} more)`)
            : '';

        return {
            value: String(gaps.length),
            label: localized(language, 'فترة صمت تم العثور عليها', 'Silent stretches found'),
            details: localized(
                language,
                `إجمالي مدة الصمت ${formatAudioDuration(totalSilence)} · ${listPreview}${remainder}`,
                `Total silence ${formatAudioDuration(totalSilence)} · ${listPreview}${remainder}`,
            ),
        };
    },
});

const audioAnalysisToolDefinitions = Object.freeze({
    [waveformViewer.id]: waveformViewer,
    [silenceDetector.id]: silenceDetector,
});

export { audioAnalysisToolDefinitions };

// END OF FILE
