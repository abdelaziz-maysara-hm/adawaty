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
        'image/gif': 'gif',
        'image/bmp': 'bmp',
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
    source,
    rotation = 0,
    flipX = false,
    flipY = false,
    filter = 'none',
    watermark,
}) {
    if (!(file instanceof File) || !file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file.');
    }

    const image = await decodeImage(file);
    const sourceBox = source ?? {
        x: 0,
        y: 0,
        width: image.naturalWidth,
        height: image.naturalHeight,
    };
    const targetWidth = Math.max(1, Math.round(width ?? sourceBox.width));
    const targetHeight = Math.max(1, Math.round(height ?? sourceBox.height));
    const normalizedRotation = ((Number(rotation) % 360) + 360) % 360;
    const swapsDimensions = normalizedRotation === 90 || normalizedRotation === 270;
    const canvas = document.createElement('canvas');
    canvas.width = swapsDimensions ? targetHeight : targetWidth;
    canvas.height = swapsDimensions ? targetWidth : targetHeight;
    const context = canvas.getContext('2d', { alpha: type !== 'image/jpeg' && type !== 'image/bmp' });

    if (!context) {
        throw new Error('Image processing is unavailable in this browser.');
    }

    if (background) {
        context.fillStyle = background;
        context.fillRect(0, 0, canvas.width, canvas.height);
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.filter = filter;
    context.save();
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(normalizedRotation * Math.PI / 180);
    context.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    context.drawImage(
        image,
        sourceBox.x,
        sourceBox.y,
        sourceBox.width,
        sourceBox.height,
        -targetWidth / 2,
        -targetHeight / 2,
        targetWidth,
        targetHeight,
    );
    context.restore();
    context.filter = 'none';

    if (watermark?.text) {
        const fontSize = Math.max(12, Number(watermark.fontSize) || 32);
        const padding = Math.max(12, Math.round(fontSize * 0.6));
        context.save();
        context.globalAlpha = Math.min(
            1,
            Math.max(0.05, Number(watermark.opacity) || 0.7),
        );
        context.fillStyle = watermark.color || '#ffffff';
        context.font = `700 ${fontSize}px system-ui, sans-serif`;
        context.textBaseline = 'bottom';
        const textWidth = context.measureText(watermark.text).width;
        const positions = {
            'top-left': [padding, padding + fontSize],
            'top-right': [canvas.width - padding - textWidth, padding + fontSize],
            center: [
                (canvas.width - textWidth) / 2,
                (canvas.height + fontSize) / 2,
            ],
            'bottom-left': [padding, canvas.height - padding],
            'bottom-right': [
                canvas.width - padding - textWidth,
                canvas.height - padding,
            ],
        };
        const [x, y] = positions[watermark.position]
            ?? positions['bottom-right'];
        context.fillText(watermark.text, Math.max(padding, x), y);
        context.restore();
    }

    return {
        blob: await canvasToBlob(canvas, type, quality),
        width: canvas.width,
        height: canvas.height,
    };
}

async function inspectImage(file) {
    if (!(file instanceof File) || !file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file.');
    }

    const image = await decodeImage(file);
    return Object.freeze({
        width: image.naturalWidth,
        height: image.naturalHeight,
    });
}

export {
    canvasToBlob,
    decodeImage,
    inspectImage,
    outputName,
    renderImage,
};

// END OF FILE
