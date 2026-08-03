import assert from 'node:assert/strict';
import { File as NodeFile } from 'node:buffer';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { inspectVideoFile } from '../../src/product/ffmpeg-processing.js';
import { inspectPdfFile } from '../../src/product/pdf-processing.js';

globalThis.File ??= NodeFile;

const directory = await mkdtemp(path.join(tmpdir(), 'adawaty-real-files-'));

async function fileFromDisk(name, bytes, type) {
    const filePath = path.join(directory, name);
    await writeFile(filePath, bytes);
    return new File([await readFile(filePath)], name, { type });
}

try {
    const pdfBytes = new TextEncoder().encode([
        '%PDF-1.4',
        '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
        '2 0 obj<</Type/Pages/Count 0/Kids[]>>endobj',
        'xref',
        '0 3',
        '0000000000 65535 f ',
        'trailer<</Root 1 0 R/Size 3>>',
        'startxref',
        '0',
        '%%EOF',
    ].join('\n'));
    const mp4Bytes = new Uint8Array([
        0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70,
        0x69, 0x73, 0x6f, 0x6d, 0, 0, 2, 0,
        0x69, 0x73, 0x6f, 0x6d, 0x6d, 0x70, 0x34, 0x32,
    ]);

    const pdf = await fileFromDisk('document.pdf', pdfBytes, 'application/pdf');
    const videoWithoutMime = await fileFromDisk('clip.mp4', mp4Bytes, '');
    const fakePdf = await fileFromDisk('fake.pdf', new TextEncoder().encode('not a document'), 'application/pdf');
    const fakeVideo = await fileFromDisk('fake.mp4', new TextEncoder().encode('not a video file'), 'video/mp4');

    assert.deepEqual(await inspectPdfFile(pdf), { size: pdfBytes.length, version: '1.4' });
    assert.deepEqual(await inspectVideoFile(videoWithoutMime), { size: mp4Bytes.length, container: 'iso-media' });
    await assert.rejects(() => inspectPdfFile(fakePdf), /not a readable PDF/);
    await assert.rejects(() => inspectVideoFile(fakeVideo), /not a readable video/);
} finally {
    await rm(directory, { recursive: true, force: true });
}

console.log('Real PDF and video files passed signature inspection from disk.');

// END OF FILE