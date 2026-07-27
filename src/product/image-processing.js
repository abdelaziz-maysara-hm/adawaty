function decodeImage(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Unable to decode this image.'));
        };
        image.src = url;
    });
}

function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => blob
                ? resolve(blob)
                : reject(new Error('Unable to create the processed image.')),
            type,
            quality,
        );
    });
}

function extensionFor(type) {
    return {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
    }[type] ?? 'png';
}

function outputName(file, suffix, type) {
    const base = file.name.replace(/\.[^.]+$/, '') || 'image';
    return `${base}-${suffix}.${extensionFor(type)}`;
}

async function renderImage({
    file,
    width,
    height,
    type,
    quality = 0.9,
    background = '',
}) {
    if (!(file instanceof File) || !file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file.');
    }

    const image = await decodeImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width ?? image.naturalWidth));
    canvas.height = Math.max(1, Math.round(height ?? image.naturalHeight));
    const context = canvas.getContext('2d', { alpha: type !== 'image/jpeg' });

    if (!context) {
        throw new Error('Image processing is unavailable in this browser.');
    }

    if (background) {
        context.fillStyle = background;
        context.fillRect(0, 0, canvas.width, canvas.height);
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    return {
        blob: await canvasToBlob(canvas, type, quality),
        width: canvas.width,
        height: canvas.height,
    };
}

export {
    outputName,
    renderImage,
};

// END OF FILE
