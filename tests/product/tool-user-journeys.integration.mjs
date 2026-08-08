import assert from 'node:assert/strict';

import {
    getToolDefinition,
    listToolDefinitions,
} from '../../src/product/tool-definitions.js';

const tools = listToolDefinitions();
const nonFileTools = tools.filter(
    (tool) => !tool.inputs.some((input) => input.type === 'file'),
);

const browserOnlyTools = new Set([
    'html-class-extractor',
    'html-comment-remover',
    'html-data-attribute-extractor',
    'html-form-field-extractor',
    'html-heading-extractor',
    'html-id-extractor',
    'html-image-source-extractor',
    'html-inline-event-remover',
    'html-link-extractor',
    'html-list-to-text-converter',
    'html-meta-tag-extractor',
    'html-script-remover',
    'html-style-remover',
    'html-table-to-csv-converter',
    'html-to-markdown-converter',
    'qr-code-generator',
    'code-to-image',
    'text-to-handwriting',
]);

const inputOverrides = Object.freeze({
    'jwt-decoder': Object.freeze({
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiQWRhd2F0eSJ9.c2lnbmF0dXJl',
    }),
    'number-base-converter': Object.freeze({
        value: 'FF',
        fromBase: '16',
        toBase: '10',
    }),
});

function getSampleValue(input, index) {
    if (
        input.placeholder !== undefined
        && String(input.placeholder).trim() !== ''
    ) {
        return input.type === 'number'
            ? Number(input.placeholder)
            : String(input.placeholder);
    }

    if (input.type === 'number') {
        let value = Number.isFinite(Number(input.min))
            ? Number(input.min)
            : index + 1;

        if (value <= 0) {
            value = index + 1;
        }

        if (Number.isFinite(Number(input.max)) && value > Number(input.max)) {
            value = Number(input.max);
        }

        return value;
    }

    if (input.type === 'select') {
        return input.options?.[0]?.value ?? '';
    }

    if (input.type === 'date') {
        return index === 0 ? '2026-01-01' : '2026-07-29';
    }

    if (input.type === 'datetime-local') {
        return '2026-07-29T12:00';
    }

    if (input.type === 'time') {
        return index === 0 ? '09:00' : '17:00';
    }

    if (input.type === 'color') {
        return '#336699';
    }

    return index === 0 ? 'Adawaty sample' : 'Second sample';
}

function createSampleInput(tool) {
    const generated = Object.fromEntries(
        tool.inputs.map((input, index) => [
            input.id,
            getSampleValue(input, index),
        ]),
    );

    return {
        ...generated,
        ...(inputOverrides[tool.id] ?? {}),
    };
}

function assertLocalizedText(value, context) {
    assert.equal(typeof value?.ar, 'string', `${context} needs Arabic copy`);
    assert.ok(value.ar.trim(), `${context} Arabic copy must not be empty`);
    assert.equal(typeof value?.en, 'string', `${context} needs English copy`);
    assert.ok(value.en.trim(), `${context} English copy must not be empty`);
}

function assertOutputContract(output, toolId) {
    assert.ok(output && typeof output === 'object', `${toolId} must return an object`);
    assert.ok('value' in output, `${toolId} output must include value`);
    assert.equal(typeof output.label, 'string', `${toolId} output needs a label`);
    assert.equal(typeof output.details, 'string', `${toolId} output needs details`);
}

for (const tool of tools) {
    assertLocalizedText(tool.title, `${tool.id} title`);
    assertLocalizedText(tool.description, `${tool.id} description`);
    assert.equal(
        typeof tool.process === 'function' || typeof tool.calculate === 'function' || tool.interactive === true,
        true,
        `${tool.id} needs an executable handler`,
    );

    const inputIds = tool.inputs.map((input) => input.id);
    assert.equal(
        inputIds.length,
        new Set(inputIds).size,
        `${tool.id} input IDs must be unique`,
    );

    for (const input of tool.inputs) {
        assertLocalizedText(input.label, `${tool.id}.${input.id} label`);
    }
}

const executableWithoutBrowser = nonFileTools.filter(
    (tool) => !browserOnlyTools.has(tool.id),
);
const executionFailures = [];

for (const tool of executableWithoutBrowser) {
    try {
        const handler = tool.process ?? tool.calculate;
        const output = await handler(createSampleInput(tool), 'en');
        assertOutputContract(output, tool.id);
    } catch (error) {
        executionFailures.push({
            id: tool.id,
            message: error?.message ?? String(error),
        });
    }
}

assert.deepEqual(
    executionFailures,
    [],
    `User-journey contract failures:\n${executionFailures
        .map(({ id, message }) => `- ${id}: ${message}`)
        .join('\n')}`,
);

assert.equal(nonFileTools.length, 379);
assert.equal(browserOnlyTools.size, 18);
assert.equal(executableWithoutBrowser.length, 361);

const journeys = [
    {
        id: 'bmi-calculator',
        input: { height: 170, weight: 70 },
        expectedValue: '24.2',
    },
    {
        id: 'word-counter',
        input: { text: 'one two three\nfour five' },
        expectedValue: '5',
    },
    {
        id: 'json-formatter',
        input: { text: '{"ready":true}' },
        expectedValue: '{\n  "ready": true\n}',
    },
    {
        id: 'text-case-converter',
        input: { text: 'Hello World', mode: 'upper' },
        expectedValue: 'HELLO WORLD',
    },
    {
        id: 'slug-generator',
        input: { text: 'Hello World', separator: '-' },
        expectedValue: 'hello-world',
    },
    {
        id: 'base64-encoder-decoder',
        input: { text: 'Adawaty', operation: 'encode' },
        expectedValue: 'QWRhd2F0eQ==',
    },
    {
        id: 'url-encoder-decoder',
        input: { text: 'hello world', operation: 'encode' },
        expectedValue: 'hello%20world',
    },
];

for (const journey of journeys) {
    const tool = getToolDefinition(journey.id);
    const handler = tool.process ?? tool.calculate;
    const output = await handler(journey.input, 'en');
    assert.equal(
        output.value,
        journey.expectedValue,
        `${journey.id} returned an unexpected result`,
    );
}

console.log(
    `User-journey verification passed: ${tools.length} metadata contracts, `
    + `${executableWithoutBrowser.length} executable tools, `
    + `${journeys.length} exact-result journeys.`,
);

// END OF FILE
