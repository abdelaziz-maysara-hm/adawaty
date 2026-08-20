import assert from 'node:assert/strict';

import { getToolDefinition } from '../../src/product/tool-definitions.js';
import { safeHexColor, result } from '../../src/product/definitions/add-background-tools.js';

// ---------------------------------------------------------------------------
// result(): must match the exact shape tool-page.js expects to render a
// result (value/label/details/download/preview). A real bug found via user
// testing: this used to return { blob, filename, message } instead, which
// tool-page.js's `output.download?.blob` check silently failed for -- the
// tool actually worked (no processing error), but nothing ever appeared on
// screen, since the result-rendering code specifically reads
// `output.download.blob`/`output.download.filename`/`output.preview`, none
// of which existed on the old shape.
// ---------------------------------------------------------------------------

{
    const fakeBlob = { size: 45000 };
    const output = result(fakeBlob, 'test-bg-added.jpg', 800, 600, 'en', { ar: 'جاهز', en: 'Ready' });
    assert.equal(output.value, '800 × 600', 'value must be the image dimensions, as every other image tool on this site reports it');
    assert.equal(output.label, 'Ready', 'label must resolve to the requested language');
    assert.equal(output.details, '43.9 KB', 'details must be the human-readable file size');
    assert.ok(output.download, 'result must include a download object -- tool-page.js reads output.download.blob/.filename to show the download button');
    assert.equal(output.download.blob, fakeBlob);
    assert.equal(output.download.filename, 'test-bg-added.jpg');
    assert.equal(output.preview, fakeBlob, 'result must include a preview -- tool-page.js reads output.preview to show the image preview');
}

// ---------------------------------------------------------------------------
// safeHexColor: never lets an invalid/malicious value reach canvas fillStyle
// ---------------------------------------------------------------------------

assert.equal(safeHexColor('#ffffff', '#000000'), '#ffffff', 'a valid hex color must pass through unchanged');
assert.equal(safeHexColor('#FF00aa', '#000000'), '#FF00aa', 'mixed-case hex digits must be accepted');
assert.equal(safeHexColor('javascript:alert(1)', '#000000'), '#000000', 'a non-hex value must fall back to the default, not reach fillStyle');
assert.equal(safeHexColor('red', '#000000'), '#000000', 'a CSS color keyword (not this function\'s accepted format) must fall back to the default');
assert.equal(safeHexColor('', '#000000'), '#000000', 'an empty value must fall back to the default');
assert.equal(safeHexColor(undefined, '#000000'), '#000000', 'an undefined value must fall back to the default, not throw');
assert.equal(safeHexColor('  #ffffff  ', '#000000'), '#ffffff', 'surrounding whitespace must be trimmed');

// ---------------------------------------------------------------------------
// Product registration
// ---------------------------------------------------------------------------

for (const id of ['add-solid-background', 'add-gradient-background', 'add-image-background']) {
    const tool = getToolDefinition(id);
    assert.ok(tool, `${id} must be registered in tool-definitions.js`);
    assert.equal(tool.category, 'image');
    assert.ok(tool.title.ar && tool.title.en, `${id} must have both Arabic and English titles`);
    assert.ok(tool.description.ar && tool.description.en, `${id} must have both Arabic and English descriptions`);
    assert.ok(typeof tool.process === 'function', `${id} must have a process() handler`);
    assert.ok(tool.inputs.some((input) => input.type === 'file'), `${id} must accept at least one file input`);
}

// Real user feedback: the foreground image input was too narrowly
// restricted (PNG/WebP only). Widened to also accept GIF and AVIF, both of
// which genuinely support transparency (unlike JPEG/BMP, deliberately still
// excluded -- accepting a format with no alpha channel here would silently
// produce a misleading "background added" result with no actual
// transparency to composite through).
for (const id of ['add-solid-background', 'add-gradient-background', 'add-image-background']) {
    const tool = getToolDefinition(id);
    const imageInput = tool.inputs.find((input) => input.id === 'image');
    const acceptedTypes = imageInput.accept.split(',');
    for (const mimeType of ['image/png', 'image/webp', 'image/gif', 'image/avif']) {
        assert.ok(acceptedTypes.includes(mimeType), `${id}'s foreground image input must accept ${mimeType} (supports transparency)`);
    }
    assert.ok(!acceptedTypes.includes('image/jpeg'), `${id}'s foreground image input must NOT accept JPEG (no alpha channel, would silently produce a misleading result)`);
}

// The gradient tool specifically needs a direction selector with the 3 documented options.
{
    const gradientTool = getToolDefinition('add-gradient-background');
    const directionInput = gradientTool.inputs.find((input) => input.id === 'direction');
    assert.ok(directionInput, 'add-gradient-background must have a direction input');
    const values = directionInput.options.map((option) => option.value);
    assert.deepEqual(values.sort(), ['diagonal', 'horizontal', 'vertical'].sort());
}

// The image-background tool specifically needs two distinct file inputs (foreground + background image).
{
    const imageTool = getToolDefinition('add-image-background');
    const fileInputs = imageTool.inputs.filter((input) => input.type === 'file');
    assert.equal(fileInputs.length, 2, 'add-image-background must accept two separate image files');
    assert.deepEqual(fileInputs.map((input) => input.id).sort(), ['backgroundImage', 'image']);
}

console.log('Add Background tools: result-shape (the real bug found via user testing), hex-color safety, accepted-format, and product-registration checks passed.');

// END OF FILE
