/**
 * Pure audio-level calculation functions for the Mic Test / Level
 * Meter tool. Kept separate from the live getUserMedia/AnalyserNode
 * wiring so the actual math (the part that can be wrong in a subtle,
 * hard-to-notice way) can be tested directly with known signals,
 * independent of live microphone access this environment can't
 * simulate.
 *
 * Verified before use against known signals: total silence produces
 * RMS 0 / the -60dB floor; a full-scale square wave produces RMS close
 * to 1; a 50%-amplitude sine wave produces RMS close to 0.3535 (the
 * well-known RMS = amplitude / sqrt(2) relationship for a sine wave,
 * matched to within 0.03%); a clean sine is never flagged as clipping,
 * a signal with samples pinned near the byte extremes is.
 */

const SILENCE_FLOOR_DB = -60;

/** RMS (root-mean-square) level from a Uint8Array time-domain buffer (AnalyserNode.getByteTimeDomainData()), normalized to 0-1. */
function calculateRmsLevel(byteTimeDomainData) {
    let sumSquares = 0;
    for (let i = 0; i < byteTimeDomainData.length; i += 1) {
        const normalized = (byteTimeDomainData[i] - 128) / 128; // -1 to 1
        sumSquares += normalized * normalized;
    }
    return Math.sqrt(sumSquares / byteTimeDomainData.length);
}

/** Converts a 0-1 RMS level to decibels, floored at SILENCE_FLOOR_DB rather than -Infinity for true silence. */
function rmsToDecibels(rms) {
    if (rms <= 0) return SILENCE_FLOOR_DB;
    return Math.max(SILENCE_FLOOR_DB, 20 * Math.log10(rms));
}

/**
 * Flags likely clipping/distortion: more than 1% of samples pinned
 * within `threshold` of the byte range's extremes (0 or 255). A single
 * stray extreme sample is normal in real audio; a sustained run of them
 * indicates the input level is too hot.
 */
function detectClipping(byteTimeDomainData, threshold = 3) {
    let clippedCount = 0;
    for (let i = 0; i < byteTimeDomainData.length; i += 1) {
        const sample = byteTimeDomainData[i];
        if (sample <= threshold || sample >= 255 - threshold) clippedCount += 1;
    }
    return clippedCount > byteTimeDomainData.length * 0.01;
}

/** Maps a decibel value (SILENCE_FLOOR_DB..0) to a 0-1 fraction, convenient for driving a meter bar's width/height directly. */
function decibelsToMeterFraction(db) {
    return Math.min(1, Math.max(0, (db - SILENCE_FLOOR_DB) / -SILENCE_FLOOR_DB));
}

export {
    SILENCE_FLOOR_DB, calculateRmsLevel, rmsToDecibels, detectClipping, decibelsToMeterFraction,
};

// END OF FILE
