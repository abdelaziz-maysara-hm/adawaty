import assert from 'node:assert/strict';

import { getToolDefinition } from '../../src/product/tool-definitions.js';
import { deriveKey, encryptText, decryptText } from '../../src/product/definitions/aes-encryption-tool.js';

/**
 * aes-encryption: added after competitor research confirmed genuine
 * demand for AES encrypt/decrypt tools (kordu.tools, geekformat.com,
 * anycript.com, devglan.com, and others all offer one). Uses the same
 * self-contained "salt + IV + ciphertext, Base64-encoded together"
 * format found across that research, so users only need to remember
 * their password.
 *
 * Design choices, each deliberate:
 * - AES-256-GCM (authenticated encryption -- detects tampering),
 *   not AES-ECB (leaks plaintext patterns) or plain CBC (no integrity
 *   check), matching every competitor's stated recommendation.
 * - PBKDF2 with 200,000 iterations (OWASP's current minimum
 *   recommendation for PBKDF2-HMAC-SHA256), not a raw password used
 *   directly as a key.
 * - A random salt and IV generated fresh on every single encryption
 *   call, verified directly below to confirm the same input produces
 *   different ciphertext each time -- not just documented as a design
 *   intent.
 */

{
    const tool = getToolDefinition('aes-encryption');
    assert.ok(tool, 'aes-encryption must be registered in tool-definitions.js');
    assert.equal(tool.category, 'security-network', 'must use the same category as the site\'s other security tools (password-generator, pbkdf2-generator), not an invented one');
    assert.ok(tool.title.ar && tool.title.en);
    assert.ok(tool.description.ar && tool.description.en);
    assert.ok(typeof tool.process === 'function');
}

// ---------------------------------------------------------------------------
// Real cryptographic correctness, not just that the functions run
// without throwing
// ---------------------------------------------------------------------------

{
    const original = 'This is a secret message! نص عربي كمان للتأكد من دعم UTF-8. 🔐';
    const password = 'MySecurePassword123!';

    const encrypted = await encryptText(original, password);
    const decrypted = await decryptText(encrypted, password);
    assert.equal(decrypted, original, 'encrypting then decrypting with the correct password must return the exact original text, including non-Latin script and emoji (UTF-8 correctness)');
}

{
    const password = 'MySecurePassword123!';
    const encrypted = await encryptText('secret', password);
    await assert.rejects(
        decryptText(encrypted, 'WrongPassword'),
        /DECRYPTION_FAILED/,
        'decrypting with the wrong password must fail cleanly (AES-GCM\'s built-in authentication tag catching this), never silently return garbled plaintext',
    );
}

{
    // The single most important cryptographic property to verify
    // directly rather than assume: encrypting the identical text with
    // the identical password twice must produce DIFFERENT ciphertext
    // each time, proving the salt/IV are genuinely randomized per call
    // and not accidentally fixed/reused (which would be a severe,
    // silent security bug -- reused IVs under GCM catastrophically
    // break its confidentiality guarantees).
    const password = 'MySecurePassword123!';
    const text = 'identical input';
    const first = await encryptText(text, password);
    const second = await encryptText(text, password);
    assert.notEqual(first, second, 'encrypting the same text with the same password twice must produce different ciphertext each time (random salt/IV per call) -- a reused IV under AES-GCM is a severe security flaw, not a cosmetic one');
    // Both must still independently decrypt back to the original.
    assert.equal(await decryptText(first, password), text);
    assert.equal(await decryptText(second, password), text);
}

{
    const password = 'MySecurePassword123!';
    await assert.rejects(
        decryptText('not-valid-base64-ciphertext!!!', password),
        /INVALID_BASE64/,
        'malformed/non-Base64 input to decrypt must fail cleanly with a specific, identifiable error, not crash unpredictably',
    );
}

{
    // Edge case: an empty string must still round-trip correctly.
    const password = 'MySecurePassword123!';
    const encrypted = await encryptText('', password);
    const decrypted = await decryptText(encrypted, password);
    assert.equal(decrypted, '', 'an empty string must encrypt and decrypt back to an empty string, not throw or produce unexpected output');
}

{
    // deriveKey itself must be deterministic for a given password+salt
    // (PBKDF2 is deterministic by definition) -- if this were ever
    // broken, decrypt would never work at all, so this pins down the
    // specific building block rather than only testing the outcome.
    // Verified indirectly, via an actual encryption with a fixed IV,
    // rather than exporting the derived key directly: the key is
    // intentionally created non-extractable (a correct security
    // choice already in the tool's own code, not something to weaken
    // just to make this test simpler).
    const password = 'test-password';
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    const fixedIv = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const plaintext = new TextEncoder().encode('determinism check');

    const key1 = await deriveKey(password, salt);
    const key2 = await deriveKey(password, salt);
    const ciphertext1 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: fixedIv }, key1, plaintext);
    const ciphertext2 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: fixedIv }, key2, plaintext);
    assert.deepEqual(
        new Uint8Array(ciphertext1),
        new Uint8Array(ciphertext2),
        'deriveKey must be deterministic: the same password and salt (and, held fixed here, the same IV) must always produce identical ciphertext, or decryption could never work',
    );
}

console.log('AES Encryption: product-registration and real cryptographic correctness (round-trip, wrong-password rejection, genuine per-call randomness, malformed-input handling, key-derivation determinism) verified.');

// END OF FILE
