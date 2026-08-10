/**
 * Smart Search 2.0 — browser-only ranked matching for Adawaty catalogue.
 * Extends plain substring search: tokenizes queries, expands common intents,
 * normalizes Arabic, and scores title / id / description / optional metadata.
 * No external libraries. Safe to call on every input event for ~600 tools.
 */

/** Intent / synonym tokens → extra match tokens (English + Arabic). */
const INTENT_SYNONYMS = Object.freeze({
    convert: Object.freeze(['converter', 'conversion', 'to', 'from', 'تحويل', 'محول', 'صيغة']),
    compress: Object.freeze(['compressor', 'compression', 'shrink', 'reduce', 'size', 'ضغط', 'تصغير', 'حجم']),
    merge: Object.freeze(['combine', 'join', 'دمج', 'جمع']),
    split: Object.freeze(['divide', 'extract pages', 'تقسيم', 'فصل']),
    protect: Object.freeze(['password', 'encrypt', 'lock', 'secure', 'حماية', 'كلمة مرور', 'تشفير']),
    unlock: Object.freeze(['decrypt', 'remove password', 'فتح', 'إزالة كلمة']),
    edit: Object.freeze(['editor', 'modify', 'تعديل', 'تحرير']),
    resize: Object.freeze(['scale', 'dimensions', 'تغيير حجم', 'أبعاد']),
    crop: Object.freeze(['cut', 'trim', 'قص']),
    rotate: Object.freeze(['turn', 'flip', 'تدوير']),
    ocr: Object.freeze(['scan', 'text from image', 'image to text', 'استخراج نص', 'مسح']),
    pdf: Object.freeze(['adobe', 'مستند', 'ملف pdf']),
    image: Object.freeze(['photo', 'picture', 'jpg', 'jpeg', 'png', 'webp', 'صورة', 'صور']),
    video: Object.freeze(['movie', 'mp4', 'فيديو']),
    audio: Object.freeze(['sound', 'mp3', 'music', 'صوت', 'موسيقى']),
    excel: Object.freeze(['xlsx', 'spreadsheet', 'جدول', 'إكسل']),
    word: Object.freeze(['docx', 'document', 'وورد', 'مستند']),
    json: Object.freeze(['api', 'data']),
    ssl: Object.freeze(['certificate', 'https', 'tls', 'شهادة']),
    network: Object.freeze(['ip', 'dns', 'subnet', 'شبكة']),
    seo: Object.freeze(['meta', 'sitemap', 'canonical', 'تحسين']),
    invoice: Object.freeze(['bill', 'فاتورة']),
    youtube: Object.freeze(['yt', 'thumbnail', 'يوتيوب']),
    qr: Object.freeze(['qrcode', 'barcode', 'بار كود', 'كيو آر']),
    color: Object.freeze(['hex', 'rgb', 'hsl', 'palette', 'لون', 'ألوان']),
    password: Object.freeze(['passphrase', 'secret', 'كلمة السر', 'كلمة المرور']),
    hash: Object.freeze(['md5', 'sha', 'checksum']),
    base64: Object.freeze(['encode', 'decode', 'encoding']),
});

const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670]/g;
const TATWEEL = /\u0640/g;

function normalizeText(value) {
    return String(value ?? '')
        .toLowerCase()
        .replace(TATWEEL, '')
        .replace(ARABIC_DIACRITICS, '')
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenize(value) {
    const normalized = normalizeText(value);
    if (!normalized) return [];
    return normalized.split(' ').filter((token) => token.length > 0);
}

function expandQueryTokens(tokens) {
    const expanded = new Set(tokens);
    for (const token of tokens) {
        const synonyms = INTENT_SYNONYMS[token];
        if (synonyms) {
            for (const syn of synonyms) {
                for (const piece of tokenize(syn)) {
                    expanded.add(piece);
                }
            }
        }
        // Also match reverse: if user typed a synonym, include the intent key
        for (const [intent, list] of Object.entries(INTENT_SYNONYMS)) {
            const flat = list.flatMap((item) => tokenize(item));
            if (flat.includes(token) || tokenize(intent).includes(token)) {
                expanded.add(intent);
                for (const piece of flat) expanded.add(piece);
            }
        }
    }
    return [...expanded];
}

function fieldText(tool, categories) {
    const category = tool.category ?? '';
    const categoryLabel = categories?.[category];
    const optionalLists = [
        tool.keywords,
        tool.aliases,
        tool.commonSearches,
        tool.fileTypes,
        tool.recommendedFor,
    ];
    const optional = optionalLists
        .filter((list) => Array.isArray(list))
        .flat()
        .map(String);

    return Object.freeze({
        id: normalizeText(tool.id?.replaceAll('-', ' ') ?? ''),
        idRaw: normalizeText(tool.id ?? ''),
        title: normalizeText(`${tool.title?.ar ?? ''} ${tool.title?.en ?? ''}`),
        description: normalizeText(`${tool.description?.ar ?? ''} ${tool.description?.en ?? ''}`),
        category: normalizeText([
            category,
            categoryLabel?.ar ?? '',
            categoryLabel?.en ?? '',
        ].join(' ')),
        optional: normalizeText(optional.join(' ')),
    });
}

/**
 * Score how well a single query token matches a field string.
 * Higher is better.
 */
function tokenFieldScore(token, field) {
    if (!token || !field) return 0;
    if (field === token) return 12;
    if (field.startsWith(`${token} `) || field.endsWith(` ${token}`) || field.includes(` ${token} `)) {
        return 10;
    }
    if (field.startsWith(token)) return 8;
    if (token.length >= 3 && field.includes(token)) return 5;
    // light fuzzy: token is prefix of a word in field
    if (token.length >= 4) {
        for (const word of field.split(' ')) {
            if (word.startsWith(token)) return 6;
            if (token.length >= 5 && word.includes(token)) return 3;
        }
    }
    return 0;
}

/**
 * @param {object} tool definition
 * @param {string} query raw user query
 * @param {{ categories?: Record<string, {ar:string,en:string}> }} [options]
 * @returns {number} 0 = no match; higher = better
 */
function scoreToolMatch(tool, query, options = {}) {
    const raw = String(query ?? '').trim();
    if (!raw) return 1; // empty query matches everything equally

    const tokens = tokenize(raw);
    if (tokens.length === 0) return 1;

    const expanded = expandQueryTokens(tokens);
    const fields = fieldText(tool, options.categories);

    let score = 0;
    let matchedOriginalTokens = 0;

    for (const token of tokens) {
        const titleHit = tokenFieldScore(token, fields.title);
        const idHit = Math.max(
            tokenFieldScore(token, fields.id),
            tokenFieldScore(token, fields.idRaw),
        );
        const descHit = tokenFieldScore(token, fields.description);
        const catHit = tokenFieldScore(token, fields.category);
        const optHit = tokenFieldScore(token, fields.optional);

        const best = Math.max(
            titleHit * 4,
            idHit * 3,
            catHit * 2,
            optHit * 2,
            descHit,
        );

        if (best > 0) {
            matchedOriginalTokens += 1;
            score += best;
        }
    }

    // Expanded synonyms only add a small bonus (avoid flooding results)
    for (const token of expanded) {
        if (tokens.includes(token)) continue;
        const bonus = Math.max(
            tokenFieldScore(token, fields.title),
            tokenFieldScore(token, fields.id),
            tokenFieldScore(token, fields.idRaw),
            tokenFieldScore(token, fields.optional),
            tokenFieldScore(token, fields.category),
        );
        if (bonus > 0) score += Math.min(bonus, 6);
    }

    // Prefer tools that matched more of the user's actual words
    if (matchedOriginalTokens === 0 && score === 0) return 0;
    if (matchedOriginalTokens === 0) {
        // synonym-only hit: keep but rank low
        return Math.min(score, 8);
    }

    score += matchedOriginalTokens * 15;
    if (matchedOriginalTokens === tokens.length) score += 20;

    return score;
}

/**
 * Filter and sort tools by smart search score (desc), stable for ties via tieBreaker.
 * @param {object[]} tools
 * @param {string} query
 * @param {{ categories?: object, tieBreaker?: (a: object, b: object) => number }} [options]
 */
function rankTools(tools, query, options = {}) {
    const raw = String(query ?? '').trim();
    if (!raw) {
        return tools.slice();
    }

    const scored = [];
    for (const tool of tools) {
        const score = scoreToolMatch(tool, raw, options);
        if (score > 0) scored.push({ tool, score });
    }

    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (options.tieBreaker) return options.tieBreaker(a.tool, b.tool);
        return 0;
    });

    return scored.map((entry) => entry.tool);
}

export {
    expandQueryTokens,
    normalizeText,
    rankTools,
    scoreToolMatch,
    tokenize,
};

// END OF FILE
