/**
 * Related-tools ranking for Adawaty tool pages.
 * Used at generate time (and safe for browser use later).
 * Prefers explicit metadata when present; otherwise same category +
 * shared id/title tokens. No network, no extra dependencies.
 */

const STOP_TOKENS = new Set([
    'a', 'an', 'the', 'and', 'or', 'to', 'of', 'for', 'in', 'on', 'with',
    'from', 'into', 'your', 'you', 'tool', 'tools', 'file', 'files',
    'free', 'online', 'ال', 'في', 'من', 'على', 'إلى', 'عن', 'مع', 'او', 'أو',
    'أداة', 'اداة', 'أدوات', 'ادوات', 'ملف', 'ملفات',
]);

function tokensFrom(value) {
    return String(value ?? '')
        .toLowerCase()
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .split(' ')
        .map((part) => part.trim())
        .filter((part) => part.length >= 2 && !STOP_TOKENS.has(part));
}

function idTokens(id) {
    return String(id ?? '')
        .toLowerCase()
        .split('-')
        .filter((part) => part.length >= 2 && !STOP_TOKENS.has(part));
}

function uniqueIds(ids) {
    const seen = new Set();
    const result = [];
    for (const id of ids) {
        if (!id || seen.has(id)) continue;
        seen.add(id);
        result.push(id);
    }
    return result;
}

function listFromTool(tool, key) {
    const value = tool?.[key];
    if (!Array.isArray(value)) return [];
    return value.map(String).filter(Boolean);
}

/**
 * Score how related `candidate` is to `tool`. Higher is better.
 */
function relatedScore(tool, candidate) {
    if (!tool || !candidate || tool.id === candidate.id) return 0;

    let score = 0;
    const explicitRelated = new Set([
        ...listFromTool(tool, 'relatedTools'),
        ...listFromTool(tool, 'alternativeTools'),
        ...listFromTool(tool, 'nextTools'),
        ...listFromTool(tool, 'previousTools'),
    ]);

    if (explicitRelated.has(candidate.id)) score += 100;

    if (tool.category && candidate.category === tool.category) score += 25;

    const toolIdParts = new Set(idTokens(tool.id));
    const candIdParts = idTokens(candidate.id);
    let sharedId = 0;
    for (const part of candIdParts) {
        if (toolIdParts.has(part)) sharedId += 1;
    }
    score += sharedId * 18;

    const toolWords = new Set([
        ...tokensFrom(tool.title?.en),
        ...tokensFrom(tool.title?.ar),
        ...idTokens(tool.id),
    ]);
    const candWords = [
        ...tokensFrom(candidate.title?.en),
        ...tokensFrom(candidate.title?.ar),
        ...idTokens(candidate.id),
    ];
    let sharedWords = 0;
    for (const word of candWords) {
        if (toolWords.has(word)) sharedWords += 1;
    }
    score += sharedWords * 8;

    // Same processing family (both have process vs both calculate)
    const toolIsProcess = typeof tool.process === 'function' || tool.interactive === true;
    const candIsProcess = typeof candidate.process === 'function' || candidate.interactive === true;
    if (toolIsProcess === candIsProcess) score += 4;

    return score;
}

/**
 * @param {object} tool current tool definition
 * @param {object[]} allTools full catalogue definitions
 * @param {number} [limit=6]
 * @returns {object[]} related tool definitions, best first
 */
function pickRelatedTools(tool, allTools, limit = 6) {
    if (!tool || !Array.isArray(allTools) || limit <= 0) return [];

    const byId = new Map(allTools.map((item) => [item.id, item]));

    // Explicit next / previous / related first (stable product intent)
    const explicitOrder = uniqueIds([
        ...listFromTool(tool, 'nextTools'),
        ...listFromTool(tool, 'relatedTools'),
        ...listFromTool(tool, 'alternativeTools'),
        ...listFromTool(tool, 'previousTools'),
    ]);

    const picked = [];
    const pickedIds = new Set();

    for (const id of explicitOrder) {
        if (id === tool.id || pickedIds.has(id)) continue;
        const match = byId.get(id);
        if (!match) continue;
        picked.push(match);
        pickedIds.add(id);
        if (picked.length >= limit) return picked;
    }

    const scored = [];
    for (const candidate of allTools) {
        if (candidate.id === tool.id || pickedIds.has(candidate.id)) continue;
        const score = relatedScore(tool, candidate);
        if (score <= 0) continue;
        scored.push({ candidate, score });
    }

    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return String(a.candidate.id).localeCompare(String(b.candidate.id));
    });

    for (const entry of scored) {
        picked.push(entry.candidate);
        if (picked.length >= limit) break;
    }

    return picked;
}

export {
    pickRelatedTools,
    relatedScore,
};

// END OF FILE
