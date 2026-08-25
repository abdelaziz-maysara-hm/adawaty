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
    // bcrypt-generator is the first non-file tool that dynamically imports
    // a CDN module (bcryptjs) at runtime. Every other CDN-dependent tool
    // shipped so far (piexifjs, pdf-lib, heic2any, pdf-encrypt-lite) takes
    // a file input, which already excludes it from this harness's
    // auto-execution (no real File object to synthesize) -- so this is the
    // first time it surfaces: Node's default ESM loader only supports
    // file:/data: schemes for dynamic import(), not https:, so
    // import('https://cdn.jsdelivr.net/...') genuinely cannot succeed here
    // even though it works correctly in every real browser. Confirmed this
    // is an environment limitation, not a bug, by testing the exact same
    // bcryptjs calls (genSaltSync/hashSync/compareSync) directly against
    // the locally-installed package before this exclusion was added.
    'bcrypt-generator',
    // txt-to-pdf uses document.createElement('canvas') directly to render
    // text pages as images -- deliberately, since this is the only way to
    // get correctly-shaped Arabic text into a PDF (pdf-lib's native
    // drawText can't encode Arabic at all, and lacks a text-shaping
    // engine even with a custom font). Genuine DOM dependency, not
    // testable in this Node harness, same class as html-to-markdown-
    // converter above.
    'txt-to-pdf',
    // markdown-to-pdf shares the same browser Canvas renderer so Arabic text
    // keeps its native shaping and direction. Node has no document/canvas;
    // its deterministic Markdown parser is covered by the processing tests.
    'markdown-to-pdf',
    // Uses the external HIBP k-anonymity range endpoint after hashing the
    // password locally. Its parsing and hashing contracts are tested without
    // making a live network request in popular-security-tools.integration.mjs.
    'password-breach-checker',
    // MediaRecorder + getUserMedia/getDisplayMedia — browser-only APIs.
    'sound-recorder',
    'screen-recorder',
    // Fetches an arbitrary user-provided URL live (via a CORS relay in the
    // browser) to audit its HTML. Same class as password-breach-checker
    // above: a live external network call has no place in an automated
    // test run, regardless of environment. Confirmed the placeholder URL
    // (https://example.com/) is blocked by this specific sandbox's egress
    // policy (x-deny-reason: host_not_allowed), separate from the tool's
    // own correctness -- excluded on the same "no live network calls in
    // tests" principle either way.
    'seo-checker',
    // website-builder is an interactive workspace tool (interactive: true,
    // like visual-pdf-editor) with no process/calculate handler by design
    // -- it has its own dedicated UI, not a form-and-result flow. Unlike
    // visual-pdf-editor, it has no file input, so it isn't automatically
    // excluded via nonFileTools and needs an explicit entry here.
    'website-builder',
    // photo-editor is the same class of interactive workspace tool as
    // website-builder, with no process/calculate handler by design and
    // no file input (the file is chosen inside its own UI), so it also
    // needs an explicit entry here.
    'photo-editor',
    // mic-test is a live-microphone interactive workspace tool, same
    // class as website-builder/photo-editor: no process/calculate
    // handler by design, and no file input at all (it operates on a
    // live getUserMedia stream, not an uploaded file).
    'mic-test',
    // background-remover is the same class of interactive workspace
    // tool: no process/calculate handler by design, and no file input
    // (the file is chosen inside its own upload UI).
    'background-remover',
    // text-summarizer is the same class of interactive workspace tool:
    // no process/calculate handler by design, and no file input (the
    // text is typed directly into its own UI).
    'text-summarizer',
    // replace-background is the same class of interactive workspace
    // tool: no process/calculate handler by design, and no file input
    // (the file is chosen inside its own upload UI).
    'replace-background',
    // currency-converter is a different exclusion class from everything
    // above: it's a normal form-based tool (no interactive workspace,
    // no DOM/canvas dependency) that genuinely needs a live network
    // call to work at all -- it fetches current rates through the
    // Adawaty Cloud Worker (see worker-entry.js, the site's own Worker
    // script, which now also handles /api/* routes), which
    // isn't reachable from this Node test harness (no real network
    // egress to an as-yet-undeployed Worker URL). The pure conversion
    // math (convertAmount()) was verified directly and separately with
    // realistic exchange rates before this exclusion was added; only
    // the live network fetch itself is untestable here.
    'currency-converter',
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
    const overrides = inputOverrides[tool.id] ?? {};
    return Object.fromEntries(
        tool.inputs.map((input, index) => [
            input.id,
            Object.prototype.hasOwnProperty.call(overrides, input.id)
                ? overrides[input.id]
                : getSampleValue(input, index),
        ]),
    );
}

function assertLocalizedText(value, label) {
    assert.equal(typeof value?.ar, 'string', `${label}.ar must be a string`);
    assert.equal(typeof value?.en, 'string', `${label}.en must be a string`);
    assert.ok(value.ar.trim().length > 0, `${label}.ar must not be empty`);
    assert.ok(value.en.trim().length > 0, `${label}.en must not be empty`);
}

function assertOutputContract(output, toolId) {
    assert.equal(typeof output?.value, 'string', `${toolId} must return value string`);
    assert.equal(typeof output?.label, 'string', `${toolId} must return label string`);
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

assert.equal(nonFileTools.length, 421);
assert.equal(browserOnlyTools.size, 32);
assert.equal(executableWithoutBrowser.length, 389);

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
