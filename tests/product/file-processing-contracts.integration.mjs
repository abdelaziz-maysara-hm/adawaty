import assert from 'node:assert/strict';
import { File as NodeFile } from 'node:buffer';

import {
    formatAudioDuration,
} from '../../src/product/audio-processing.js';
import {
    assertAudioFile,
    assertMediaFile,
    assertVideoFile,
} from '../../src/product/ffmpeg-processing.js';
import {
    inspectImage,
    outputName as imageOutputName,
} from '../../src/product/image-processing.js';
import {
    assertImageFile,
} from '../../src/product/ocr-processing.js';
import { assertOverlayImage } from '../../src/product/definitions/pdf-editor-tools.js';
import { addPageNumbers } from '../../src/product/definitions/pdf-document-tools.js';
import {
    timePartsToSeconds,
    videoProcessingToolDefinitions,
} from '../../src/product/definitions/video-processing-tools.js';
import {
    assertPdfFile,
    createPdfBlob,
    outputName as pdfOutputName,
    parsePageSelection,
} from '../../src/product/pdf-processing.js';

globalThis.File ??= NodeFile;

const png = new File(
    [new Uint8Array([137, 80, 78, 71])],
    'sample.png',
    { type: 'image/png' },
);
const pdf = new File(
    [new TextEncoder().encode('%PDF-1.4\n%%EOF')],
    'sample.pdf',
    { type: 'application/pdf' },
);
const wav = new File(
    [new Uint8Array([82, 73, 70, 70])],
    'sample.wav',
    { type: 'audio/wav' },
);
const mp4 = new File(
    [new Uint8Array([0, 0, 0, 24])],
    'sample.mp4',
    { type: 'video/mp4' },
);
const text = new File(
    [new TextEncoder().encode('Adawaty')],
    'sample.txt',
    { type: 'text/plain' },
);

assert.equal(imageOutputName(png, 'compressed', 'image/webp'), 'sample-compressed.webp');
assert.equal(imageOutputName(png, 'resized', 'image/jpeg'), 'sample-resized.jpg');
assert.equal(pdfOutputName(pdf, 'rotated'), 'sample-rotated.pdf');

assert.deepEqual(parsePageSelection('all', 4), [0, 1, 2, 3]);
assert.deepEqual(parsePageSelection('1-3,2,5', 5), [0, 1, 2, 4]);
assert.throws(() => parsePageSelection('0', 3), /between 1 and 3/);
assert.throws(() => parsePageSelection('3-2', 3), /between 1 and 3/);
assert.throws(() => parsePageSelection('one', 3), /page numbers/);

const pdfBlob = createPdfBlob(new Uint8Array([37, 80, 68, 70]));
assert.equal(pdfBlob.type, 'application/pdf');
assert.equal(pdfBlob.size, 4);

assert.doesNotThrow(() => assertPdfFile(pdf));
assert.doesNotThrow(() => assertOverlayImage(png));
assert.doesNotThrow(() => assertOverlayImage(undefined));
assert.doesNotThrow(() => assertImageFile(png));
assert.doesNotThrow(() => assertAudioFile(wav));
assert.doesNotThrow(() => assertVideoFile(mp4));
assert.doesNotThrow(() => assertMediaFile(text));

assert.throws(() => assertPdfFile(text), /valid PDF/);
assert.throws(() => assertOverlayImage(text), /PNG or JPG/);
assert.throws(() => assertImageFile(text), /valid image/);
assert.throws(() => assertAudioFile(text), /valid audio/);
assert.throws(() => assertVideoFile(text), /valid video/);

await assert.rejects(() => inspectImage(text), /valid image/);

assert.equal(formatAudioDuration(0), '0:00');
assert.equal(formatAudioDuration(65.2), '1:05');
assert.equal(formatAudioDuration(3_661), '61:01');

assert.equal(timePartsToSeconds(0, 10), 10);
assert.equal(timePartsToSeconds(2, 15.5), 135.5);
assert.deepEqual(
    videoProcessingToolDefinitions['video-trimmer'].inputs.map(({ id }) => id),
    ['video', 'startMinutes', 'startSeconds', 'endMinutes', 'endSeconds'],
);

for (const pageCount of [1, 3, 6]) {
    const rendered = [];
    const pages = Array.from({ length: pageCount }, () => ({
        drawText(text, options) {
            rendered.push({ text, options });
        },
        getHeight: () => 800,
        getWidth: () => 600,
    }));
    addPageNumbers(
        { getPages: () => pages },
        { widthOfTextAtSize: (text) => text.length * 7 },
        { rgb: (...channels) => channels },
        1,
        12,
        'bottom-center',
    );
    assert.equal(rendered.length, pageCount);
    assert.deepEqual(
        rendered.map(({ text }) => text),
        Array.from({ length: pageCount }, (_, index) => String(index + 1)),
    );
}

console.log('File-processing contracts passed for image, PDF, audio and video inputs.');

// END OF FILE
