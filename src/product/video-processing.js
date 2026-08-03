import { canvasToBlob } from './image-processing.js';
import { inspectVideoFile } from './ffmpeg-processing.js';

async function loadVideo(file) {
    await inspectVideoFile(file);
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.preload = 'auto';
        video.muted = true;
        video.playsInline = true;
        video.onloadedmetadata = () => {
            if (!video.videoWidth || !video.videoHeight || !Number.isFinite(video.duration)) {
                URL.revokeObjectURL(url);
                reject(new Error('This video has invalid dimensions or duration.'));
                return;
            }
            resolve({ video, url });
        };
        video.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('This browser cannot decode the selected video.'));
        };
        video.src = url;
    });
}

function seekVideo(video, time) {
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const target = Math.max(0, Math.min(Number(time) || 0, duration));
    if (Math.abs(video.currentTime - target) < 0.01) {
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        const cleanup = () => {
            video.removeEventListener('seeked', handleSeeked);
            video.removeEventListener('error', handleError);
        };
        const handleSeeked = () => {
            cleanup();
            resolve();
        };
        const handleError = () => {
            cleanup();
            reject(new Error('Unable to seek to this point in the video.'));
        };
        video.addEventListener('seeked', handleSeeked, { once: true });
        video.addEventListener('error', handleError, { once: true });
        video.currentTime = target;
    });
}

function drawVideoFrame(video, canvas, destination) {
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Video frame processing is unavailable.');
    }
    context.drawImage(
        video,
        destination.x,
        destination.y,
        destination.width,
        destination.height,
    );
}

async function captureVideoFrame(video, {
    width = video.videoWidth,
    type = 'image/jpeg',
    quality = 0.92,
} = {}) {
    if (!video.videoWidth || !video.videoHeight) throw new Error('Video metadata is not ready yet.');
    const targetWidth = Math.max(1, Math.round(width));
    const targetHeight = Math.max(
        1,
        Math.round(targetWidth * video.videoHeight / video.videoWidth),
    );
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    drawVideoFrame(video, canvas, {
        x: 0,
        y: 0,
        width: targetWidth,
        height: targetHeight,
    });
    return {
        blob: await canvasToBlob(canvas, type, quality),
        width: targetWidth,
        height: targetHeight,
    };
}

export {
    captureVideoFrame,
    drawVideoFrame,
    loadVideo,
    seekVideo,
};

// END OF FILE
