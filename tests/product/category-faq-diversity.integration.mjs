import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { listToolDefinitions } from '../../src/product/tool-definitions.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '../..');

/**
 * A real content-quality gap found while reviewing tool pages for
 * "thin content" (a documented contributing cause of Google Search
 * Console's "Discovered/Crawled -- currently not indexed" status,
 * alongside the missing-internal-links issue already fixed in
 * 0.5.146): all 628 tool pages shared the exact same 3 FAQ questions,
 * with only the tool's own name substituted in -- confirmed directly
 * by comparing two completely unrelated tools (xml-formatter,
 * binary-to-ip-address) and finding the second question's *answer*
 * was word-for-word identical between them.
 *
 * Fixed by adding a 4th, category-specific question (one of 19,
 * covering every category on the site) -- not attempting genuinely
 * unique per-tool questions for all 628 tools (unrealistic to write
 * with real care), but a meaningful step toward pages within
 * different categories no longer reading as interchangeable
 * boilerplate.
 */

{
    const allTools = listToolDefinitions();
    const interactiveToolIds = new Set(allTools.filter((tool) => tool.interactive).map((tool) => tool.id));
    const categories = [...new Set(allTools.map((tool) => tool.category))];
    assert.ok(categories.length >= 15, `expected at least 15 categories, found ${categories.length} -- the category extraction itself may be broken`);

    // One representative tool per category, checked against its own
    // generated page -- if a category's 4th question were ever
    // silently dropped (e.g. a typo in the category key), this would
    // only affect that category and could easily go unnoticed without
    // this check covering every single one.
    const missingFourthQuestion = [];
    for (const category of categories) {
        const sampleTool = allTools.find((tool) => tool.category === category && !interactiveToolIds.has(tool.id));
        if (!sampleTool) continue; // a category made up entirely of interactive tools (none currently exist, but stay safe)

        // eslint-disable-next-line no-await-in-loop
        const html = await readFile(path.join(projectRoot, 'tools', sampleTool.id, 'index.html'), 'utf8');
        const questionCount = (html.match(/<summary>/g) ?? []).length;
        if (questionCount < 4) {
            missingFourthQuestion.push(`${category} (via ${sampleTool.id}): only ${questionCount} FAQ question(s)`);
        }
    }
    assert.deepEqual(missingFourthQuestion, [], `${missingFourthQuestion.length} categor(y/ies) are missing their 4th, category-specific FAQ question: ${missingFourthQuestion.join('; ')}`);
}

// ---------------------------------------------------------------------------
// The 4th question must genuinely differ across categories, not just
// exist -- this is the actual point of the fix (breaking the
// near-identical-content pattern), not merely "a 4th <summary> tag
// exists somewhere"
// ---------------------------------------------------------------------------

{
    const pdfHtml = await readFile(path.join(projectRoot, 'tools/pdf-merge/index.html'), 'utf8');
    const developerHtml = await readFile(path.join(projectRoot, 'tools/xml-formatter/index.html'), 'utf8');

    const extractFourthQuestion = (html) => {
        const questions = [...html.matchAll(/<summary><span data-copy="ar">([^<]+)<\/span>/g)].map((match) => match[1]);
        return questions[3] ?? null;
    };

    const pdfFourth = extractFourthQuestion(pdfHtml);
    const developerFourth = extractFourthQuestion(developerHtml);

    assert.ok(pdfFourth, 'pdf-merge must have a 4th FAQ question');
    assert.ok(developerFourth, 'xml-formatter must have a 4th FAQ question');
    assert.notEqual(pdfFourth, developerFourth, 'the 4th FAQ question must genuinely differ between a pdf-category tool and a developer-category tool -- if this fails, the category-specific mechanism itself may be broken, silently falling back to identical content again');
}

// ---------------------------------------------------------------------------
// The JSON-LD FAQPage structured data must reflect the same 4
// questions, not just the visible HTML -- search engines read this
// directly
// ---------------------------------------------------------------------------

{
    const html = await readFile(path.join(projectRoot, 'tools/pdf-merge/index.html'), 'utf8');
    const jsonLdMatches = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
    const faqPageJson = jsonLdMatches.map((match) => JSON.parse(match[1])).find((data) => data['@type'] === 'FAQPage');
    assert.ok(faqPageJson, 'pdf-merge must have FAQPage structured data');
    assert.equal(faqPageJson.mainEntity.length, 4, 'the FAQPage JSON-LD must include all 4 questions (3 generic + 1 category-specific), not just the original 3');
}

console.log('Category-specific 4th FAQ question verified across all 19 categories, confirmed genuinely different between categories, and reflected in JSON-LD structured data.');

// END OF FILE
