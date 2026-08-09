import assert from 'node:assert/strict';

import {
    buildCsp,
    createSriHash,
    parsePwnedRange,
} from '../../src/product/definitions/popular-security-tools.js';

assert.equal(parsePwnedRange('ABCDEF:12\r\n123456:7', 'abcdef'), 12);
assert.equal(parsePwnedRange('ABCDEF:12', '000000'), 0);

assert.equal(
    buildCsp({
        defaultSource: "'self'",
        scriptSource: "'self'",
        styleSource: "'self'",
        imageSource: "'self' data:",
        reportUri: '',
    }),
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
);

const sri = await createSriHash(new Blob(['hello']), 'SHA-384');
assert.match(sri, /^sha384-[A-Za-z0-9+/]+={0,2}$/);

console.log('Popular security tool contracts passed.');

// END OF FILE
