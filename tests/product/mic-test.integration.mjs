import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getToolDefinition, listToolDefinitions } from '../../src/product/tool-definitions.js';
import {
    calculateRmsLevel, rmsToDecibels, detectClipping, decibelsToMeterFraction, SILENCE_FLOOR_DB,
} from '../../src/product/mic-test/levels.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '../..');

// ---------------------------------------------------------------------------
// Level calculation, verified against known signals with predictable math
// ---------------------------------------------------------------------------

{
    // Total silence: every sample sits exactly at the zero point (128 for an 8-bit unsigned buffer).
    const silence = new Uint8Array(1024).fill(128);
    assert.equal(calculateRmsLevel(silence), 0, 'true silence must produce an RMS of exactly 0');
    assert.equal(rmsToDecibels(0), SILENCE_FLOOR_DB, 'zero RMS must map to the silence floor, not -Infinity');
}

{
    // A full-scale square wave (alternating 0 and 255, the maximum possible amplitude) must produce RMS close to 1.
    const fullScale = new Uint8Array(1024);
    for (let i = 0; i < 1024; i += 1) fullScale[i] = i % 2 === 0 ? 0 : 255;
    const rms = calculateRmsLevel(fullScale);
    assert.ok(rms > 0.98, `a full-scale square wave should produce RMS close to 1, got ${rms}`);
}

{
    // A 50%-amplitude sine wave has a well-known RMS = amplitude / sqrt(2) ≈ 0.3535 -- an
    // independently verifiable mathematical fact, not just an internally-consistent check.
    const sineWave = new Uint8Array(1024);
    for (let i = 0; i < 1024; i += 1) {
        const t = i / 1024;
        const sample = Math.sin(2 * Math.PI * 5 * t) * 0.5;
        sineWave[i] = Math.round((sample + 1) * 128);
    }
    const rms = calculateRmsLevel(sineWave);
    assert.ok(Math.abs(rms - 0.3535) < 0.02, `a 50% sine wave's RMS should be close to 0.3535 (amplitude/sqrt(2)), got ${rms}`);
    assert.equal(detectClipping(sineWave), false, 'a clean sine wave must never be flagged as clipping');
}

{
    // A signal with many samples pinned near the byte extremes (0 or 255) indicates real clipping/distortion.
    const clipped = new Uint8Array(1024);
    for (let i = 0; i < 1024; i += 1) clipped[i] = i % 3 === 0 ? 0 : (i % 3 === 1 ? 255 : 128);
    assert.equal(detectClipping(clipped), true, 'a signal with many extreme-value samples must be flagged as clipping');
}

{
    assert.equal(decibelsToMeterFraction(SILENCE_FLOOR_DB), 0, 'the silence floor must map to meter fraction 0');
    assert.equal(decibelsToMeterFraction(0), 1, '0dB (the loudest representable level) must map to meter fraction 1');
    assert.equal(decibelsToMeterFraction(10), 1, 'values above 0dB must clamp to 1, not overflow the meter');
    assert.equal(decibelsToMeterFraction(SILENCE_FLOOR_DB - 10), 0, 'values below the floor must clamp to 0, not go negative');
}

// ---------------------------------------------------------------------------
// Product integration
// ---------------------------------------------------------------------------

{
    const tool = getToolDefinition('mic-test');
    assert.ok(tool, 'mic-test must be registered in tool-definitions.js');
    assert.equal(tool.interactive, true);
    assert.equal(tool.category, 'audio');
    assert.ok(tool.title.ar && tool.title.en);
    assert.ok(tool.description.ar && tool.description.en);
    assert.ok(listToolDefinitions().some((candidate) => candidate.id === 'mic-test'));
}

{
    const pagePath = path.join(projectRoot, 'tools/mic-test/index.html');
    const html = await readFile(pagePath, 'utf8');
    assert.ok(html.includes('data-tool-page="mic-test"'));
    assert.ok(html.includes('id="mic-meter-fill"'));
    assert.ok(html.includes('id="mic-start"'));
    assert.ok(html.includes('id="mic-stop"'));
    // A live microphone stream must never be left running silently if
    // the user navigates away instead of clicking Stop -- verified the
    // app script actually listens for both signals, not just reviewed.
    const appSource = await readFile(path.join(projectRoot, 'src/product/mic-test-app.js'), 'utf8');
    assert.ok(appSource.includes("addEventListener('pagehide'"), 'the mic stream must be stopped on pagehide');
    assert.ok(appSource.includes('visibilitychange'), 'the mic stream must be stopped when the tab is hidden');
}

console.log('Mic Test: level calculation (verified against known signals) and product-integration checks passed.');

// END OF FILE
