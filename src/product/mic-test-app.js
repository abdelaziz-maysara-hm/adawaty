import './site-navigation.js?v=mt1';
import {
    calculateRmsLevel, rmsToDecibels, detectClipping, decibelsToMeterFraction, SILENCE_FLOOR_DB,
} from './mic-test/levels.js';

const copy = Object.freeze({
    ar: Object.freeze({
        start: 'ابدأ الاختبار', stop: 'إيقاف',
        device: 'اختر الميكروفون',
        level: 'المستوى', clipping: 'تشويه! خفّض مستوى الإدخال', silent: 'مفيش صوت واصل — تكلم أو اقترب من الميكروفون',
        good: 'المستوى جيد', low: 'المستوى منخفض جدًا', permissionDenied: 'تم رفض إذن الميكروفون. اسمح بالوصول من إعدادات المتصفح وحاول تاني.',
        noMic: 'لم يتم العثور على ميكروفون متصل بجهازك.', notSupported: 'متصفحك لا يدعم الوصول للميكروفون.',
        privacyNote: 'الصوت يُعالج داخل متصفحك فقط للحظات، ولا يُسجَّل أو يُرسَل لأي مكان.',
        peakLabel: 'الذروة',
    }),
    en: Object.freeze({
        start: 'Start Test', stop: 'Stop',
        device: 'Choose microphone',
        level: 'Level', clipping: 'Clipping! Lower your input level', silent: 'No sound detected — speak or move closer to the mic',
        good: 'Level looks good', low: 'Level is too low', permissionDenied: 'Microphone access was denied. Allow it in your browser settings and try again.',
        noMic: 'No microphone was found on this device.', notSupported: 'Your browser does not support microphone access.',
        privacyNote: 'Audio is processed in your browser only, moment to moment -- nothing is recorded or sent anywhere.',
        peakLabel: 'Peak',
    }),
});

function getUiLanguage() {
    return document.documentElement.dataset.language === 'en' ? 'en' : 'ar';
}

function t(key) {
    return copy[getUiLanguage()][key] ?? key;
}

const el = Object.freeze({
    startButton: document.querySelector('#mic-start'),
    stopButton: document.querySelector('#mic-stop'),
    deviceSelect: document.querySelector('#mic-device'),
    meterFill: document.querySelector('#mic-meter-fill'),
    peakMarker: document.querySelector('#mic-peak-marker'),
    dbReadout: document.querySelector('#mic-db-readout'),
    statusMessage: document.querySelector('#mic-status'),
    clipWarning: document.querySelector('#mic-clip-warning'),
});

let audioContext = null;
let analyser = null;
let mediaStream = null;
let animationFrameId = null;
let peakDb = SILENCE_FLOOR_DB;
let peakHoldUntil = 0;
const PEAK_HOLD_MS = 1500;

function setStatus(message) {
    el.statusMessage.textContent = message;
}

async function populateDeviceList() {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter((device) => device.kind === 'audioinput');
        el.deviceSelect.replaceChildren(
            ...inputs.map((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.textContent = device.label || `${t('device')} ${index + 1}`;
                return option;
            }),
        );
        el.deviceSelect.hidden = inputs.length <= 1;
    } catch {
        // Device labels/list are a nice-to-have; enumeration failing must not block the actual level meter from working.
    }
}

function stopListening() {
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        mediaStream = null;
    }
    if (audioContext) {
        audioContext.close().catch(() => {});
        audioContext = null;
    }
    analyser = null;
    peakDb = SILENCE_FLOOR_DB;
    el.meterFill.style.width = '0%';
    el.peakMarker.style.insetInlineStart = '0%';
    el.clipWarning.hidden = true;
    el.startButton.hidden = false;
    el.stopButton.hidden = true;
}

function updateMeter() {
    if (!analyser) return;
    const buffer = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(buffer);

    const rms = calculateRmsLevel(buffer);
    const db = rmsToDecibels(rms);
    const isClipping = detectClipping(buffer);
    const fraction = decibelsToMeterFraction(db);

    el.meterFill.style.width = `${Math.round(fraction * 100)}%`;
    el.meterFill.classList.toggle('is-clipping', isClipping);
    el.dbReadout.textContent = db <= SILENCE_FLOOR_DB ? '—' : `${Math.round(db)} dB`;
    el.clipWarning.hidden = !isClipping;

    const now = performance.now();
    if (db >= peakDb || now > peakHoldUntil) {
        peakDb = db;
        peakHoldUntil = now + PEAK_HOLD_MS;
    }
    el.peakMarker.style.insetInlineStart = `${Math.round(decibelsToMeterFraction(peakDb) * 100)}%`;

    if (isClipping) {
        setStatus(t('clipping'));
    } else if (db <= SILENCE_FLOOR_DB + 2) {
        setStatus(t('silent'));
    } else if (db < -30) {
        setStatus(t('low'));
    } else {
        setStatus(t('good'));
    }

    animationFrameId = requestAnimationFrame(updateMeter);
}

async function startListening() {
    if (!navigator.mediaDevices?.getUserMedia) {
        setStatus(t('notSupported'));
        return;
    }

    const deviceId = el.deviceSelect.value || undefined;
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        });
    } catch (error) {
        if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
            setStatus(t('noMic'));
        } else {
            setStatus(t('permissionDenied'));
        }
        return;
    }

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(mediaStream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    await populateDeviceList(); // labels are only populated by the browser once permission has been granted

    el.startButton.hidden = true;
    el.stopButton.hidden = false;
    peakDb = SILENCE_FLOOR_DB;
    updateMeter();
}

function applyUiLanguage(language) {
    const root = document.documentElement;
    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
    root.dataset.language = language;
    const toggle = document.querySelector('#tool-language-toggle');
    if (toggle) toggle.textContent = language === 'ar' ? 'English' : 'العربية';
    try {
        localStorage.setItem('adawaty-language', language);
    } catch {
        // Language switching remains available without persistence.
    }
}

function wireLanguageToggle() {
    const toggle = document.querySelector('#tool-language-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
        applyUiLanguage(getUiLanguage() === 'ar' ? 'en' : 'ar');
    });

    let initialLanguage = navigator.language.toLowerCase().startsWith('ar') ? 'ar' : 'en';
    try {
        initialLanguage = localStorage.getItem('adawaty-language') ?? initialLanguage;
    } catch {
        // Browser language remains the fallback.
    }
    applyUiLanguage(initialLanguage === 'en' ? 'en' : 'ar');
}

function init() {
    wireLanguageToggle();

    const currentYear = document.querySelector('#current-year');
    if (currentYear) currentYear.textContent = String(new Date().getFullYear());

    el.startButton.addEventListener('click', startListening);
    el.stopButton.addEventListener('click', stopListening);
    el.deviceSelect.addEventListener('change', () => {
        if (mediaStream) {
            stopListening();
            startListening();
        }
    });

    // Stop the mic and release the hardware if the user navigates away
    // rather than clicking Stop -- a live microphone stream must never
    // keep running silently in a background/closed tab.
    window.addEventListener('pagehide', stopListening);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopListening();
    });

    populateDeviceList();
}

init();

// END OF FILE
