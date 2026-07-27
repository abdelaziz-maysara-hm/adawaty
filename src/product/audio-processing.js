function getAudioContext() {
    const AudioContextClass = window.AudioContext
        || window.webkitAudioContext;

    if (!AudioContextClass) {
        throw new Error('Audio processing is unavailable in this browser.');
    }

    return new AudioContextClass();
}

async function decodeAudioFile(file) {
    if (!(file instanceof File)) {
        throw new Error('Please select a valid media file.');
    }

    const context = getAudioContext();

    try {
        return await context.decodeAudioData(await file.arrayBuffer());
    } catch {
        throw new Error('This browser cannot decode the audio in this file.');
    } finally {
        await context.close();
    }
}

function writeText(view, offset, text) {
    for (let index = 0; index < text.length; index += 1) {
        view.setUint8(offset + index, text.charCodeAt(index));
    }
}

function audioBufferToWavBlob(audioBuffer) {
    const channelCount = Math.min(audioBuffer.numberOfChannels, 2);
    const sampleCount = audioBuffer.length;
    const bytesPerSample = 2;
    const blockAlign = channelCount * bytesPerSample;
    const dataSize = sampleCount * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    writeText(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeText(view, 8, 'WAVE');
    writeText(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channelCount, true);
    view.setUint32(24, audioBuffer.sampleRate, true);
    view.setUint32(28, audioBuffer.sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bytesPerSample * 8, true);
    writeText(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    const channels = Array.from(
        { length: channelCount },
        (_, index) => audioBuffer.getChannelData(index),
    );
    let offset = 44;

    for (let sample = 0; sample < sampleCount; sample += 1) {
        for (let channel = 0; channel < channelCount; channel += 1) {
            const value = Math.max(-1, Math.min(1, channels[channel][sample]));
            view.setInt16(
                offset,
                value < 0 ? value * 0x8000 : value * 0x7fff,
                true,
            );
            offset += bytesPerSample;
        }
    }

    return new Blob([buffer], { type: 'audio/wav' });
}

function formatAudioDuration(duration) {
    const totalSeconds = Math.max(0, Math.round(duration));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
}

function processAudioBuffer(audioBuffer, {
    startSeconds = 0,
    endSeconds = audioBuffer.duration,
    gain = 1,
    fadeInSeconds = 0,
    fadeOutSeconds = 0,
    channelMode = 'preserve',
} = {}) {
    const sampleRate = audioBuffer.sampleRate;
    const startFrame = Math.max(
        0,
        Math.min(audioBuffer.length, Math.floor(startSeconds * sampleRate)),
    );
    const endFrame = Math.max(
        startFrame,
        Math.min(audioBuffer.length, Math.ceil(endSeconds * sampleRate)),
    );
    const length = endFrame - startFrame;
    const sourceChannels = Array.from(
        { length: audioBuffer.numberOfChannels },
        (_, index) => audioBuffer.getChannelData(index),
    );
    const numberOfChannels = channelMode === 'mono'
        ? 1
        : Math.min(sourceChannels.length, 2);
    const outputChannels = Array.from(
        { length: numberOfChannels },
        () => new Float32Array(length),
    );

    for (let index = 0; index < length; index += 1) {
        const elapsed = index / sampleRate;
        const remaining = (length - index - 1) / sampleRate;
        const fadeInGain = fadeInSeconds > 0
            ? Math.min(1, elapsed / fadeInSeconds)
            : 1;
        const fadeOutGain = fadeOutSeconds > 0
            ? Math.min(1, remaining / fadeOutSeconds)
            : 1;
        const envelope = gain * Math.min(fadeInGain, fadeOutGain);

        if (channelMode === 'mono') {
            const mixed = sourceChannels.reduce(
                (sum, channel) => sum + channel[startFrame + index],
                0,
            ) / sourceChannels.length;
            outputChannels[0][index] = mixed * envelope;
            continue;
        }

        for (let channel = 0; channel < numberOfChannels; channel += 1) {
            outputChannels[channel][index] = sourceChannels[channel][
                startFrame + index
            ] * envelope;
        }
    }

    return {
        numberOfChannels,
        length,
        sampleRate,
        duration: length / sampleRate,
        getChannelData: (index) => outputChannels[index],
    };
}

export {
    audioBufferToWavBlob,
    decodeAudioFile,
    formatAudioDuration,
    processAudioBuffer,
};

// END OF FILE
