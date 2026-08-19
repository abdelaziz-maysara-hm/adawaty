import assert from 'node:assert/strict';

import { getToolDefinition } from '../../src/product/tool-definitions.js';
import { safeHexColor } from '../../src/product/definitions/add-background-tools.js';

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

console.log('Add Background tools: hex-color safety and product-registration checks passed.');

// END OF FILE
