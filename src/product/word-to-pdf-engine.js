// Word (.docx) → PDF, entirely in the browser.
// 1. docx-preview lays the document out as HTML (fonts, sizes, bold/italic, lists,
//    tables, images, page size and margins), plus fixes for RTL (w:bidi) and list markers.
// 2. Each section is cut into pages at positions that never split a text line,
//    table row or image, and each page is rasterised (html-to-image) into the PDF.
// 3. An invisible text layer (Noto Sans / Noto Sans Arabic) is placed over the words
//    so the PDF text can still be searched and copied.
// The file is never uploaded: libraries and fonts are fetched from the CDN, the document is not.
const DOCX_PREVIEW_URL = 'https://cdn.jsdelivr.net/npm/docx-preview@0.3.5/+esm';
const HTML_TO_IMAGE_URL = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/+esm';
const JSZIP_URL = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
const PDF_LIB_URL = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm';
const FONTKIT_URL = 'https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1/+esm';
const FONT_LATIN_URL = 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans@5.1.1/latin-400-normal.ttf';
const FONT_ARABIC_URL = 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-arabic@5.1.1/arabic-400-normal.ttf';

const ARABIC_RE = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const PX_TO_PT = 0.75;


const BULLET_MAP = { '\uF0B7': '•', '\u00B7': '•', '\uF0A7': '▪', '\uF0D8': '➢', '\uF076': '❖', '\uF0FC': '✓', '\uF06E': '■', '\uF0A8': '□', '\uF0D7': '►', '\uF0E8': '➔', '\uF02D': '–' };
const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function toRoman(n) {
    const map = [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];
    let out = '';
    for (const [v, s] of map) { while (n >= v) { out += s; n -= v; } }
    return out;
}
function toAlpha(n) {
    let s = '';
    while (n > 0) { n -= 1; s = String.fromCharCode(97 + (n % 26)) + s; n = Math.floor(n / 26); }
    return s;
}
function formatCounter(value, style) {
    switch ((style || 'decimal').trim()) {
        case 'lower-alpha': case 'lower-latin': return toAlpha(value);
        case 'upper-alpha': case 'upper-latin': return toAlpha(value).toUpperCase();
        case 'lower-roman': return toRoman(value);
        case 'upper-roman': return toRoman(value).toUpperCase();
        case 'decimal-leading-zero': return String(value).padStart(2, '0');
        case 'arabic-indic': return String(value).replace(/\d/g, (d) => String.fromCharCode(0x0660 + Number(d)));
        case 'none': return '';
        default: return String(value);
    }
}
function parseCounterList(value) {
    // "name 1 other 0" -> [[name, 1], [other, 0]]
    if (!value || value === 'none') return [];
    const parts = value.trim().split(/\s+/);
    const out = [];
    for (let i = 0; i < parts.length; i += 1) {
        const n = Number(parts[i + 1]);
        if (Number.isFinite(n) && parts[i + 1] !== undefined && /^-?\d+$/.test(parts[i + 1])) { out.push([parts[i], n]); i += 1; } else out.push([parts[i], null]);
    }
    return out;
}
function evaluateContent(content, counters) {
    // content like: "" counter(docx-num-5-0) ".\9 "
    const re = /"((?:[^"\\]|\\.)*)"|counter\(\s*([\w-]+)\s*(?:,\s*([\w-]+))?\s*\)/g;
    let out = '';
    let m;
    while ((m = re.exec(content))) {
        if (m[1] !== undefined) {
            out += m[1].replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/\\(.)/g, '$1');
        } else {
            out += formatCounter(counters.get(m[2]) ?? 0, m[3]);
        }
    }
    return out;
}

function materializeListMarkers(root, styleHost) {
    // docx-preview draws list numbers with CSS counters in ::before. Rasterising
    // a cloned page re-evaluates those counters per element (every item became
    // "1."), and Word bullets use Symbol/Wingdings private-use glyphs that show
    // as boxes. Replace each marker with real text before rendering.
    const counters = new Map();
    const marked = [];
    for (const p of root.querySelectorAll('p')) {
        const cs = getComputedStyle(p);
        for (const [name, v] of parseCounterList(cs.counterReset)) counters.set(name, v ?? 0);
        const before = getComputedStyle(p, '::before');
        const content = before.content;
        if (!content || content === 'none' || content === 'normal') continue;
        for (const [name, v] of parseCounterList(before.counterReset)) counters.set(name, v ?? 0);
        for (const [name, v] of parseCounterList(before.counterIncrement)) counters.set(name, (counters.get(name) ?? 0) + (v ?? 1));
        let text = evaluateContent(content, counters);
        let font = before.fontFamily;
        if (/symbol|wingdings|webdings/i.test(font) || /[\uF000-\uF0FF]/.test(text)) {
            text = text.replace(/[\uF000-\uF0FF\u00B7]/g, (ch) => BULLET_MAP[ch] || '•');
            font = 'Arial, sans-serif';
        }
        marked.push({ p, text: text.replace(/\t/g, ''), font, size: before.fontSize, color: before.color, weight: before.fontWeight, indent: Math.abs(parseFloat(cs.textIndent) || 0) });
    }
    for (const m of marked) {
        const span = document.createElement('span');
        span.className = 'adw-list-marker';
        span.textContent = m.text;
        span.style.cssText = `display:inline-block;min-width:${Math.max(m.indent, 12)}px;text-indent:0;${m.font ? `font-family:${m.font};` : ''}font-size:${m.size};color:${m.color};font-weight:${m.weight};white-space:pre;`;
        m.p.classList.add('adw-marker-done');
        m.p.insertBefore(span, m.p.firstChild);
    }
    const style = document.createElement('style');
    style.textContent = '.adw-marker-done::before{content:none!important}';
    styleHost.appendChild(style);
}

function textOf(node) {
    let t = '';
    node.querySelectorAll('t').forEach((x) => { t += x.textContent; });
    return t.replace(/\s+/g, '');
}

function applyBidi(docXml, root, stylesXml) {
    // docx-preview ignores <w:bidi/> (RTL paragraph) and <w:bidiVisual/> (RTL table).
    // Read them from document.xml and apply them to the rendered elements, matched in order.
    const xml = new DOMParser().parseFromString(docXml, 'application/xml');
    const body = xml.getElementsByTagNameNS(W_NS, 'body')[0];
    if (!body) return;
    const isOn = (el) => el && !/^(0|false|off)$/i.test(el.getAttributeNS(W_NS, 'val') || el.getAttribute('w:val') || '');
    const xParas = [...body.getElementsByTagNameNS(W_NS, 'p')].filter((p) => !p.closest?.('txbxContent'));
    const dParas = [...root.querySelectorAll('section.docx > article p')].filter((p) => !p.closest('.adw-skip'));
    // styles with contextualSpacing ("don't add space between paragraphs of the same style")
    const ctxStyles = new Set();
    if (stylesXml) {
        const sx = new DOMParser().parseFromString(stylesXml, 'application/xml');
        const info = new Map();
        for (const st of sx.getElementsByTagNameNS(W_NS, 'style')) {
            const id = st.getAttributeNS(W_NS, 'styleId') || st.getAttribute('w:styleId');
            const based = [...st.children].find((c) => c.localName === 'basedOn');
            const ppr = [...st.children].find((c) => c.localName === 'pPr');
            const cs = ppr && [...ppr.children].find((c) => c.localName === 'contextualSpacing');
            info.set(id, { based: based && (based.getAttributeNS(W_NS, 'val') || based.getAttribute('w:val')), ctx: cs ? isOn(cs) : undefined });
        }
        for (const id of info.keys()) {
            let cur = id; let guard = 0;
            while (cur && guard++ < 20) { const i = info.get(cur); if (!i) break; if (i.ctx !== undefined) { if (i.ctx) ctxStyles.add(id); break; } cur = i.based; }
        }
    }
    let prev = null;
    let j = 0;
    for (const xp of xParas) {
        const pPr = [...xp.children].find((c) => c.localName === 'pPr');
        const bidiEl = pPr && [...pPr.children].find((c) => c.localName === 'bidi');
        const want = textOf(xp);
        // find the matching rendered paragraph (same text) near the current position
        let k = j;
        while (k < dParas.length && k < j + 8 && dParas[k].textContent.replace(/\s+/g, '').replace(/^[^\p{L}\p{N}]+/u, '') !== want.replace(/^[^\p{L}\p{N}]+/u, '')) k += 1;
        if (k >= dParas.length || k >= j + 8) continue;
        j = k + 1;
        const el = dParas[k];
        const styleEl = pPr && [...pPr.children].find((c) => c.localName === 'pStyle');
        const styleId = styleEl ? (styleEl.getAttributeNS(W_NS, 'val') || styleEl.getAttribute('w:val')) : 'Normal';
        const ctxEl = pPr && [...pPr.children].find((c) => c.localName === 'contextualSpacing');
        const ctx = ctxEl ? isOn(ctxEl) : ctxStyles.has(styleId);
        if (ctx && prev && prev.ctx && prev.styleId === styleId && prev.el.parentElement === el.parentElement) {
            prev.el.style.marginBottom = '0px';
            el.style.marginTop = '0px';
        }
        prev = { el, styleId, ctx };
        if (!isOn(bidiEl)) continue;
        el.style.direction = 'rtl';
        el.style.unicodeBidi = 'isolate';
        const ta = el.style.textAlign;
        if (ta === 'left') el.style.textAlign = 'right';
        else if (ta === 'right') el.style.textAlign = 'left';
        const cs = getComputedStyle(el);
        const ml = cs.marginLeft; const mr = cs.marginRight;
        el.style.marginLeft = mr; el.style.marginRight = ml;
        const cell = el.closest('td,th');
        if (cell && !cell.style.textAlign) cell.style.textAlign = 'right';
    }
    const xTables = [...body.getElementsByTagNameNS(W_NS, 'tbl')];
    const dTables = [...root.querySelectorAll('section.docx > article table')];
    xTables.forEach((xt, i) => {
        const tblPr = [...xt.children].find((c) => c.localName === 'tblPr');
        const bv = tblPr && [...tblPr.children].find((c) => c.localName === 'bidiVisual');
        if (isOn(bv) && dTables[i]) dTables[i].style.direction = 'rtl';
    });
}

function boxesFor(section) {
    // Unbreakable vertical intervals (section-relative px): text line boxes,
    // images and whole table rows, so page cuts never slice through them.
    const base = section.getBoundingClientRect().top;
    const boxes = [];
    const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent.trim()) continue;
        if (node.parentElement.closest('tr')) continue;
        range.selectNodeContents(node);
        for (const r of range.getClientRects()) {
            if (r.height > 0) boxes.push([r.top - base, r.bottom - base]);
        }
    }
    section.querySelectorAll('img, svg, canvas, tr').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.height > 0) boxes.push([r.top - base, r.bottom - base]);
    });
    return boxes;
}

function hasContent(el) {
    return Boolean(el && (el.textContent.trim() || el.querySelector('img, svg, canvas')));
}

function computeSlices(section) {
    // Pages are cut from the body (article) only; the header and footer are drawn again on every page.
    const cs = getComputedStyle(section);
    const padTop = parseFloat(cs.paddingTop) || 0;
    const padBottom = parseFloat(cs.paddingBottom) || 0;
    const pageH = parseFloat(cs.minHeight) || section.offsetHeight;
    const base = section.getBoundingClientRect().top;
    const rel = (el) => { const r = el.getBoundingClientRect(); return { top: r.top - base, h: r.height }; };
    const article = section.querySelector(':scope > article');
    const header = section.querySelector(':scope > header');
    const footer = section.querySelector(':scope > footer');
    const contentStart = article ? rel(article).top : padTop;
    const contentEnd = article ? contentStart + rel(article).h : section.scrollHeight - padBottom;
    const usable = Math.max(100, pageH - padTop - padBottom);
    const boxes = boxesFor(section);
    const slices = [];
    let start = contentStart;
    while (start < contentEnd - 1 || !slices.length) {
        const limit = start + usable;
        if (limit >= contentEnd) { slices.push([start, Math.max(contentEnd, start + 1)]); break; }
        let cut = limit;
        // move the cut up until no box straddles it
        for (let guard = 0; guard < 500; guard += 1) {
            const hit = boxes.find(([t, bt]) => t < cut - 0.5 && bt > cut + 0.5);
            if (!hit) break;
            cut = hit[0];
        }
        if (cut <= start + 20) cut = limit; // a single box taller than a page: hard cut
        slices.push([start, cut]);
        start = cut;
    }
    return {
        pageH, padTop, padBottom, slices,
        header: hasContent(header) ? { top: 0, h: Math.max(padTop, rel(header).top + rel(header).h) } : null,
        footer: hasContent(footer) ? rel(footer) : null,
    };
}

function visualOrder(word) {
    const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? [...new Intl.Segmenter('ar', { granularity: 'grapheme' }).segment(word)].map((x) => x.segment) : Array.from(word);
    // keep runs of digits/Latin in their own order inside an RTL word
    const parts = [];
    for (const g of seg) {
        const ltr = /[0-9A-Za-z]/.test(g);
        const last = parts[parts.length - 1];
        if (last && last.ltr === ltr && ltr) last.s += g; else parts.push({ s: g, ltr });
    }
    return parts.reverse().map((p) => p.s).join('');
}

async function loadFonts(pdf) {
    const fontkit = (await import(FONTKIT_URL)).default;
    pdf.registerFontkit(fontkit);
    const [latin, arabic] = await Promise.all([FONT_LATIN_URL, FONT_ARABIC_URL].map(async (url) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error('font');
        const font = await pdf.embedFont(await res.arrayBuffer(), { subset: true });
        // The text layer is invisible, so skip shaping: one glyph per character
        // keeps copy/search exact (shaped Arabic glyphs map back to wrong letters).
        const fk = font.embedder?.font;
        if (fk && typeof fk.glyphForCodePoint === 'function') {
            fk.layout = (text) => {
                const glyphs = Array.from(text, (ch) => fk.glyphForCodePoint(ch.codePointAt(0)));
                return { glyphs, positions: glyphs.map((g) => ({ xAdvance: g.advanceWidth, yAdvance: 0, xOffset: 0, yOffset: 0 })) };
            };
        }
        return font;
    }));
    return { latin, arabic };
}

function wordsWithRects(container, sliceTop, sliceBottom, baseTop, offsetY) {
    // Collect words inside [sliceTop, sliceBottom) (section coordinates).
    const out = [];
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    const baseLeft = container.getBoundingClientRect().left;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent;
        const re = /\S+/g;
        let m;
        while ((m = re.exec(text))) {
            range.setStart(node, m.index);
            range.setEnd(node, m.index + m[0].length);
            const rects = range.getClientRects();
            if (!rects.length) continue;
            const r = rects[0];
            const top = r.top - baseTop;
            if (top < sliceTop - 1 || top >= sliceBottom - 1) continue;
            out.push({ text: m[0], x: r.left - baseLeft, y: top - sliceTop + offsetY, w: r.width, h: r.height });
        }
    }
    return out;
}

export async function wordToPdf(arrayBuffer, { onProgress } = {}) {
    const [docx, htmlToImage, pdfLib] = await Promise.all([
        import(DOCX_PREVIEW_URL), import(HTML_TO_IMAGE_URL), import(PDF_LIB_URL),
    ]);
    const host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:fixed;left:-20000px;top:0;width:auto;background:#fff;z-index:-1;';
    document.body.appendChild(host);
    try {
        const styleHost = document.createElement('div');
        const body = document.createElement('div');
        host.append(styleHost, body);
        await docx.renderAsync(arrayBuffer, body, styleHost, {
            inWrapper: false, breakPages: true, ignoreLastRenderedPageBreak: true,
            experimental: true, renderHeaders: true, renderFooters: true,
            useBase64URL: true, renderChanges: false, renderComments: false,
        });
        try {
            const zipMod = await import(JSZIP_URL);
            const JSZip = zipMod.default || zipMod;
            const zip = await JSZip.loadAsync(arrayBuffer);
            const docXml = await zip.file('word/document.xml')?.async('string');
            const stylesXml = await zip.file('word/styles.xml')?.async('string');
            if (docXml) applyBidi(docXml, body, stylesXml);
        } catch { /* keep the layout docx-preview produced */ }
        materializeListMarkers(body, styleHost);
        if (document.fonts?.ready) await document.fonts.ready;
        await Promise.all([...body.querySelectorAll('img')].map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; }))));
        const sections = [...body.querySelectorAll('section.docx')];
        if (!sections.length) throw new Error('empty');

        const { PDFDocument, rgb } = pdfLib;
        const pdf = await PDFDocument.create();
        let fonts = null;
        try { fonts = await loadFonts(pdf); } catch { fonts = null; }

        const plan = sections.map((s) => ({ s, ...computeSlices(s) }));
        const pageCount = plan.reduce((n, p) => n + p.slices.length, 0);
        let done = 0;
        for (const { s, pageH, padTop, padBottom, slices, header, footer } of plan) {
            const pageW = s.offsetWidth;
            for (let i = 0; i < slices.length; i += 1) {
                const [a, b] = slices[i];
                // Windows onto the rendered section: body slice, plus header and footer on every page.
                const windows = [{ src: a, end: b, dst: padTop }];
                if (header) windows.push({ src: 0, end: Math.min(header.h, padTop + 2), dst: 0 });
                if (footer) windows.push({ src: footer.top, end: footer.top + footer.h, dst: Math.max(pageH - padBottom, pageH - padBottom / 2 - footer.h / 2) });
                const sheet = document.createElement('div');
                sheet.style.cssText = `position:relative;width:${pageW}px;height:${pageH}px;overflow:hidden;background:#fff;`;
                const clones = [];
                for (const w of windows) {
                    const win = document.createElement('div');
                    win.style.cssText = `position:absolute;left:0;top:${w.dst}px;width:${pageW}px;height:${Math.max(1, w.end - w.src)}px;overflow:hidden;`;
                    const clone = s.cloneNode(true);
                    clone.style.margin = '0';
                    clone.style.position = 'absolute';
                    clone.style.left = '0';
                    clone.style.top = `${-w.src}px`;
                    clone.style.boxShadow = 'none';
                    win.appendChild(clone);
                    sheet.appendChild(win);
                    clones.push({ clone, w });
                }
                body.appendChild(sheet);
                const canvas = await htmlToImage.toCanvas(sheet, { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: false, skipFonts: true });
                const words = [];
                if (fonts) for (const { clone, w } of clones) words.push(...wordsWithRects(clone, w.src, w.end, clone.getBoundingClientRect().top, w.dst));
                sheet.remove();
                const jpg = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.9));
                const img = await pdf.embedJpg(await jpg.arrayBuffer());
                const wPt = pageW * PX_TO_PT; const hPt = pageH * PX_TO_PT;
                const page = pdf.addPage([wPt, hPt]);
                page.drawImage(img, { x: 0, y: 0, width: wPt, height: hPt });
                // Invisible text layer so the PDF stays searchable and copyable.
                for (const wd of words) {
                    const rtl = ARABIC_RE.test(wd.text);
                    const font = rtl ? fonts.arabic : fonts.latin;
                    // PDF readers rebuild reading order from glyph positions, so RTL words are drawn in visual order.
                    if (rtl) wd.text = visualOrder(wd.text);
                    try {
                        const unit = font.widthOfTextAtSize(wd.text, 1);
                        if (!unit) continue;
                        const size = Math.max(1, Math.min((wd.w * PX_TO_PT) / unit, wd.h * PX_TO_PT * 1.2));
                        page.drawText(wd.text, { x: wd.x * PX_TO_PT, y: hPt - (wd.y + wd.h * 0.8) * PX_TO_PT, size, font, opacity: 0 });
                    } catch { /* glyph not in font: skip this word in the text layer */ }
                }
                done += 1;
                onProgress?.(done, pageCount);
            }
        }
        return { bytes: await pdf.save(), pages: pageCount, textLayer: Boolean(fonts) };
    } finally {
        host.remove();
    }
}
