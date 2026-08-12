function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function pickMimeType(candidates) {
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
        return '';
    }
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/**
 * Record from a MediaStream for a fixed duration, then stop tracks and return a Blob.
 * @param {MediaStream} stream
 * @param {number} durationMs
 * @param {string[]} mimeCandidates
 */
function recordStream(stream, durationMs, mimeCandidates) {
    const mimeType = pickMimeType(mimeCandidates);
    const options = mimeType ? { mimeType } : undefined;
    const recorder = new MediaRecorder(stream, options);
    const chunks = [];

    return new Promise((resolve, reject) => {
        recorder.addEventListener('dataavailable', (event) => {
            if (event.data && event.data.size > 0) {
                chunks.push(event.data);
            }
        });

        recorder.addEventListener('error', (event) => {
            reject(event.error || new Error('MediaRecorder error'));
        });

        recorder.addEventListener('stop', () => {
            for (const track of stream.getTracks()) {
                track.stop();
            }
            const type = recorder.mimeType || mimeType || 'application/octet-stream';
            resolve(new Blob(chunks, { type }));
        });

        try {
            recorder.start(250);
        } catch (error) {
            for (const track of stream.getTracks()) {
                track.stop();
            }
            reject(error);
            return;
        }

        wait(durationMs).then(() => {
            if (recorder.state !== 'inactive') {
                recorder.stop();
            }
        });
    });
}

function durationInput() {
    return Object.freeze({
        id: 'duration',
        type: 'number',
        min: 3,
        max: 300,
        step: 1,
        value: 15,
        label: Object.freeze({ ar: 'مدة التسجيل (ثوانٍ)', en: 'Recording duration (seconds)' }),
        unit: Object.freeze({ ar: 'ث', en: 'sec' }),
    });
}

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function extensionForBlob(blob) {
    const type = blob.type || '';
    if (type.includes('mp4')) return 'mp4';
    if (type.includes('ogg')) return 'ogg';
    if (type.includes('wav')) return 'wav';
    return 'webm';
}

const soundRecorder = Object.freeze({
    id: 'sound-recorder',
    category: 'audio',
    icon: 'MIC',
    title: Object.freeze({
        ar: 'مسجّل الصوت',
        en: 'Sound Recorder',
    }),
    description: Object.freeze({
        ar: 'سجّل من الميكروفون مباشرة في المتصفح وحمّل الملف بدون رفع لسيرفر.',
        en: 'Record from your microphone in the browser and download the file — nothing is uploaded.',
    }),
    note: Object.freeze({
        ar: 'سيطلب المتصفح إذن الميكروفون. التسجيل يتم محليًا بالكامل.',
        en: 'Your browser will ask for microphone permission. Recording stays fully local.',
    }),
    action: Object.freeze({
        ar: 'ابدأ التسجيل',
        en: 'Start recording',
    }),
    inputs: Object.freeze([durationInput()]),
    async process(values, language) {
        const seconds = Number(values.duration);
        if (!Number.isFinite(seconds) || seconds < 3 || seconds > 300) {
            throw new Error(localized(
                language,
                'أدخل مدة بين 3 و 300 ثانية.',
                'Enter a duration between 3 and 300 seconds.',
            ));
        }

        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
            throw new Error(localized(
                language,
                'متصفحك لا يدعم تسجيل الصوت.',
                'Your browser does not support audio recording.',
            ));
        }

        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                },
                video: false,
            });
        } catch {
            throw new Error(localized(
                language,
                'تعذر الوصول للميكروفون. تأكد من السماح بالإذن.',
                'Could not access the microphone. Please allow permission.',
            ));
        }

        const blob = await recordStream(stream, Math.round(seconds * 1000), [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/mp4',
        ]);

        if (!blob.size) {
            throw new Error(localized(
                language,
                'لم يتم التقاط أي صوت. حاول مرة أخرى.',
                'No audio was captured. Please try again.',
            ));
        }

        const ext = extensionForBlob(blob);
        const filename = `adawaty-sound-${Date.now()}.${ext}`;

        return {
            value: localized(language, `${seconds} ثانية`, `${seconds} sec`),
            label: localized(language, 'تم التسجيل', 'Recording complete'),
            details: localized(
                language,
                `${formatSize(blob.size)} · ${blob.type || ext}`,
                `${formatSize(blob.size)} · ${blob.type || ext}`,
            ),
            download: {
                blob,
                filename,
            },
        };
    },
});

const screenRecorder = Object.freeze({
    id: 'screen-recorder',
    category: 'video',
    icon: 'SCR',
    title: Object.freeze({
        ar: 'مسجّل الشاشة',
        en: 'Screen Recorder',
    }),
    description: Object.freeze({
        ar: 'سجّل الشاشة أو نافذة أو تبويب المتصفح محليًا وحمّل الفيديو مباشرة.',
        en: 'Record your screen, a window, or a browser tab locally and download the video.',
    }),
    note: Object.freeze({
        ar: 'سيظهر منتقي مصدر الشاشة. الصوت اختياري وقد لا يتوفر في كل المتصفحات.',
        en: 'A screen source picker will appear. Optional audio may not be available in every browser.',
    }),
    action: Object.freeze({
        ar: 'ابدأ تسجيل الشاشة',
        en: 'Start screen recording',
    }),
    inputs: Object.freeze([
        durationInput(),
        Object.freeze({
            id: 'includeAudio',
            type: 'select',
            label: Object.freeze({ ar: 'تضمين الصوت', en: 'Include audio' }),
            unit: Object.freeze({ ar: '', en: '' }),
            options: Object.freeze([
                Object.freeze({
                    value: 'no',
                    label: Object.freeze({ ar: 'بدون صوت', en: 'No audio' }),
                }),
                Object.freeze({
                    value: 'yes',
                    label: Object.freeze({
                        ar: 'مع صوت التبويب/النظام إن أمكن',
                        en: 'With tab/system audio if available',
                    }),
                }),
            ]),
        }),
    ]),
    async process(values, language) {
        const seconds = Number(values.duration);
        if (!Number.isFinite(seconds) || seconds < 3 || seconds > 300) {
            throw new Error(localized(
                language,
                'أدخل مدة بين 3 و 300 ثانية.',
                'Enter a duration between 3 and 300 seconds.',
            ));
        }

        if (!navigator.mediaDevices?.getDisplayMedia || typeof MediaRecorder === 'undefined') {
            throw new Error(localized(
                language,
                'متصفحك لا يدعم تسجيل الشاشة.',
                'Your browser does not support screen recording.',
            ));
        }

        const wantAudio = values.includeAudio === 'yes';
        let stream;
        try {
            stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    frameRate: { ideal: 30 },
                },
                audio: wantAudio,
            });
        } catch {
            throw new Error(localized(
                language,
                'تم إلغاء مشاركة الشاشة أو رفض الإذن.',
                'Screen sharing was cancelled or permission was denied.',
            ));
        }

        const videoTrack = stream.getVideoTracks()[0];
        const earlyStop = new Promise((resolve) => {
            if (!videoTrack) {
                resolve();
                return;
            }
            videoTrack.addEventListener('ended', () => resolve(), { once: true });
        });

        const mimeCandidates = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4',
        ];

        const durationMs = Math.round(seconds * 1000);
        const mimeType = pickMimeType(mimeCandidates);
        const options = mimeType ? { mimeType } : undefined;
        const recorder = new MediaRecorder(stream, options);
        const chunks = [];

        const blob = await new Promise((resolve, reject) => {
            let settled = false;
            const finish = () => {
                if (settled) return;
                settled = true;
                for (const track of stream.getTracks()) {
                    track.stop();
                }
                const type = recorder.mimeType || mimeType || 'video/webm';
                resolve(new Blob(chunks, { type }));
            };

            recorder.addEventListener('dataavailable', (event) => {
                if (event.data && event.data.size > 0) {
                    chunks.push(event.data);
                }
            });
            recorder.addEventListener('error', (event) => {
                if (!settled) {
                    settled = true;
                    for (const track of stream.getTracks()) {
                        track.stop();
                    }
                    reject(event.error || new Error('MediaRecorder error'));
                }
            });
            recorder.addEventListener('stop', finish);

            try {
                recorder.start(250);
            } catch (error) {
                for (const track of stream.getTracks()) {
                    track.stop();
                }
                reject(error);
                return;
            }

            Promise.race([
                wait(durationMs),
                earlyStop,
            ]).then(() => {
                if (recorder.state !== 'inactive') {
                    recorder.stop();
                }
            });
        });

        if (!blob.size) {
            throw new Error(localized(
                language,
                'لم يتم التقاط أي فيديو. حاول مرة أخرى.',
                'No video was captured. Please try again.',
            ));
        }

        const ext = extensionForBlob(blob);
        const filename = `adawaty-screen-${Date.now()}.${ext}`;

        return {
            value: localized(language, `${seconds} ثانية`, `${seconds} sec`),
            label: localized(language, 'تم تسجيل الشاشة', 'Screen recording complete'),
            details: localized(
                language,
                `${formatSize(blob.size)} · ${blob.type || ext}`,
                `${formatSize(blob.size)} · ${blob.type || ext}`,
            ),
            download: {
                blob,
                filename,
            },
        };
    },
});

const mediaRecorderToolDefinitions = Object.freeze({
    [soundRecorder.id]: soundRecorder,
    [screenRecorder.id]: screenRecorder,
});

export { mediaRecorderToolDefinitions };

// END OF FILE
