# خارطة طريق الأدوات (Tools Roadmap)

هدف المشروع: أشمل موقع أدوات مجانية بيدعم العربي بالكامل. الملف ده قائمة عمل مبنية على تحليل فعلي لأكبر مواقع الأدوات العالمية (iLovePDF, CloudConvert, TinyPNG, DevToys Web, Smallpdf, remove.bg...) مقارنة بالأدوات الموجودة عندنا دلوقتي، عشان كل جلسة شغل جاية تكمل من هنا مباشرة من غير ما نعيد البحث.

**قاعدة الاختيار:** أداة تتضاف هنا لو (أ) عليها طلب بحث حقيقي، و(ب) ممكن تتنفذ بجودة حقيقية 100% داخل المتصفح (زي باقي الموقع، بدون سيرفر). أدوات محتاجة سيرفر/AI models تقيلة اتحطت في قسم منفصل آخر الملف.

آخر تحديث: **0.5.38** — Documentation + MIT + CONTRIBUTING + أولويات UX (يوليو 2026).

---

## أولويات البنية وتجربة المستخدم (من تحليل 0.5.38)

هذه ليست أدوات جديدة، لكنها تحسّن الاكتشاف والاستقرار للجميع:

- [ ] إثراء صفحة `/all-tools/` ببحث فوري + فلاتر تصنيفات + tags (processing / calculator)
- [ ] واجهة تقدم (progress) موحدة لأدوات FFmpeg و OCR و PDF/صور الكبيرة
- [ ] رسائل خطأ و empty states ثنائية اللغة أوضح
- [ ] Service Worker بسيط / PWA للأدوات الشائعة (اختياري offline)
- [ ] تحسين بحث الصفحة الرئيسية باقتراحات فورية

---

## مصفوفة التحويل الشاملة (Conversion Matrix) — الأولوية الحالية

هدف المنافسة مع CloudConvert / iLovePDF / Zamzar على مستوى الصيغ الشائعة:

### Audio — all-to-all (محلي عبر ffmpeg.wasm)
| المدخلات | المخرجات |
|----------|----------|
| MP3, WAV, OGG, M4A, AAC, FLAC, Opus, WebM | MP3, WAV, OGG, M4A, AAC, FLAC, Opus, WebM |

- [x] `audio-format-converter` — منفّذة ✅ (Batch 29) + صفحة منشورة (Batch 30)
- [x] قص / مستوى صوت / fade / stereo→mono — موجودة ✅

### Video — all-to-all الشائع (محلي عبر ffmpeg.wasm)
| المدخلات | المخرجات |
|----------|----------|
| MP4, WebM, MOV, AVI, MKV | MP4, WebM, MKV, AVI, MOV, GIF |

- [x] `video-format-converter` موسّع ✅ (Batch 29)
- [x] trim / compress / mute / resize / speed / to-GIF — موجودة ✅

### Image — all-to-all الشائع (canvas + heic2any)
| المدخلات | المخرجات |
|----------|----------|
| JPG, PNG, WebP, GIF, BMP, HEIC | JPG, PNG, WebP, GIF, BMP |

- [x] `image-format-converter` موسّع ✅ (Batch 29)
- [x] HEIC→JPG — موجودة ✅
- [ ] AVIF (إدخال/إخراج) — دعم المتصفح محدود؛ مؤجل
- [ ] SVG→PNG (موجود كأداة منفصلة) / PNG→SVG tracer

### PDF ↔ Documents
| التحويل | الحالة | ملاحظات |
|---------|--------|---------|
| PDF → Word (محلي) | ✅ | فقرات + عناوين |
| PDF → Word Pro (سيرفر pdf2docx) | ✅ | جداول/صور أفضل |
| PDF → صور / صور → PDF | ✅ | |
| PDF merge / split / rotate / compress | ✅ | |
| Word → PDF | [ ] | يحتاج مكتبة docx→pdf أو طباعة؛ جودة محدودة |
| PDF → PowerPoint / Excel | [ ] | سيرفر غالبًا |
| Excel ↔ CSV | ✅ | SheetJS CDN — Batch 30 |

### Documents / Data
- [x] `csv-to-excel-converter` ✅ (Batch 30)
- [x] `excel-to-csv-converter` ✅ (Batch 30)
- [ ] `word-to-pdf-converter` (عميل أو سيرفر)
- [x] JSON/CSV/XML/Markdown conversions — موجودة في data-format tools

---

## المرحلة 1 — سهلة التنفيذ، طلب بحث عالي، بدون مكتبات جديدة أو بمكتبة CDN بسيطة

### Developer / Website tools
- [x] `hash-generator`
- [ ] `cron-expression-parser`
- [x] `iban-validator`
- [ ] `json-schema-validator`
- [ ] `xml-xsd-validator`
- [x] `semver-calculator` / `semver-comparator`
- [x] `ulid-generator`
- [x] `base58-encoder-decoder`
- [x] `curl-command-generator`
- [x] `color-blindness-simulator`
- [x] `css-beautifier`

### PDF
- [ ] `pdf-password-protector` / `pdf-password-remover` — pdf-lib لا يدعم encryption حاليًا
- [ ] `pdf-page-crop`
- [ ] `pdf-blank-page-remover`

### Image
- [x] `svg-to-png-converter`
- [x] `webp` / `png` / `jpg` / `gif` / `bmp` عبر `image-format-converter`
- [ ] `image-average-color-picker`

---

## المرحلة 2 — طلب بحث عالي جدًا، محتاجة مكتبة CDN إضافية

- [x] `audio-format-converter` ✅
- [ ] `word-to-pdf-converter`
- [x] `pdf-to-word-converter` (محلي + Pro سيرفر)
- [x] `csv-to-excel-converter` / `excel-to-csv-converter` ✅
- [ ] `image-svg-tracer`

---

## المرحلة 3 — سيرفر / نموذج ذكاء اصطناعي

موجود حاليًا على Vercel:
- [x] `pdf-to-word-pro-converter` (pdf2docx)

مرشّح لاحقًا (بعد الدومين الحقيقي):
- Word → PDF عالي الدقة
- PDF → PPTX / XLSX
- Background remover احترافي
- AI image upscaler
- Speech-to-text

**قرار:** السيرفر معزول في `server-tools.js` فقط مع disclosure واضح. باقي الأدوات تبقى client-side.

---

## أفكار مؤجلة
- CAD/vector متخصص
- e-signature قانوني
- AVIF واسع الدعم

---

## طريقة العمل مع الملف ده
كل جلسة: نختار من مصفوفة التحويل أو المرحلة 1 أو أولويات UX أعلاه، ننفّذ، نحدّث ✅ هنا، نحدّث CHANGELOG، ثم `npm run generate:product` + `npm run validate` ثم commit + push.

راجع أيضًا [CONTRIBUTING.md](../CONTRIBUTING.md).
