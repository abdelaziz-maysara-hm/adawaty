import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
    getToolDefinition,
    listToolDefinitions,
} from '../../src/product/tool-definitions.js';
import { categoryLabels } from '../../src/product/category-labels.js';
import {
    audioBufferToWavBlob,
    processAudioBuffer,
} from '../../src/product/audio-processing.js';
import {
    parseDelimited,
    stringifyDelimited,
} from '../../src/product/definitions/list-data-tools.js';
import {
    jsonToXml,
    resolvePath,
} from '../../src/product/definitions/data-format-tools.js';
import {
    base64ToBytes,
    bytesToBase64,
} from '../../src/product/definitions/file-utility-tools.js';

const tools = listToolDefinitions();
const toolIds = tools.map((tool) => tool.id);
const toolIdSet = new Set(toolIds);

assert.ok(tools.length >= 521, `Expected at least 521 tools, got ${tools.length}`);
assert.equal(toolIds.length, new Set(toolIds).size, 'Tool IDs must be unique');
assert.deepEqual(
    [...new Set(tools.map((tool) => tool.category))]
        .filter((category) => !categoryLabels[category]),
    [],
    'Every published tool category must have localized catalogue labels.',
);

for (const id of [
    'audio-format-converter',
    'csv-to-excel-converter',
    'excel-to-csv-converter',
    'video-format-converter',
    'image-format-converter',
    'pdf-to-word-converter',
    'pdf-to-word-pro-converter',
    'bmi-calculator',
    'pdf-merge',
]) {
    assert.ok(toolIdSet.has(id), `Missing required tool: ${id}`);
}

const bmi = getToolDefinition('bmi-calculator');
const bmiResult = bmi.calculate({ height: 175, weight: 70 }, 'en');
assert.equal(bmiResult.value, '22.9');
assert.equal(bmiResult.label, 'Healthy weight');

assert.equal(
    getToolDefinition('percentage-calculator').calculate(
        { percentage: 20, number: 250 },
        'en',
    ).value,
    '50',
);

assert.equal(
    getToolDefinition('discount-calculator').calculate(
        { price: 1000, discount: 20 },
        'en',
    ).value,
    '800',
);

assert.equal(
    getToolDefinition('json-formatter').calculate({ text: '{"ready":true}' }, 'en').value,
    '{\n  "ready": true\n}',
);

assert.match(
    getToolDefinition('csv-to-json-converter').calculate({ csv: 'name,score\nAli,95' }, 'en').value,
    /"name": "Ali"/,
);
assert.equal(
    getToolDefinition('json-to-csv-converter').calculate({ json: '[{"name":"Ali","score":95}]' }, 'en').value,
    'name,score\nAli,95',
);

assert.deepEqual(
    parseDelimited('name,note\nAhmed,"Cairo, Egypt"\nSara,"Line 1\nLine 2"', ','),
    [
        ['name', 'note'],
        ['Ahmed', 'Cairo, Egypt'],
        ['Sara', 'Line 1\nLine 2'],
    ],
);
assert.equal(
    stringifyDelimited([['name', 'note'], ['Ahmed', 'Cairo, Egypt']], ','),
    'name,note\nAhmed,"Cairo, Egypt"',
);
assert.equal(resolvePath({ users: [{ name: 'Ahmed' }] }, 'users[0].name'), 'Ahmed');
assert.match(jsonToXml({ name: 'Ahmed & Sara' }, 'people'), /Ahmed &amp; Sara/);
assert.equal(bytesToBase64(new TextEncoder().encode('Adawaty')), 'QWRhd2F0eQ==');
assert.equal(new TextDecoder().decode(base64ToBytes('QWRhd2F0eQ==')), 'Adawaty');

for (const id of [
    'image-compressor',
    'image-resizer',
    'image-format-converter',
    'csv-to-excel-converter',
    'excel-to-csv-converter',
    'audio-format-converter',
    'audio-trimmer',
    'video-format-converter',
    'pdf-merge',
    'pdf-to-word-converter',
]) {
    const fileTool = getToolDefinition(id);
    assert.equal(typeof fileTool.process, 'function', `${id} must expose process()`);
    assert.equal(fileTool.inputs[0].type, 'file', `${id} first input must be file`);
}

const wavBlob = audioBufferToWavBlob({
    numberOfChannels: 1,
    length: 2,
    sampleRate: 44_100,
    getChannelData: () => new Float32Array([-1, 1]),
});
assert.equal(wavBlob.type, 'audio/wav');
assert.equal(wavBlob.size, 48);

const processedAudio = processAudioBuffer({
    numberOfChannels: 2,
    length: 4,
    sampleRate: 2,
    duration: 2,
    getChannelData: (index) => index === 0
        ? new Float32Array([1, 0.5, 0, -0.5])
        : new Float32Array([-1, -0.5, 0, 0.5]),
}, {
    startSeconds: 0.5,
    endSeconds: 1.5,
    gain: 0.5,
    channelMode: 'mono',
});
assert.equal(processedAudio.numberOfChannels, 1);
assert.equal(processedAudio.length, 2);
assert.equal(processedAudio.duration, 1);
assert.deepEqual(Array.from(processedAudio.getChannelData(0)), [0, 0]);

const toolPages = await Promise.all(
    tools.map((tool) =>
        readFile(
            new URL(`../../tools/${tool.id}/index.html`, import.meta.url),
            'utf8',
        ),
    ),
);

for (const [index, page] of toolPages.entries()) {
    assert.match(page, new RegExp(`data-tool-page="${tools[index].id}"`));
    if (tools[index].interactive) {
        assert.match(page, /src\/product\/visual-pdf-editor\.js/);
    } else {
        assert.match(page, /src\/product\/tool-page\.js/);
    }
    assert.match(page, /rel="canonical"/);
    assert.match(page, /"@type":"WebApplication"/);
    assert.match(page, /"isAccessibleForFree":true/);
    assert.match(page, /href="\.\.\/\.\.\/all-tools\/"/);
    assert.doesNotMatch(page, /TODO|PLACEHOLDER/i);
}

const visualEditorPage = toolPages[toolIds.indexOf('visual-pdf-editor')];
assert.match(visualEditorPage, /id="overlay-layer"/);
assert.match(visualEditorPage, /id="save-pdf"/);
assert.match(visualEditorPage, /visual-pdf-editor\.css/);

assert.equal(getToolDefinition('missing-tool'), null);

console.log(`Sprint 7 Batch 30 product tools verification passed (${tools.length} tools).`);

// END OF FILE
