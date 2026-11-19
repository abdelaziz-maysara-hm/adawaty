// PDF → Word (.docx), entirely in the browser.
// Reads the PDF with pdf.js (text with positions, fonts, vector lines, images) and
// rebuilds an editable Word document: paragraphs, headings, font sizes, bold/italic,
// bulleted and numbered lists, bordered tables, images, page breaks and right-to-left
// Arabic paragraphs. The file is never uploaded.

const PDF_JS_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs';
const PDF_JS_WORKER_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
const JSZIP_URL = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';

const RTL_CHAR = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const RTL_CHARS = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/g;
const LTR_CHARS = /[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF]/g;
const BULLET_GLYPHS = '•●▪■◦○◆◇❖➢➤►✓✔–-*·\uF0B7\uF0A7\uF0D8\uF076\uF0FC\uF06E\uF0A8\uF0D7\uF0E8\uF02D';
const BULLET_RE = new RegExp(`^[${BULLET_GLYPHS.replace(/[-\\\]^]/g, '\\$&')}]\\s*`);
const NUMBER_RE = /^(\(?(?:\d{1,3}|[a-zA-Z]|[ivxlcdm]{1,6}|[\u0660-\u0669]{1,3})[.)\-]|\(\d{1,3}\))\s*/;

let pdfJsPromise;
let workerPromise;

async function loadPdfJs() {
    pdfJsPromise ??= import(PDF_JS_URL).then((module) => {
        if (!module.GlobalWorkerOptions.workerSrc) module.GlobalWorkerOptions.workerSrc = PDF_JS_WORKER_URL;
        return module;
    }).catch((error) => { pdfJsPromise = undefined; throw error; });
    return pdfJsPromise;
}

// pdf.js reverses right-to-left text character by character. A glyph that maps to
// several characters (the Arabic lam-alef ligature "لا") then comes out swapped ("ال").
// A worker with a one-line patch reverses those glyphs first, so the result reads correctly.
async function loadWorker(pdfjs) {
    workerPromise ??= (async () => {
        try {
            const source = await (await fetch(PDF_JS_WORKER_URL)).text();
            const target = /let text = textChunk\.str\.join\(""\);\s*if \(!disableNormalization\) \{\s*text = normalizeUnicode\(text\);\s*\}/;
            if (!target.test(source)) return null;
            const patched = source.replace(target, 'let text = textChunk.str.map((g) => { let s = disableNormalization || /[\\uFDFA\\uFDFB\\uFDFD]/.test(g) ? g : normalizeUnicode(g); if (s.length > 1 && /[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF]/.test(s) && !/[A-Za-z0-9]/.test(s)) s = Array.from(s).reverse().join(""); return s; }).join("");');
            const url = URL.createObjectURL(new Blob([patched], { type: 'text/javascript' }));
            return new pdfjs.PDFWorker({ port: new Worker(url, { type: 'module' }) });
        } catch {
            return null;
        }
    })();
    return workerPromise;
}

// ---------- XML helpers (never produce an invalid document) ----------
function cleanText(text) {
    return String(text)
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\uFFFE\uFFFF]/g, '')
        .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
        .replace(/[\uF000-\uF0FF]/g, '•');
}
function xml(text) {
    return cleanText(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---------- geometry ----------
function mul(m, n) {
    return [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
}
function apply(m, x, y) { return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; }

function fontInfo(page, fontName) {
    let name = '';
    try { name = page.commonObjs.get(fontName)?.name || ''; } catch { name = ''; }
    const clean = name.replace(/^[A-Z]{6}\+/, '');
    const bold = /bold|black|heavy|semibold|demi/i.test(clean);
    const italic = /italic|oblique/i.test(clean);
    let family = clean.split(/[-,]/)[0].replace(/(MT|PS|Std|Pro)$/,'');
    family = family.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
    const map = { Carlito: 'Calibri', Caladea: 'Cambria', 'DejaVu Sans': 'Arial', 'Liberation Serif': 'Times New Roman', 'Liberation Sans': 'Arial', 'Liberation Mono': 'Courier New', 'Times New Roman': 'Times New Roman', Arial: 'Arial', Helvetica: 'Arial', Times: 'Times New Roman', Courier: 'Courier New' };
    family = map[family] || family || '';
    const symbol = /symbol|wingding|dingbat/i.test(clean);
    return { bold, italic, family, symbol };
}

// Walk the operator list: vector line segments (for tables) and image placements.
function scanOperators(pdfjs, opList) {
    const { OPS } = pdfjs;
    let ctm = [1, 0, 0, 1, 0, 0];
    const stack = [];
    const segments = [];
    const images = [];
    let pending = [];
    for (let i = 0; i < opList.fnArray.length; i += 1) {
        const fn = opList.fnArray[i];
        const args = opList.argsArray[i];
        if (fn === OPS.save) stack.push(ctm);
        else if (fn === OPS.restore) ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
        else if (fn === OPS.transform) ctm = mul(ctm, args);
        else if (fn === OPS.constructPath) {
            const [ops, coords] = args;
            let c = 0; let cur = null; let start = null;
            for (const op of ops) {
                if (op === OPS.moveTo) { cur = apply(ctm, coords[c], coords[c + 1]); start = cur; c += 2; }
                else if (op === OPS.lineTo) { const p = apply(ctm, coords[c], coords[c + 1]); if (cur) pending.push([cur, p]); cur = p; c += 2; }
                else if (op === OPS.curveTo) { cur = apply(ctm, coords[c + 4], coords[c + 5]); c += 6; }
                else if (op === OPS.curveTo2 || op === OPS.curveTo3) { cur = apply(ctm, coords[c + 2], coords[c + 3]); c += 4; }
                else if (op === OPS.rectangle) {
                    const [x, y, w, h] = coords.slice(c, c + 4); c += 4;
                    const p = [apply(ctm, x, y), apply(ctm, x + w, y), apply(ctm, x + w, y + h), apply(ctm, x, y + h)];
                    pending.push({ rect: p });
                } else if (op === OPS.closePath) { if (cur && start) pending.push([cur, start]); cur = start; }
            }
        } else if (fn === OPS.stroke || fn === OPS.closeStroke || fn === OPS.fill || fn === OPS.eoFill || fn === OPS.fillStroke || fn === OPS.eoFillStroke || fn === OPS.closeFillStroke || fn === OPS.closeEOFillStroke) {
            const stroked = fn !== OPS.fill && fn !== OPS.eoFill;
            for (const s of pending) {
                if (Array.isArray(s)) { if (stroked) segments.push(s); continue; }
                const xs = s.rect.map((p) => p[0]); const ys = s.rect.map((p) => p[1]);
                const x1 = Math.min(...xs); const x2 = Math.max(...xs); const y1 = Math.min(...ys); const y2 = Math.max(...ys);
                if (stroked) { segments.push([[x1, y1], [x2, y1]], [[x1, y2], [x2, y2]], [[x1, y1], [x1, y2]], [[x2, y1], [x2, y2]]); }
                else if (y2 - y1 < 2.5 && x2 - x1 > 2) segments.push([[x1, (y1 + y2) / 2], [x2, (y1 + y2) / 2]]);
                else if (x2 - x1 < 2.5 && y2 - y1 > 2) segments.push([[(x1 + x2) / 2, y1], [(x1 + x2) / 2, y2]]);
            }
            pending = [];
        } else if (fn === OPS.endPath) {
            pending = [];
        } else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
            const corners = [apply(ctm, 0, 0), apply(ctm, 1, 0), apply(ctm, 0, 1), apply(ctm, 1, 1)];
            const xs = corners.map((p) => p[0]); const ys = corners.map((p) => p[1]);
            images.push({ id: fn === OPS.paintImageXObject ? args[0] : null, inline: fn === OPS.paintInlineImageXObject ? args[0] : null, x1: Math.min(...xs), x2: Math.max(...xs), y1: Math.min(...ys), y2: Math.max(...ys), flipX: ctm[0] < 0, flipY: ctm[3] > 0 });
        }
    }
    return { segments, images };
}

function detectTables(segments) {
    const H = []; const V = [];
    for (const [a, b] of segments) {
        if (Math.abs(a[1] - b[1]) < 1.2 && Math.abs(a[0] - b[0]) > 4) H.push({ y: (a[1] + b[1]) / 2, x1: Math.min(a[0], b[0]), x2: Math.max(a[0], b[0]) });
        else if (Math.abs(a[0] - b[0]) < 1.2 && Math.abs(a[1] - b[1]) > 4) V.push({ x: (a[0] + b[0]) / 2, y1: Math.min(a[1], b[1]), y2: Math.max(a[1], b[1]) });
    }
    if (H.length < 2 || V.length < 2) return [];
    const all = [...H.map((h) => ({ h })), ...V.map((v) => ({ v }))];
    const parent = all.map((_, i) => i);
    const find = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
    const tol = 2.5;
    for (let i = 0; i < all.length; i += 1) {
        for (let j = i + 1; j < all.length; j += 1) {
            const a = all[i]; const b = all[j];
            let touch = false;
            if (a.h && b.v) touch = b.v.x >= a.h.x1 - tol && b.v.x <= a.h.x2 + tol && a.h.y >= b.v.y1 - tol && a.h.y <= b.v.y2 + tol;
            else if (a.v && b.h) touch = a.v.x >= b.h.x1 - tol && a.v.x <= b.h.x2 + tol && b.h.y >= a.v.y1 - tol && b.h.y <= a.v.y2 + tol;
            else if (a.h && b.h) touch = Math.abs(a.h.y - b.h.y) < 1 && a.h.x1 <= b.h.x2 + tol && b.h.x1 <= a.h.x2 + tol;
            else touch = Math.abs(a.v.x - b.v.x) < 1 && a.v.y1 <= b.v.y2 + tol && b.v.y1 <= a.v.y2 + tol;
            if (touch) parent[find(i)] = find(j);
        }
    }
    const groups = new Map();
    all.forEach((s, i) => { const r = find(i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(s); });
    const cluster = (values) => {
        const sorted = [...values].sort((a, b) => a - b); const out = [];
        for (const v of sorted) { if (!out.length || v - out[out.length - 1] > 3) out.push(v); }
        return out;
    };
    const tables = [];
    for (const g of groups.values()) {
        const hs = g.filter((s) => s.h).map((s) => s.h); const vs = g.filter((s) => s.v).map((s) => s.v);
        const ys = cluster(hs.map((h) => h.y)); const xs = cluster(vs.map((v) => v.x));
        if (ys.length < 2 || xs.length < 2) continue;
        const x1 = xs[0]; const x2 = xs[xs.length - 1]; const y1 = ys[0]; const y2 = ys[ys.length - 1];
        if (x2 - x1 < 30 || y2 - y1 < 8) continue;
        // A plain box (one cell) around a paragraph is a frame, not a table.
        if (ys.length === 2 && xs.length === 2) continue;
        tables.push({ x1, x2, y1, y2, xs, ys: [...ys].sort((a, b) => b - a), hs, vs });
    }
    return tables;
}

function dirOf(text) {
    const r = (text.match(RTL_CHARS) || []).length;
    const l = (text.match(LTR_CHARS) || []).length;
    if (r === 0 && l === 0) return 'neutral';
    return r > l ? 'rtl' : 'ltr';
}

const MARK = '[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED]';
const MARK_FIRST = new RegExp(`^${MARK}`);
const MARK_BEFORE_BASE = new RegExp(`(${MARK}+)([\\u0620-\\u064A\\u0671-\\u06D3])`, 'g');

// Build logical text for a visual line of runs.
function orderRuns(input, rtl) {
    let runs = input.map((r) => ({ ...r }));
    // pdf.js puts Arabic marks (tanween, harakat) before their letter when a run starts with one
    for (const r of runs) if (MARK_FIRST.test(r.text)) r.text = r.text.replace(MARK_BEFORE_BASE, '$2$1');
    // A lone punctuation run drawn inside the span of a longer RTL run (pdf.js merged the words
    // around it): put it into that run at the matching word boundary.
    const big = runs.filter((r) => dirOf(r.text) === 'rtl' && r.w > 0);
    runs = runs.filter((r) => {
        if (!/^[:;,.!?،؛؟]$/.test(r.text.trim())) return true;
        const host = big.find((b) => r.x > b.x + 1 && r.x + r.w < b.x + b.w - 1);
        if (!host) return true;
        const fromRight = (host.x + host.w - (r.x + r.w)) / host.w;
        const target = fromRight * host.text.length;
        let best = -1; let dist = Infinity;
        for (let i = 0; i < host.text.length; i += 1) if (host.text[i] === ' ' && Math.abs(i - target) < dist) { dist = Math.abs(i - target); best = i; }
        if (best < 0) return true;
        host.text = `${host.text.slice(0, best)}${r.text.trim()}${host.text.slice(best)}`;
        return false;
    });
    const sorted = runs.sort((a, b) => (rtl ? b.x - a.x : a.x - b.x));
    // drop pure-space runs that sit on top of a neighbour (spaces pdf.js invents around marks)
    const cleaned = sorted.filter((r, i) => {
        if (r.text.trim()) return true;
        const n = sorted[i + 1]; const p = sorted[i - 1];
        const overlaps = (o) => o && o.text.trim() && o.w > 0 && Math.min(r.x + r.w, o.x + o.w) - Math.max(r.x, o.x) > r.w * 0.5;
        const zeroNeighbour = (o) => o && o.text.trim() && o.w === 0 && o.x >= r.x - 0.5 && o.x < r.x + r.w;
        return !(overlaps(n) || overlaps(p) || zeroNeighbour(n) || zeroNeighbour(p));
    });
    // resolve neutral runs (spaces, punctuation, digits) to the direction around them
    const dirs = cleaned.map((r) => dirOf(r.text));
    const base = rtl ? 'rtl' : 'ltr';
    const resolved = dirs.map((d, i) => {
        if (d !== 'neutral') return d;
        let before = null; let after = null;
        for (let j = i - 1; j >= 0; j -= 1) if (dirs[j] !== 'neutral') { before = dirs[j]; break; }
        for (let j = i + 1; j < dirs.length; j += 1) if (dirs[j] !== 'neutral') { after = dirs[j]; break; }
        if (before && before === after) return before;
        if (rtl && /^\s*\d[\d.,]*\s*$/.test(cleaned[i].text)) return 'ltr';
        return base;
    });
    // neutral runs read right-to-left inside RTL text (e.g. ".»" drawn left-to-right is "»." logically)
    cleaned.forEach((r, i) => {
        if (dirs[i] === 'neutral' && resolved[i] === 'rtl' && r.text.trim().length > 1 && !/\d/.test(r.text)) r.text = Array.from(r.text).reverse().join('');
    });
    // inside an RTL line, consecutive LTR runs keep their left-to-right order (and vice versa)
    const out = [];
    let group = [];
    const flush = () => { if (group.length) { out.push(...group.reverse()); group = []; } };
    cleaned.forEach((run, i) => { if (resolved[i] !== base) group.push(run); else { flush(); out.push(run); } });
    flush();
    // spaces between runs that are visually apart
    const result = [];
    for (let i = 0; i < out.length; i += 1) {
        const run = { ...out[i] };
        if (i > 0) {
            const prev = out[i - 1];
            const absGap = Math.min(Math.abs(prev.x - (run.x + run.w)), Math.abs(run.x - (prev.x + prev.w)));
            const needSpace = absGap > run.size * 0.18 && run.w > 0 && prev.w > 0 && !/\s$/.test(result[result.length - 1].text) && !/^\s/.test(run.text);
            if (needSpace) run.text = ` ${run.text}`;
        }
        result.push(run);
    }
    return result;
}

function groupLines(runs) {
    const sorted = [...runs].sort((a, b) => b.y - a.y || a.x - b.x);
    const lines = [];
    for (const run of sorted) {
        const line = lines.find((l) => Math.abs(l.y - run.y) < Math.max(2, Math.min(l.size, run.size) * 0.45) && !(run.x > l.x2 + l.size * 6 || run.x + run.w < l.x1 - l.size * 6));
        if (line) {
            line.runs.push(run); line.x1 = Math.min(line.x1, run.x); line.x2 = Math.max(line.x2, run.x + run.w);
            line.size = Math.max(line.size, run.size);
        } else lines.push({ y: run.y, runs: [run], x1: run.x, x2: run.x + run.w, size: run.size });
    }
    lines.sort((a, b) => b.y - a.y);
    for (const line of lines) {
        const text = line.runs.map((r) => r.text).join('');
        line.rtl = dirOf(text) === 'rtl';
        line.ordered = orderRuns(line.runs, line.rtl);
        line.text = line.ordered.map((r) => r.text).join('').replace(/\s+/g, ' ').trim();
        const sizes = line.runs.filter((r) => r.text.trim()).map((r) => r.size);
        line.bodySize = sizes.length ? sizes.sort((a, b) => a - b)[Math.floor(sizes.length / 2)] : line.size;
    }
    return lines.filter((l) => l.text);
}

function listMarker(line, ctx) {
    const first = line.ordered.find((r) => r.text.trim());
    if (!first) return null;
    const textRuns = line.ordered.filter((r) => r.text.trim());
    const looksLikeHeading = ctx && (line.bodySize >= ctx.bodySize * 1.12 || (textRuns.every((r) => r.bold) && line.text.length < 60));
    const t = first.text.trim();
    if (first.symbol || BULLET_RE.test(t)) {
        const rest = line.text.replace(BULLET_RE, '').replace(/^[\uF000-\uF0FF•]\s*/, '');
        if (rest && rest !== line.text) return { type: 'bullet', strip: (s) => s.replace(BULLET_RE, '').replace(/^[\uF000-\uF0FF]\s*/, '') };
        if (first.symbol && t.length <= 2) return { type: 'bullet', strip: (s) => s.slice(t.length).replace(/^\s+/, '') };
    }
    const m = line.text.match(NUMBER_RE);
    if (m && line.text.length > m[0].length && !looksLikeHeading) {
        const token = m[1].replace(/[().\-]/g, '');
        let kind = 'decimal';
        if (/^[ivxlcdm]+$/.test(token) && token.length > 1) kind = 'lowerRoman';
        else if (/^[a-z]$/.test(token)) kind = 'lowerLetter';
        else if (/^[A-Z]$/.test(token)) kind = 'upperLetter';
        else if (/^[\u0660-\u0669]+$/.test(token)) kind = 'arabicIndic';
        else if (!/^\d+$/.test(token)) return null;
        const value = kind === 'decimal' ? Number(token) : kind === 'arabicIndic' ? Number(token.replace(/[\u0660-\u0669]/g, (d) => d.charCodeAt(0) - 0x660)) : 1;
        return { type: 'number', kind, value, strip: (s) => s.replace(NUMBER_RE, '') };
    }
    return null;
}

function linesToParagraphs(lines, ctx) {
    const paras = [];
    let cur = null;
    for (const line of lines) {
        const marker = listMarker(line, ctx);
        const prev = cur && cur.lines[cur.lines.length - 1];
        const gap = prev ? prev.y - line.y : 0;
        const lineHeight = prev ? Math.max(prev.size, line.size) * 1.45 : 0;
        const sameStyle = prev && Math.abs(prev.bodySize - line.bodySize) < 0.6 && prev.rtl === line.rtl;
        const continues = cur && !marker && sameStyle && gap <= lineHeight * 1.05 && gap > 0
            && (cur.marker ? (line.rtl ? Math.abs(line.x2 - cur.textEdge) < 6 : Math.abs(line.x1 - cur.textEdge) < 6) : true)
            && !(cur.lines.length === 1 && prev.text.length < 0.6 * ctx.lineWidthChars && !cur.marker);
        if (continues) { cur.lines.push(line); continue; }
        cur = { lines: [line], marker, rtl: line.rtl, markerEdge: line.rtl ? line.x2 : line.x1 };
        if (marker) {
            const textRuns = line.ordered.filter((r) => r.text.trim());
            const textRun = textRuns[1] || textRuns[0];
            cur.textEdge = line.rtl ? textRun.x + textRun.w : textRun.x;
        }
        paras.push(cur);
    }
    return paras;
}

function runProps(run, para) {
    const parts = [];
    if (run.family) parts.push(`<w:rFonts w:ascii="${xml(run.family)}" w:hAnsi="${xml(run.family)}" w:cs="${xml(RTL_CHAR.test(run.text) ? run.family : 'Arial')}"/>`);
    if (run.bold) parts.push('<w:b/><w:bCs/>');
    if (run.italic) parts.push('<w:i/><w:iCs/>');
    if (run.underline) parts.push('<w:u w:val="single"/>');
    if (run.color) parts.push(`<w:color w:val="${run.color}"/>`);
    const hp = Math.max(2, Math.round(run.size * 2));
    parts.push(`<w:sz w:val="${hp}"/><w:szCs w:val="${hp}"/>`);
    if (para.rtl && RTL_CHAR.test(run.text)) parts.push('<w:rtl/>');
    return `<w:rPr>${parts.join('')}</w:rPr>`;
}

// Tanween is always word-final: a tanween followed by another letter of the same word
// comes from a PDF glyph that maps to "letter + tanween" and is dropped.
function fixTanween(runs) {
    for (let i = 0; i < runs.length; i += 1) {
        if (runs[i].picture) continue;
        const next = runs[i + 1] && !runs[i + 1].picture ? runs[i + 1].text.charAt(0) : '';
        const t = runs[i].text + next;
        const fixed = t.replace(/[\u064C\u064D](?=[\u0621-\u064A])/g, '').replace(/\u064B(?=[\u0621-\u0626\u0628-\u0648\u064A])/g, '');
        runs[i].text = next ? fixed.slice(0, fixed.length - 1) : fixed;
    }
}

function paragraphXml(para, ctx, inCell = false) {
    // merge lines into runs with the same formatting
    const runs = [];
    para.lines.forEach((line, i) => {
        let ordered = line.ordered.map((r) => ({ ...r }));
        if (i === 0 && para.marker) {
            // remove the marker text from the first non-empty run(s)
            let text = ordered.map((r) => r.text).join('');
            const stripped = para.marker.strip(text.replace(/^\s+/, ''));
            let toRemove = text.length - stripped.length;
            for (const r of ordered) {
                if (toRemove <= 0) break;
                const take = Math.min(r.text.length, toRemove);
                r.text = r.text.slice(take); toRemove -= take;
            }
            ordered = ordered.filter((r) => r.text);
        }
        if (i > 0 && ordered.length) ordered[0].text = ` ${ordered[0].text.replace(/^\s+/, '')}`;
        for (const r of ordered) {
            const last = runs[runs.length - 1];
            if (last && !last.picture && !r.picture && last.bold === r.bold && last.italic === r.italic && Math.abs(last.size - r.size) < 0.3 && last.family === r.family && last.color === r.color && last.underline === r.underline) last.text += r.text;
            else runs.push({ ...r });
        }
    });
    fixTanween(runs);
    if (runs.length) runs[0].text = runs[0].text.replace(/^\s+/, '');
    if (runs.length) runs[runs.length - 1].text = runs[runs.length - 1].text.replace(/\s+$/, '');
    const textSizes = runs.filter((r) => !r.picture && r.text.trim()).map((r) => r.size);
    const size = textSizes.length ? Math.min(...textSizes) : para.lines[0].bodySize;
    const allBold = runs.length && runs.every((r) => r.bold || !r.text.trim());
    const ppr = [];
    let level = 0;
    const wordCount = runs.map((r) => r.text).join('').split(/\s+/).length;
    if (!inCell && !para.marker && wordCount <= 20) {
        if (size >= ctx.bodySize * 1.45) level = 1;
        else if (size >= ctx.bodySize * 1.15 && (allBold || size >= ctx.bodySize * 1.25)) level = 2;
        else if (allBold && size >= ctx.bodySize * 1.05 && wordCount <= 12) level = 3;
    }
    if (level) ppr.push(`<w:pStyle w:val="Heading${level}"/>`);
    if (para.marker) {
        const { id: numId, ilvl } = ctx.numIdFor(para);
        ppr.push(`<w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="${ilvl}"/><w:numId w:val="${numId}"/></w:numPr>`);
        ppr.splice(0, ppr.length - 1);
    }
    if (para.rtl) ppr.push('<w:bidi/>');
    const line = para.lines[0];
    if (!inCell && !para.marker && ctx.contentWidth) {
        const center = (line.x1 + line.x2) / 2;
        const narrow = (line.x2 - line.x1) < ctx.contentWidth * 0.8;
        if (narrow && Math.abs(center - ctx.pageCenter) < ctx.contentWidth * 0.04 && para.lines.every((l) => Math.abs((l.x1 + l.x2) / 2 - ctx.pageCenter) < ctx.contentWidth * 0.05)) ppr.push('<w:jc w:val="center"/>');
    }
    ppr.push(`<w:spacing w:before="0" w:after="${inCell ? 0 : para.marker ? 40 : 120}"/>`);
    const rpr = runs[0] ? runProps(runs[0], para).replace('<w:rPr>', '<w:rPr>') : '';
    const body = runs.map((r) => (r.picture && ctx.addPicture
        ? ctx.addPicture(r.picture, r.w, r.picH)
        : `<w:r>${runProps(r, para)}<w:t xml:space="preserve">${xml(r.text)}</w:t></w:r>`)).join('');
    return `<w:p><w:pPr>${ppr.join('')}${rpr}</w:pPr>${body}</w:p>`;
}

async function imageBytes(page, img, scale = 1) {
    // Prefer the original image data; fall back to the rendered page area.
    let source = null;
    try {
        source = img.inline || (await new Promise((resolve) => {
            const objs = img.id.startsWith('g_') ? page.commonObjs : page.objs;
            objs.get(img.id, resolve);
        }));
    } catch { source = null; }
    const canvas = document.createElement('canvas');
    const ctx2d = canvas.getContext('2d');
    if (source?.bitmap?.width) {
        canvas.width = source.bitmap.width; canvas.height = source.bitmap.height;
        ctx2d.drawImage(source.bitmap, 0, 0);
    } else if (source?.data && source.width && source.height) {
        canvas.width = source.width; canvas.height = source.height;
        const out = ctx2d.createImageData(source.width, source.height);
        const d = source.data; const n = source.width * source.height;
        if (d.length >= n * 4) out.data.set(d.subarray(0, n * 4));
        else if (d.length >= n * 3) { for (let i = 0; i < n; i += 1) { out.data[i * 4] = d[i * 3]; out.data[i * 4 + 1] = d[i * 3 + 1]; out.data[i * 4 + 2] = d[i * 3 + 2]; out.data[i * 4 + 3] = 255; } }
        else if (d.length >= n) { for (let i = 0; i < n; i += 1) { out.data[i * 4] = out.data[i * 4 + 1] = out.data[i * 4 + 2] = d[i]; out.data[i * 4 + 3] = 255; } }
        else {
            // 1 bit per pixel
            const rowBytes = Math.ceil(source.width / 8);
            for (let y = 0; y < source.height; y += 1) for (let x = 0; x < source.width; x += 1) { const bit = (d[y * rowBytes + (x >> 3)] >> (7 - (x & 7))) & 1; const v = bit ? 255 : 0; const i = (y * source.width + x) * 4; out.data[i] = out.data[i + 1] = out.data[i + 2] = v; out.data[i + 3] = 255; }
        }
        ctx2d.putImageData(out, 0, 0);
    } else {
        return null;
    }
    if (!canvas.width || !canvas.height) return null;
    if (img.flipX || img.flipY) {
        const c2 = document.createElement('canvas'); c2.width = canvas.width; c2.height = canvas.height;
        const k = c2.getContext('2d'); k.translate(img.flipX ? c2.width : 0, img.flipY ? c2.height : 0); k.scale(img.flipX ? -1 : 1, img.flipY ? -1 : 1); k.drawImage(canvas, 0, 0);
        return blobOf(c2);
    }
    return blobOf(canvas, scale);
}
function blobOf(canvas) {
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}
async function renderArea(page, box) {
    const scale = 2;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    if (!box) return blobOf(canvas);
    const [vx1, vy1] = viewport.convertToViewportPoint(box.x1, box.y2);
    const [vx2, vy2] = viewport.convertToViewportPoint(box.x2, box.y1);
    const c2 = document.createElement('canvas'); c2.width = Math.max(1, Math.round(vx2 - vx1)); c2.height = Math.max(1, Math.round(vy2 - vy1));
    c2.getContext('2d').drawImage(canvas, vx1, vy1, c2.width, c2.height, 0, 0, c2.width, c2.height);
    return blobOf(c2);
}

async function analysePage(pdfjs, page, stats = {}) {
    const viewport = page.getViewport({ scale: 1 });
    const [view0, view1] = [page.view[0], page.view[1]];
    const opList = await page.getOperatorList();
    const content = await page.getTextContent();
    const { segments, images } = scanOperators(pdfjs, opList);
    let missing = 0; let total = 0;
    const runs = [];
    for (const item of content.items) {
        if (!('str' in item)) continue;
        const raw = item.str;
        total += raw.length;
        missing += (raw.match(/\u0000/g) || []).length;
        const text = cleanText(raw).replace(/\u00A0/g, ' ');
        if (!text) continue;
        const t = item.transform;
        const size = Math.abs(t[3]) || Math.hypot(t[2], t[3]) || Math.abs(t[0]) || 10;
        const fi = fontInfo(page, item.fontName);
        const skew = Math.abs(t[2]) > 0.1 * Math.abs(t[3]);
        runs.push({ text, x: t[4] - view0, y: t[5] - view1, w: item.width, size: Math.round(size * 2) / 2, bold: fi.bold, italic: fi.italic || skew, family: fi.symbol ? '' : fi.family, symbol: fi.symbol, fontName: item.fontName });
    }
    for (const s of segments) { s[0] = [s[0][0] - view0, s[0][1] - view1]; s[1] = [s[1][0] - view0, s[1][1] - view1]; }
    for (const im of images) { im.x1 -= view0; im.x2 -= view0; im.y1 -= view1; im.y2 -= view1; }
    // underline: a thin horizontal line just under the run
    const used = new Set();
    for (const r of runs) {
        for (let i = 0; i < segments.length; i += 1) {
            const [a, b] = segments[i];
            if (Math.abs(a[1] - b[1]) > 0.8) continue;
            const y = (a[1] + b[1]) / 2; const x1 = Math.min(a[0], b[0]); const x2 = Math.max(a[0], b[0]);
            if (y < r.y && y > r.y - r.size * 0.35 && x1 <= r.x + r.w * 0.15 && x2 >= r.x + r.w * 0.85 && x2 - x1 < r.w + r.size * 3) { r.underline = true; used.add(i); }
        }
    }
    const lineSegments = segments.filter((_, i) => !used.has(i));
    // text colour: sample the rendered page under each run
    try {
        const scale = 1.5;
        const vp = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
        const c2d = canvas.getContext('2d', { willReadFrequently: true });
        await page.render({ canvasContext: c2d, viewport: vp }).promise;
        for (const r of runs) {
            if (r.picture) continue;
            if (!r.text.trim() || r.w <= 0) continue;
            const x = Math.max(0, Math.floor(r.x * scale)); const y = Math.max(0, Math.floor((viewport.height - r.y - r.size * 0.75) * scale));
            const w = Math.max(1, Math.min(canvas.width - x, Math.ceil(r.w * scale))); const h = Math.max(1, Math.min(canvas.height - y, Math.ceil(r.size * 0.8 * scale)));
            const d = c2d.getImageData(x, y, w, h).data;
            const tally = new Map();
            for (let i = 0; i < d.length; i += 4) {
                const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
                if (lum > 200) continue;
                const key = `${d[i] >> 4},${d[i + 1] >> 4},${d[i + 2] >> 4}`;
                const e = tally.get(key) || { n: 0, r: 0, g: 0, b: 0, lum };
                e.n += 1; e.r += d[i]; e.g += d[i + 1]; e.b += d[i + 2]; tally.set(key, e);
            }
            let best = null;
            for (const e of tally.values()) if (!best || e.n * (255 - e.lum) > best.n * (255 - best.lum)) best = e;
            if (!best || best.n < 3) continue;
            const rgb = [best.r / best.n, best.g / best.n, best.b / best.n].map((v) => Math.round(v));
            const sat = Math.max(...rgb) - Math.min(...rgb);
            if (sat > 40 || Math.max(...rgb) > 90) r.color = rgb.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
        }
    } catch { /* colours are optional */ }
    return { width: viewport.width, height: viewport.height, runs, segments: lineSegments, images, unreadable: total > 20 && missing / total > 0.03 };
}

function buildNumbering(lists) {
    const abs = [];
    const nums = [];
    lists.forEach((list, i) => {
        const id = i + 1;
        const lvls = [];
        for (let l = 0; l < 9; l += 1) {
            const def = list.levels[l] || list.levels[list.levels.length - 1] || { type: 'bullet' };
            const bullet = def.type === 'bullet';
            const fmt = bullet ? 'bullet' : def.kind;
            const text = bullet ? ['•', '◦', '▪'][l % 3] : `%${l + 1}.`;
            const start = list.levels[l] ? (list.levels[l].start || 1) : 1;
            lvls.push(`<w:lvl w:ilvl="${l}"><w:start w:val="${start}"/><w:numFmt w:val="${fmt}"/><w:lvlText w:val="${text}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${720 * (l + 1)}" w:hanging="360"/></w:pPr>${bullet ? '<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/></w:rPr>' : ''}</w:lvl>`);
        }
        abs.push(`<w:abstractNum w:abstractNumId="${id}"><w:multiLevelType w:val="multilevel"/>${lvls.join('')}</w:abstractNum>`);
        nums.push(`<w:num w:numId="${id}"><w:abstractNumId w:val="${id}"/></w:num>`);
    });
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${abs.join('')}${nums.join('')}</w:numbering>`;
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Arial" w:eastAsia="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-US" w:bidi="ar-EG"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:bCs/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:bCs/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="160" w:after="60"/><w:outlineLvl w:val="2"/></w:pPr><w:rPr><w:b/><w:bCs/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:ind w:left="720"/><w:contextualSpacing/></w:pPr></w:style>
<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tblBorders><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
</w:styles>`;

export async function pdfToDocx(arrayBuffer, { onProgress } = {}) {
    const pdfjs = await loadPdfJs();
    const worker = await loadWorker(pdfjs);
    const task = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer), ...(worker ? { worker } : {}) });
    const doc = await task.promise;
    const JSZip = (await import(JSZIP_URL)).default;
    const zip = new JSZip();
    const media = [];
    const lists = [];
    const bodyParts = [];
    let firstSize = null;
    let headerInfo = null;
    let footerInfo = null;
    let edgeCtx = null;
    const stats = { pages: doc.numPages, tables: 0, images: 0, imagePages: 0, unreadablePages: 0, scannedPages: 0 };
    try {
        // body font size across the document (most common size, weighted by characters)
        const analyses = [];
        for (let n = 1; n <= doc.numPages; n += 1) {
            const page = await doc.getPage(n);
            analyses.push({ page, a: await analysePage(pdfjs, page, stats) });
        }
        const sizeWeight = new Map();
        for (const { a } of analyses) for (const r of a.runs) sizeWeight.set(r.size, (sizeWeight.get(r.size) || 0) + r.text.length);
        let bodySize = 11; let best = -1;
        for (const [s, w] of sizeWeight) if (w > best) { best = w; bodySize = s; }

        let listState = null;
        const addImage = (blob, wPt, hPt, maxW) => {
            if (!blob) return '';
            const idx = media.length + 1;
            const name = `image${idx}.png`;
            media.push({ name, blob });
            let w = wPt; let h = hPt;
            if (w > maxW) { h = (h * maxW) / w; w = maxW; }
            const cx = Math.round(w * 12700); const cy = Math.round(h * 12700);
            return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${idx}" name="Picture ${idx}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${idx}" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdImg${idx}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
        };

        // Repeated header/footer lines (same text, ignoring digits, on most pages) go into a real Word header/footer.
        const edgeLine = (a, top) => {
            const band = a.runs.filter((r) => r.text.trim() && !r.picture && (top ? r.y > a.height * 0.9 : r.y < a.height * 0.09));
            if (!band.length) return null;
            const y = top ? Math.max(...band.map((r) => r.y)) : Math.min(...band.map((r) => r.y));
            const members = band.filter((r) => Math.abs(r.y - y) < r.size * 0.5);
            const lines = groupLines(members);
            if (lines.length !== 1) return null;
            return { members, line: lines[0], key: lines[0].text.replace(/[0-9\u0660-\u0669]+/g, '#') };
        };
        const findRepeated = (top) => {
            if (analyses.length < 2) return null;
            const found = analyses.map(({ a }) => edgeLine(a, top));
            const counts = new Map();
            for (const f of found) if (f) counts.set(f.key, (counts.get(f.key) || 0) + 1);
            let key = null; let n = 0;
            for (const [k, c] of counts) if (c > n) { n = c; key = k; }
            if (!key || n < 2 || n < analyses.length * 0.5) return null;
            const hits = found.filter((f) => f && f.key === key);
            hits.forEach((f) => { for (const r of f.members) r.edge = true; });
            const variesDigits = new Set(hits.map((f) => f.line.text)).size > 1 && /#/.test(key);
            return { line: hits[0].line, pageField: variesDigits };
        };
        headerInfo = findRepeated(true);
        footerInfo = findRepeated(false);
        if (headerInfo || footerInfo) for (const { a } of analyses) a.runs = a.runs.filter((r) => !r.edge);

        for (let p = 0; p < analyses.length; p += 1) {
            const { page, a } = analyses[p];
            if (p === 0) firstSize = a;
            const blocks = [];
            const textRuns = a.runs.filter((r) => r.text.trim());
            const xsAll = textRuns.map((r) => r.x); const xeAll = textRuns.map((r) => r.x + r.w);
            const minX = xsAll.length ? Math.min(...xsAll) : 72; const maxX = xeAll.length ? Math.max(...xeAll) : a.width - 72;
            const contentWidth = Math.max(100, maxX - minX);
            const maxW = Math.max(100, a.width - 2 * Math.max(36, Math.min(minX, a.width - maxX, 90)));
            const bigImage = a.images.find((im) => (im.x2 - im.x1) * (im.y2 - im.y1) > a.width * a.height * 0.6);
            if (a.unreadable || (!textRuns.length && (bigImage || a.images.length))) {
                // Scanned page, or text that cannot be decoded: keep the page as a picture.
                const blob = await renderArea(page, null);
                const pw = a.width; const ph = a.height;
                const pic = await addImage(blob, pw, ph, maxW);
                blocks.push({ top: a.height, xml: `<w:p><w:pPr><w:jc w:val="center"/></w:pPr>${pic}</w:p>` });
                if (a.unreadable) stats.unreadablePages += 1; else stats.scannedPages += 1;
                stats.imagePages += 1;
            } else {
                const tables = detectTables(a.segments);
                const inTable = (r) => tables.find((t) => r.x + r.w / 2 > t.x1 && r.x + r.w / 2 < t.x2 && r.y + r.size * 0.3 > t.y1 && r.y + r.size * 0.3 < t.y2);
                const free = [];
                for (const r of a.runs) { const t = inTable(r); if (t) (t.runs ||= []).push(r); else free.push(r); }
                const ctx = { bodySize, contentWidth, pageCenter: a.width / 2, lineWidthChars: contentWidth / (bodySize * 0.5), numIdFor: null };
                const sameFmt = (x, m) => x && x.type === m.type && x.kind === m.kind;
                const numIdFor = (para) => {
                    const m = para.marker;
                    const edge = para.markerEdge;
                    const depth = (e) => (para.rtl ? -e : e);
                    const level = { edge, type: m.type, kind: m.kind, start: m.value || 1 };
                    const startList = () => {
                        lists.push({ levels: [level] });
                        listState = { id: lists.length, open: true, rtl: para.rtl, edges: [edge], cur: [lists.length] };
                        return { id: listState.id, ilvl: 0 };
                    };
                    if (!listState || !listState.open || listState.rtl !== para.rtl) return startList();
                    const { edges } = listState;
                    let L = edges.findIndex((e) => Math.abs(e - edge) < 5);
                    if (L < 0) {
                        if (depth(edge) > depth(edges[edges.length - 1]) && edges.length < 8) { L = edges.length; edges.push(edge); }
                        else if (depth(edge) < depth(edges[0])) return startList();
                        else { L = 0; let best = Infinity; edges.forEach((e, i) => { if (Math.abs(e - edge) < best) { best = Math.abs(e - edge); L = i; } }); }
                    }
                    edges.length = L + 1;
                    listState.cur.length = Math.min(listState.cur.length, L + 1);
                    const main = lists[listState.id - 1].levels;
                    if (L === 0) {
                        if (!sameFmt(main[0], m)) return startList();
                        listState.cur[0] = listState.id;
                        return { id: listState.id, ilvl: 0 };
                    }
                    const current = listState.cur[L];
                    if (current && sameFmt(lists[current - 1].levels[L], m)) return { id: current, ilvl: L };
                    if (!main[L]) { main[L] = level; listState.cur[L] = listState.id; return { id: listState.id, ilvl: L }; }
                    if (sameFmt(main[L], m) && !current) { listState.cur[L] = listState.id; return { id: listState.id, ilvl: L }; }
                    // a sub-list with another style (e.g. numbers under a bulleted level): its own numbering
                    const levels = main.slice(0, L); levels[L] = level;
                    lists.push({ levels });
                    listState.cur[L] = lists.length;
                    return { id: lists.length, ilvl: L };
                };
                ctx.numIdFor = numIdFor;
                edgeCtx = ctx;
                ctx.addPicture = (blob, w, h) => addImage(blob, w, h, 1e9);
                // paragraphs outside tables
                const lines = groupLines(free);
                const paras = linesToParagraphs(lines, ctx);
                for (const para of paras) {
                    blocks.push({ top: para.lines[0].y + para.lines[0].size, para });
                }
                for (const t of tables) {
                    stats.tables += 1;
                    blocks.push({ top: t.y2, table: t });
                }
                for (const im of a.images) {
                    const w = im.x2 - im.x1; const h = im.y2 - im.y1;
                    if (w < 6 || h < 6) continue;
                    // a full-page picture under real text is a background or a scan with a text layer
                    if (w * h > a.width * a.height * 0.6) continue;
                    let blob = await imageBytes(page, im);
                    if (!blob) blob = await renderArea(page, im);
                    blocks.push({ top: im.y2, image: { blob, w, h, center: Math.abs((im.x1 + im.x2) / 2 - (minX + maxX) / 2) < contentWidth * 0.05 } });
                    stats.images += 1;
                }
                blocks.sort((x, y) => y.top - x.top);
                for (const b of blocks) {
                    if (b.para) {
                        if (!b.para.marker && listState) listState.open = false;
                        b.xml = paragraphXml(b.para, ctx);
                    } else if (b.table) {
                        if (listState) listState.open = false;
                        b.xml = tableXml(b.table, ctx);
                    } else if (b.image) {
                        if (listState) listState.open = false;
                        const pic = await addImage(b.image.blob, b.image.w, b.image.h, maxW);
                        b.xml = pic ? `<w:p><w:pPr>${b.image.center ? '<w:jc w:val="center"/>' : ''}<w:spacing w:after="120"/></w:pPr>${pic}</w:p>` : '';
                    }
                }
            }
            bodyParts.push(blocks.map((b) => b.xml).join(''));
            onProgress?.(p + 1, analyses.length);
        }
        stats.bodySize = bodySize;
    } finally {
        await doc.destroy();
    }

    const pageW = Math.round((firstSize?.width || 595.28) * 20);
    const pageH = Math.round((firstSize?.height || 841.89) * 20);
    const body = bodyParts.map((part, i) => (part || '<w:p/>') + (i < bodyParts.length - 1 ? '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' : '')).join('');
    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${body}<w:sectPr>${headerInfo ? '<w:headerReference w:type="default" r:id="rIdHeader1"/>' : ''}${footerInfo ? '<w:footerReference w:type="default" r:id="rIdFooter1"/>' : ''}<w:pgSz w:w="${pageW}" w:h="${pageH}"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>${headerInfo ? '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>' : ''}${footerInfo ? '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' : ''}</Types>`);
    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
    const rels = [
        '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>',
        '<Relationship Id="rIdNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>',
        ...(headerInfo ? ['<Relationship Id="rIdHeader1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>'] : []),
        ...(footerInfo ? ['<Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>'] : []),
        ...media.map((m, i) => `<Relationship Id="rIdImg${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${m.name}"/>`),
    ];
    zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join('')}</Relationships>`);
    const edgePart = (info, tag) => {
        const para = { lines: [info.line], rtl: info.line.rtl, marker: null };
        let p = paragraphXml(para, { ...(edgeCtx || {}), bodySize: 1e9, contentWidth: 0 }, true);
        if (info.pageField) p = p.replace(/(<w:t xml:space="preserve">[^<]*?)([0-9\u0660-\u0669]+)([^<]*<\/w:t><\/w:r>)/, (all, before, digits, after) => `${before}</w:t></w:r><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>${digits}</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r><w:r><w:t xml:space="preserve">${after.replace(/^/, '')}`);
        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:${tag} xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${p}</w:${tag}>`;
    };
    if (headerInfo) zip.file('word/header1.xml', edgePart(headerInfo, 'hdr'));
    if (footerInfo) zip.file('word/footer1.xml', edgePart(footerInfo, 'ftr'));
    zip.file('word/document.xml', documentXml);
    zip.file('word/styles.xml', STYLES_XML);
    zip.file('word/numbering.xml', buildNumbering(lists));
    for (const m of media) zip.file(`word/media/${m.name}`, m.blob);
    // Final safety net: the document must be well-formed XML.
    const check = new DOMParser().parseFromString(documentXml, 'application/xml');
    if (check.getElementsByTagName('parsererror').length) throw new Error('docx-xml');
    for (const part of ['word/header1.xml', 'word/footer1.xml']) {
        const f = zip.file(part);
        if (f && new DOMParser().parseFromString(await f.async('string'), 'application/xml').getElementsByTagName('parsererror').length) throw new Error('docx-xml');
    }
    const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    return { blob, stats };
}

function tableXml(t, ctx) {
    const xs = t.xs; const ys = t.ys; // ys sorted top→bottom (descending)
    const nCols = xs.length - 1; const nRows = ys.length - 1;
    const cells = Array.from({ length: nRows }, () => Array.from({ length: nCols }, () => []));
    const allText = (t.runs || []).map((r) => r.text).join('');
    const rtl = dirOf(allText) === 'rtl';
    for (const r of t.runs || []) {
        const cx = r.x + r.w / 2; const cy = r.y + r.size * 0.3;
        let col = xs.findIndex((x, i) => i < nCols && cx >= x && cx < xs[i + 1]);
        let row = ys.findIndex((y, i) => i < nRows && cy <= y && cy > ys[i + 1]);
        if (col < 0) col = cx < xs[0] ? 0 : nCols - 1;
        if (row < 0) row = cy > ys[0] ? 0 : nRows - 1;
        cells[row][col].push(r);
    }
    // merged cells: a vertical line missing between two columns in a row → gridSpan
    const hasV = (x, yTop, yBottom) => t.vs.some((v) => Math.abs(v.x - x) < 2 && v.y1 <= yBottom + 2 + (yTop - yBottom) * 0.4 && v.y2 >= yTop - 2 - (yTop - yBottom) * 0.4);
    const grid = xs.slice(1).map((x, i) => Math.round((x - xs[i]) * 20));
    const rowsXml = [];
    for (let r = 0; r < nRows; r += 1) {
        const rowCells = [];
        for (let c = 0; c < nCols; c += 1) {
            let span = 1;
            while (c + span < nCols && !hasV(xs[c + span], ys[r], ys[r + 1])) { cells[r][c].push(...cells[r][c + span]); span += 1; }
            const lines = groupLines(cells[r][c]);
            const paras = linesToParagraphs(lines, { ...ctx, lineWidthChars: 1e9 });
            if (rtl) paras.forEach((p) => { p.rtl = true; });
            const inner = paras.length ? paras.map((p) => paragraphXml(p, ctx, true)).join('') : '<w:p/>';
            const width = grid.slice(c, c + span).reduce((s, v) => s + v, 0);
            rowCells.push(`<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${span > 1 ? `<w:gridSpan w:val="${span}"/>` : ''}</w:tcPr>${inner}</w:tc>`);
            c += span - 1;
        }
        // In a right-to-left table, Word lists cells from right to left.
        if (rtl) rowCells.reverse();
        rowsXml.push(`<w:tr>${rowCells.join('')}</w:tr>`);
    }
    const gridXml = (rtl ? [...grid].reverse() : grid).map((w) => `<w:gridCol w:w="${w}"/>`).join('');
    return `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/>${rtl ? '<w:bidiVisual/>' : ''}<w:tblW w:w="${grid.reduce((s, v) => s + v, 0)}" w:type="dxa"/><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>${gridXml}</w:tblGrid>${rowsXml.join('')}</w:tbl><w:p><w:pPr><w:spacing w:after="0"/></w:pPr></w:p>`;
}
