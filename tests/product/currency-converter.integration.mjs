import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '../..');

/**
 * currency-converter: added after research into genuinely high-search-
 * volume tool categories missing from this site (alongside XE, OANDA,
 * and dozens of "currency converter" competitors). Uses live rates
 * from open.er-api.com (ExchangeRate-API's free, no-key public
 * endpoint, running since 2010) -- but NOT called directly from the
 * browser. Independent sources disagreed on whether that upstream
 * sends CORS headers at all (one live-monitoring source specifically
 * reported "CORS: Disabled"), and this couldn't be verified directly
 * here (no real browser, and the sandbox's own network egress
 * allowlist blocks the domain). Proxied instead through the Adawaty
 * Cloud Worker, where the server-to-server fetch has no CORS
 * restriction at all -- removing the ambiguity rather than gambling
 * on it, the same caution already applied elsewhere in this project
 * when a library's real-browser behavior couldn't be directly
 * verified.
 */

const { currencyConverterToolDefinitions } = await import('../../src/product/definitions/currency-converter-tool.js');
const { getToolDefinition } = await import('../../src/product/tool-definitions.js');

// ---------------------------------------------------------------------------
// Product registration
// ---------------------------------------------------------------------------

{
    const tool = getToolDefinition('currency-converter');
    assert.ok(tool, 'currency-converter must be registered in tool-definitions.js');
    assert.equal(tool.category, 'converter');
    assert.ok(tool.title.ar && tool.title.en);
    assert.ok(tool.description.ar && tool.description.en);
    assert.ok(typeof tool.process === 'function');
    assert.ok(currencyConverterToolDefinitions['currency-converter']);
}

// ---------------------------------------------------------------------------
// convertAmount(): the pure conversion math, verified directly with
// realistic exchange rates (no network call needed for this part).
// ---------------------------------------------------------------------------

{
    const source = await readFile(path.join(projectRoot, 'src/product/definitions/currency-converter-tool.js'), 'utf8');
    // convertAmount isn't exported by default (only the tool
    // definitions are, matching this codebase's usual pattern) --
    // re-evaluate it here from source the same way other pure-function
    // tests in this suite do, rather than modifying the shipped file's
    // exports just for testing.
    const moduleWithExport = source.replace(
        'export { currencyConverterToolDefinitions };',
        'export { currencyConverterToolDefinitions, convertAmount };',
    );
    const tempModuleUrl = `data:text/javascript,${encodeURIComponent(moduleWithExport)}`;
    const { convertAmount } = await import(tempModuleUrl);

    const rates = { EGP: 48.5, EUR: 0.92, USD: 1 };
    assert.equal(convertAmount(100, 'USD', 'EGP', rates), 4850, '100 USD at 48.5 EGP/USD must convert to exactly 4850 EGP');
    assert.ok(Math.abs(convertAmount(100, 'EGP', 'USD', rates) - 2.0619) < 0.001, '100 EGP must convert to approximately 2.06 USD');
    assert.equal(convertAmount(100, 'USD', 'USD', rates), 100, 'converting a currency to itself must return the same amount unchanged');
    assert.ok(Math.abs(convertAmount(100, 'EGP', 'EUR', rates) - 1.8969) < 0.001, 'a non-USD-to-non-USD conversion must correctly route through USD as the intermediate');
    assert.equal(convertAmount(100, 'XXX', 'USD', rates), null, 'an unsupported currency code must return null, not throw or silently produce a wrong number');
}

// ---------------------------------------------------------------------------
// The Cloudflare Worker proxy this tool depends on
// ---------------------------------------------------------------------------

{
    const workerSource = await readFile(path.join(projectRoot, 'cloudflare-worker/src/index.js'), 'utf8');
    assert.match(workerSource, /\/api\/currency-rates/, 'the Worker must expose a /api/currency-rates route');
    assert.match(workerSource, /open\.er-api\.com/, 'the Worker must proxy to open.er-api.com server-to-server');
    assert.match(workerSource, /SUPPORTED_CURRENCY_CODES/, 'the Worker must whitelist currency codes rather than proxying arbitrary upstream requests');
    assert.match(workerSource, /caches\.default/, 'the Worker must use edge caching, since this data updates roughly daily upstream');

    // The Worker's currency whitelist must exactly match the tool's own
    // currency list -- a real bug class if they ever drift apart: the
    // tool would offer a currency in its dropdown that the Worker then
    // rejects with a 400, or vice versa.
    const toolSource = await readFile(path.join(projectRoot, 'src/product/definitions/currency-converter-tool.js'), 'utf8');
    const workerCodesMatch = workerSource.match(/SUPPORTED_CURRENCY_CODES = new Set\(\[([\s\S]*?)\]\)/);
    const toolCodesMatches = [...toolSource.matchAll(/code: '([A-Z]{3})'/g)];
    assert.ok(workerCodesMatch, 'could not locate SUPPORTED_CURRENCY_CODES in the Worker source');
    const workerCodes = new Set([...workerCodesMatch[1].matchAll(/'([A-Z]{3})'/g)].map((m) => m[1]));
    const toolCodes = new Set(toolCodesMatches.map((m) => m[1]));
    assert.deepEqual(
        [...workerCodes].sort(),
        [...toolCodes].sort(),
        'the Worker\'s currency whitelist must exactly match the tool\'s own CURRENCIES list',
    );
}

console.log('Currency Converter: product-registration, conversion-math, and Worker-proxy consistency checks passed.');

// END OF FILE
