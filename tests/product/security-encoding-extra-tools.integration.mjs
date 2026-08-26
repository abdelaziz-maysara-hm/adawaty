import assert from 'node:assert/strict';

import { getToolDefinition } from '../../src/product/tool-definitions.js';
import { securityEncodingToolDefinitions } from '../../src/product/definitions/security-encoding-extra-tools.js';

/**
 * security-encoding-extra-tools.js: 10 security/crypto tools found
 * already built and registered while investigating the "Security &
 * Encoding" gap analysis in this session -- a real, direct duplicate
 * was caught in the process (this file's own `aes-encryption-tool`
 * vs. a newly, independently built `aes-encryption` with nearly
 * identical scope), and the newer duplicate was deleted in favor of
 * this pre-existing, more thoroughly-verified implementation (its own
 * code comments describe cross-checking the raw AES-256-GCM primitive
 * against Python's independent `cryptography` library byte-for-byte,
 * beyond just a round-trip check).
 *
 * This file had no dedicated test coverage at all before now, despite
 * containing real cryptographic logic (AES, HMAC, bcrypt, Base32,
 * PBKDF2, RSA) -- the same class of gap already found and closed
 * elsewhere in this project (grammar-checker sharing an untested
 * engine loader, currency-converter's Worker having no whitelist-
 * consistency check, etc). Closes that gap here.
 */

const EXPECTED_TOOL_IDS = [
    'hmac-generator', 'base32-encoder-decoder', 'crc32-calculator', 'otp-generator',
    'pin-generator', 'aes-encryption-tool', 'bcrypt-generator', 'pbkdf2-generator',
    'rsa-key-generator', 'aes-key-generator',
];

// ---------------------------------------------------------------------------
// Product registration: all 10 tools
// ---------------------------------------------------------------------------

for (const id of EXPECTED_TOOL_IDS) {
    const tool = getToolDefinition(id);
    assert.ok(tool, `${id} must be registered in tool-definitions.js`);
    assert.equal(tool.category, 'security-network');
    assert.ok(tool.title.ar && tool.title.en, `${id} must have both Arabic and English titles`);
    assert.ok(typeof tool.calculate === 'function', `${id} must have a calculate() handler`);
    assert.ok(securityEncodingToolDefinitions[id], `${id} must be exported from securityEncodingToolDefinitions`);
}

// The old, wrong ID from the tool this file's aes-encryption-tool
// replaced during this session must not exist -- a real duplicate
// registration bug this test would have caught immediately.
assert.equal(getToolDefinition('aes-encryption'), null, 'the duplicate aes-encryption tool (deleted in favor of aes-encryption-tool) must not be registered');

// ---------------------------------------------------------------------------
// Base32 (RFC 4648): verified directly against known test vectors,
// not just that encode/decode round-trip against each other (which
// would pass even if both were consistently wrong in the same way)
// ---------------------------------------------------------------------------

{
    const source = await (await import('node:fs/promises')).readFile(
        new URL('../../src/product/definitions/security-encoding-extra-tools.js', import.meta.url),
        'utf8',
    );
    const moduleWithExports = source.replace(
        'export { securityEncodingToolDefinitions };',
        'export { securityEncodingToolDefinitions, base32Encode, base32Decode, aesEncryptText, aesDecryptText, computeHmac };',
    );
    const tempModuleUrl = `data:text/javascript,${encodeURIComponent(moduleWithExports)}`;
    const {
        base32Encode, base32Decode, aesEncryptText, aesDecryptText, computeHmac,
    } = await import(tempModuleUrl);

    // RFC 4648 official test vectors.
    const vectors = [
        ['', ''],
        ['f', 'MY======'],
        ['fo', 'MZXQ===='],
        ['foo', 'MZXW6==='],
        ['foob', 'MZXW6YQ='],
        ['fooba', 'MZXW6YTB'],
        ['foobar', 'MZXW6YTBOI======'],
    ];
    for (const [input, expected] of vectors) {
        const encoded = base32Encode(new TextEncoder().encode(input));
        assert.equal(encoded, expected, `base32Encode(${JSON.stringify(input)}) must match the official RFC 4648 test vector`);
        const decoded = new TextDecoder().decode(base32Decode(encoded));
        assert.equal(decoded, input, `base32Decode must correctly reverse the encoding for ${JSON.stringify(input)}`);
    }

    // ---------------------------------------------------------------------------
    // AES-256-GCM: real cryptographic correctness
    // ---------------------------------------------------------------------------

    const originalText = 'A secret message with نص عربي and 🔐 emoji.';
    const password = 'a-strong-password-123!';
    const encrypted = await aesEncryptText(originalText, password);
    const decrypted = await aesDecryptText(encrypted, password);
    assert.equal(decrypted, originalText, 'AES round-trip with the correct password must return the exact original text, including non-Latin script and emoji');

    await assert.rejects(aesDecryptText(encrypted, 'wrong-password'), 'decrypting with the wrong password must throw, not silently return garbled text');

    const encryptedAgain = await aesEncryptText(originalText, password);
    assert.notEqual(encrypted, encryptedAgain, 'encrypting identical text with the identical password twice must produce different ciphertext (genuine per-call salt/IV randomization)');

    // ---------------------------------------------------------------------------
    // HMAC: verified against a known HMAC-SHA256 test vector (RFC 4231 test case 1)
    // ---------------------------------------------------------------------------

    const hmacResult = await computeHmac(
        'Hi There',
        String.fromCharCode(...new Array(20).fill(0x0b)),
        'SHA-256',
    );
    assert.equal(
        hmacResult,
        'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7',
        'computeHmac must match the official RFC 4231 HMAC-SHA256 test case 1 vector',
    );
}

console.log('Security & Encoding tools (10 tools, pre-existing but previously untested): product registration, Base32 RFC 4648 vectors, AES-256-GCM correctness, and HMAC-SHA256 RFC 4231 vector all verified.');

// END OF FILE
