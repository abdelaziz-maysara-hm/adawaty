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
import {
    normalizeSampleCoordinate,
    rgbToHsl,
} from '../../src/product/definitions/image-editing-tools.js';
import { buildTraceOptions } from '../../src/product/definitions/image-svg-tracer-tool.js';
import { parseMarkdownBlocks } from '../../src/product/definitions/text-to-pdf-tool.js';
import { structuredPagesToMarkdown } from '../../src/product/definitions/pdf-content-tools.js';
import { addPageNumbers } from '../../src/product/definitions/pdf-document-tools.js';
import { fitInside } from '../../src/product/definitions/pdf-to-powerpoint-tool.js';
import {
    columnWidths,
    textItemsToRows,
} from '../../src/product/definitions/pdf-to-excel-tool.js';
import {
    paginateSheet,
    shortenCell,
} from '../../src/product/definitions/excel-to-pdf-tool.js';
import {
    decodeXmlText,
    extractSlideText,
    naturalSlideOrder,
    slideMediaPaths,
} from '../../src/product/definitions/powerpoint-to-pdf-tool.js';
import {
    compressionSettings,
    fittedDimensions,
    mediaMime,
} from '../../src/product/definitions/powerpoint-compressor-tool.js';
import { isWordMediaPath } from '../../src/product/definitions/word-compressor-tool.js';
import { documentXmlToText } from '../../src/product/definitions/office-utility-tools.js';
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

assert.equal(normalizeSampleCoordinate(0, 100), 0);
assert.equal(normalizeSampleCoordinate(50, 100), 50);
assert.equal(normalizeSampleCoordinate(100, 100), 99);
assert.equal(normalizeSampleCoordinate(150, 20), 19);
assert.deepEqual(rgbToHsl(255, 0, 0), { hue: 0, saturation: 100, lightness: 50 });
assert.deepEqual(rgbToHsl(128, 128, 128), { hue: 0, saturation: 0, lightness: 50 });
assert.deepEqual(
    buildTraceOptions('logo', 30),
    {
        ltres: 1,
        qtres: 1,
        pathomit: 12,
        colorsampling: 2,
        numberofcolors: 8,
        mincolorratio: 0.02,
        colorquantcycles: 3,
        scale: 1,
        roundcoords: 1,
        viewbox: true,
        desc: false,
    },
);
assert.equal(buildTraceOptions('detailed', 40).numberofcolors, 32);
const wideSlide = fitInside(1600, 900, 13.333, 7.5);
assert.equal(wideSlide.width, 13.333);
assert.ok(Math.abs(wideSlide.height - 7.5) < 0.001);
const portraitSlide = fitInside(800, 1200, 13.333, 7.5);
assert.equal(portraitSlide.height, 7.5);
assert.ok(portraitSlide.x > 4);
const extractedRows = textItemsToRows([
    { str: 'Name', transform: [1, 0, 0, 10, 10, 100], width: 30, height: 10 },
    { str: 'Score', transform: [1, 0, 0, 10, 120, 100], width: 30, height: 10 },
    { str: 'Adawaty', transform: [1, 0, 0, 10, 10, 80], width: 45, height: 10 },
    { str: '98', transform: [1, 0, 0, 10, 120, 80], width: 12, height: 10 },
]);
assert.deepEqual(extractedRows, [['Name', 'Score'], ['Adawaty', '98']]);
assert.deepEqual(columnWidths(extractedRows), [{ wch: 9 }, { wch: 8 }]);
assert.deepEqual(
    paginateSheet([
        ['Name', 'Score', 'City'],
        ['A', 98, 'Cairo'],
        ['B', 91, 'Giza'],
        ['C', 87, 'Alexandria'],
    ], 2, 2),
    [
        [['Name', 'Score'], ['A', 98], ['B', 91]],
        [['Name', 'Score'], ['C', 87]],
        [['City'], ['Cairo'], ['Giza']],
        [['City'], ['Alexandria']],
    ],
);
assert.equal(shortenCell('a'.repeat(50), 10), 'aaaaaaaaa…');

assert.deepEqual(parseMarkdownBlocks('# Title\n\n- **Fast**\n> Private\n```\nconst ok = true;\n```'), [
    { kind: 'heading', level: 1, text: 'Title' },
    { kind: 'blank', text: '' },
    { kind: 'list', text: '• Fast' },
    { kind: 'quote', text: 'Private' },
    { kind: 'code', text: 'const ok = true;' },
]);

assert.equal(
    structuredPagesToMarkdown([
        [
            { text: 'Document title', headingLevel: 1 },
            { text: 'First paragraph.', headingLevel: 0 },
        ],
        [{ text: 'Second page', headingLevel: 2 }],
    ]),
    '<!-- Page 1 -->\n\n# Document title\n\nFirst paragraph.\n\n---\n\n<!-- Page 2 -->\n\n## Second page',
);

assert.equal(timePartsToSeconds(0, 10), 10);
assert.equal(decodeXmlText('Research &amp; Development &#x2014; 2026'), 'Research & Development — 2026');
assert.deepEqual(
    extractSlideText('<p:a:p><a:r><a:t>Quarterly </a:t></a:r><a:r><a:t>results</a:t></a:r></p:a:p><p:a:p><a:r><a:t>Revenue &amp; growth</a:t></a:r></p:a:p>'),
    ['Quarterly results', 'Revenue & growth'],
);
assert.deepEqual(
    ['ppt/slides/slide10.xml', 'ppt/slides/slide2.xml', 'ppt/slides/slide1.xml'].sort(naturalSlideOrder),
    ['ppt/slides/slide1.xml', 'ppt/slides/slide2.xml', 'ppt/slides/slide10.xml'],
);
assert.deepEqual(
    slideMediaPaths(
        'ppt/slides/slide1.xml',
        '<a:blip r:embed="rId7"/>',
        '<Relationship Id="rId7" Target="../media/image1.png"/>',
    ),
    ['ppt/media/image1.png'],
);
assert.deepEqual(fittedDimensions(4000, 2000, 1920), { width: 1920, height: 960 });
assert.deepEqual(fittedDimensions(800, 600, 1920), { width: 800, height: 600 });
assert.equal(mediaMime('ppt/media/photo.jpeg'), 'image/jpeg');
assert.equal(mediaMime('ppt/media/vector.svg'), undefined);
assert.deepEqual(compressionSettings('strong'), { maximumDimension: 1280, jpegQuality: 0.62 });
assert.equal(isWordMediaPath('word/media/image1.png'), true);
assert.equal(isWordMediaPath('ppt/media/image1.png'), false);
assert.equal(
    documentXmlToText('<w:p><w:r><w:t>Hello &amp; welcome</w:t></w:r></w:p><w:p><w:r><w:t>Second paragraph</w:t></w:r></w:p>'),
    'Hello & welcome\n\nSecond paragraph',
);
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
