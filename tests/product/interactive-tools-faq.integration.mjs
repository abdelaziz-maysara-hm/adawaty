import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { listToolDefinitions } from '../../src/product/tool-definitions.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '../..');

/**
 * A real gap found via a direct user question ("did you set up SEO for
 * the new tools too?"): every generator-produced tool page got FAQ
 * content and FAQPage schema in 0.5.113, but the 3 interactive tools
 * added afterward (website-builder, photo-editor, mic-test) are
 * manually-authored pages that don't go through that generator at all,
 * so they'd silently missed this every time a new interactive tool
 * shipped. Fixed by hand-adding matching FAQ content to all 3 existing
 * ones; this test exists so a *future* interactive tool can't ship the
 * same gap silently again.
 */
const interactiveTools = listToolDefinitions().filter((tool) => tool.interactive === true);

assert.ok(interactiveTools.length > 0, 'expected at least one interactive tool to exist and be checked here');

for (const tool of interactiveTools) {
    const pagePath = path.join(projectRoot, 'tools', tool.id, 'index.html');
    // eslint-disable-next-line no-await-in-loop -- a handful of small file reads, sequential is fine and keeps failures attributable to one tool at a time
    const html = await readFile(pagePath, 'utf8');

    assert.ok(html.includes('product-faq'), `${tool.id}: interactive tool pages must include visible FAQ content, the same as every generator-produced tool page`);
    assert.ok(html.includes('"@type":"FAQPage"'), `${tool.id}: interactive tool pages must include FAQPage structured data`);
    assert.ok(html.includes('faq-item'), `${tool.id}: expected at least one FAQ item using the shared .faq-item styling`);

    const faqPageMatch = html.match(/"@type":"FAQPage","mainEntity":(\[.*?\])\}<\/script>/);
    assert.ok(faqPageMatch, `${tool.id}: FAQPage JSON-LD must be present and parseable`);
    const questions = JSON.parse(faqPageMatch[1]);
    assert.ok(questions.length >= 2, `${tool.id}: expected at least 2 real FAQ questions, found ${questions.length}`);
    for (const question of questions) {
        assert.ok(question.name && question.name.length > 5, `${tool.id}: a FAQ question must have real question text`);
        assert.ok(question.acceptedAnswer?.text && question.acceptedAnswer.text.length > 5, `${tool.id}: a FAQ question must have a real answer`);
    }
}

console.log(`Interactive-tool FAQ coverage verified for ${interactiveTools.length} tool(s): ${interactiveTools.map((tool) => tool.id).join(', ')}.`);

// END OF FILE
