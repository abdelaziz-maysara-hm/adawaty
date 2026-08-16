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
assert.ok(tools.some((tool) => tool.id === 'seo-checker'), 'SEO checker must be registered.');
const toolIds = tools.map((tool) => tool.id);
const toolIdSet = new Set(toolIds);
const arabicScript = /[\u0600-\u06FF]/;

assert.ok(tools.length >= 430, `Expected at least 430 curated tools, got ${tools.length}`);
assert.equal(toolIds.length, new Set(toolIds).size, 'Tool IDs must be unique');
assert.deepEqual(
    [...new Set(tools.map((tool) => tool.category))]
        .filter((category) => !categoryLabels[category]),
    [],
    'Every published tool category must have localized catalogue labels.',
);

for (const tool of tools) {
    for (const [path, value] of [
        ['title.en', tool.title?.en],
        ['description.en', tool.description?.en],
        ['note.en', tool.note?.en],
        ['action.en', tool.action?.en],
    ]) {
        assert.doesNotMatch(String(value ?? ''), arabicScript, `${tool.id} ${path} must not contain Arabic copy`);
    }
    for (const input of tool.inputs ?? []) {
        assert.doesNotMatch(String(input.label?.en ?? ''), arabicScript, `${tool.id}.${input.id} English label must not contain Arabic copy`);
        assert.doesNotMatch(String(input.unit?.en ?? ''), arabicScript, `${tool.id}.${input.id} English unit must not contain Arabic copy`);
        if (input.placeholder && typeof input.placeholder === 'object') {
            assert.doesNotMatch(String(input.placeholder.en ?? ''), arabicScript, `${tool.id}.${input.id} English placeholder must not contain Arabic copy`);
        }
    }
}

for (const id of [
    'audio-format-converter',
    'csv-to-excel-converter',
    'excel-to-csv-converter',
    'video-format-converter',
    'video-splitter',
    'add-audio-to-video',
    'image-format-converter',
    'pdf-to-word-converter',
    'bmi-calculator',
    'pdf-merge',
    'password-breach-checker',
    'sri-hash-generator',
    'csp-header-generator',
]) {
    assert.ok(toolIdSet.has(id), `Missing required tool: ${id}`);
}

const bmi = getToolDefinition('bmi-calculator');
const bmiResult = bmi.calculate({ height: 175, weight: 70 }, 'en');
assert.equal(bmiResult.value, '22.9');
assert.equal(bmiResult.label, 'Healthy weight');

// percentage-calculator and discount-calculator were deliberately retired on 2026-07-30
// ("Retired 86 low-value arithmetic, direct-formula, and media-metadata calculators") and this
// test used to assert they stay retired. Un-retired 2026-08-08 per an explicit, fresh decision
// from the site owner: keep them specifically if real search demand supports it. Checked --
// "percentage calculator" is the flagship/hub tool on essentially every competing calculator
// site, and "discount calculator" / "tip calculator" are commonly offered as separate,
// distinctly-titled pages by the same competitors (not just modes folded into one page), which
// is why all three (including tip-calculator, already implemented in finance.js) were brought
// back rather than just percentage-calculator alone. If this decision is revisited, restore the
// two `assert.equal(..., null)` lines below and re-add the ids to retired-tool-ids.js.
assert.ok(getToolDefinition('percentage-calculator') !== null, 'percentage-calculator should be live (see comment above)');
assert.ok(getToolDefinition('discount-calculator') !== null, 'discount-calculator should be live (see comment above)');
assert.ok(getToolDefinition('tip-calculator') !== null, 'tip-calculator should be live (see comment above)');

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
    'video-splitter',
    'add-audio-to-video',
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
        // Interactive tools each own a dedicated JS module rather than the
        // generic tool-page.js form renderer -- verified generically here
        // (any src/product/*.js module script) rather than hardcoding one
        // specific tool's filename, since more than one interactive tool
        // can exist over time (website-builder, and future ones).
        assert.match(page, /<script type="module" src="\.\.\/\.\.\/src\/product\/[\w-]+\.js/);
    } else {
        assert.match(page, /src\/product\/tool-page\.js/);
    }
    assert.match(page, /rel="canonical"/);
    assert.match(page, /"@type":"SoftwareApplication"/);
    assert.match(page, /"isAccessibleForFree":true/);
    assert.match(page, /href="\.\.\/\.\.\/all-tools\/"/);
    assert.doesNotMatch(page, /TODO|PLACEHOLDER/i);
}

assert.equal(getToolDefinition('missing-tool'), null);

console.log(`Curated product tools verification passed (${tools.length} tools).`);

// END OF FILE
