# خارطة طريق الأدوات (Tools Roadmap)

هدف المشروع: أشمل موقع أدوات مجانية بيدعم العربي بالكامل — بنفس روح مواقع الـ all-in-one (مثل 10015.io و iLovePDF و SmallSEOTools) مع ميزة أساسية: **كل شيء يعمل داخل المتصفح** بدون رفع ملفات لسيرفر.

**قاعدة الاختيار:** أداة تتضاف هنا لو (أ) عليها طلب بحث حقيقي، و(ب) ممكن تتنفذ بجودة حقيقية 100% داخل المتصفح.

**سياسة المنتج (0.5.39+):** لا أدوات backend في الكتالوج العام. أي مسار سيرفر سابق (مثل PDF→Word Pro / pdf2docx) **متوقف ومُزال** إلى أن يتوفر stack مستقر + disclosure واضح. الهدف الحالي = ثقة المستخدم وخصوصية كاملة.

آخر تحديث: **0.5.40** — `image-average-color-picker` (يوليو 2026).

---

## أولويات البنية وتجربة المستخدم

- [ ] إثراء صفحة `/all-tools/` ببحث فوري + فلاتر تصنيفات + tags (processing / calculator)
- [ ] واجهة تقدم (progress) موحدة لأدوات FFmpeg و OCR و PDF/صور الكبيرة
- [ ] رسائل خطأ و empty states ثنائية اللغة أوضح
- [ ] Service Worker بسيط / PWA للأدوات الشائعة
- [ ] تحسين بحث الصفحة الرئيسية باقتراحات فورية

---

## مصفوفة التحويل الشاملة (Conversion Matrix)

### Audio — all-to-all (محلي عبر ffmpeg.wasm)
| المدخلات | المخرجات |
|----------|----------|
| MP3, WAV, OGG, M4A, AAC, FLAC, Opus, WebM | نفس الصيغ |

- [x] `audio-format-converter` ✅
- [x] قص / مستوى صوت / fade / stereo→mono ✅

### Video — all-to-all الشائع (محلي عبر ffmpeg.wasm)
| المدخلات | المخرجات |
|----------|----------|
| MP4, WebM, MOV, AVI, MKV | MP4, WebM, MKV, AVI, MOV, GIF |

- [x] `video-format-converter` ✅
- [x] trim / compress / mute / resize / speed / to-GIF ✅

### Image — all-to-all الشائع (canvas + heic2any)
| المدخلات | المخرجات |
|----------|----------|
| JPG, PNG, WebP, GIF, BMP, HEIC | JPG, PNG, WebP, GIF, BMP |

- [x] `image-format-converter` ✅
- [x] HEIC→JPG ✅
- [ ] AVIF — مؤجل (دعم المتصفح)
- [ ] PNG→SVG tracer

### PDF ↔ Documents (client-side only)
| التحويل | الحالة | ملاحظات |
|---------|--------|---------|
| PDF → Word (محلي) | ✅ | فقرات + عناوين |
| PDF → Word Pro (سيرفر) | ❌ مُزال | كان غير مستقر؛ يُعاد لاحقًا فقط بعد استقرار السيرفر |
| PDF → صور / صور → PDF | ✅ | |
| PDF merge / split / rotate / compress | ✅ | |
| Word → PDF | [ ] | جودة محدودة محليًا |
| Excel ↔ CSV | ✅ | SheetJS |

---

## المرحلة 1 — سهلة، طلب عالي، client-side فقط

### PDF (فجوات iLovePDF-style)
- [ ] `pdf-page-crop`
- [ ] `pdf-blank-page-remover`
- [ ] `pdf-scanned-look` (محاكاة مسح ضوئي — شائع على 10015)
- [ ] `pdf-password-protector` / `pdf-password-remover` — مؤجل (pdf-lib لا يدعم encryption حاليًا)

### Image (فجوات 10015-style)
- [x] `image-average-color-picker` / dominant color ✅ (0.5.40)
- [ ] `image-color-extractor` (لوحة ألوان أغنى / تصدير CSS)
- [ ] `image-color-picker` (eyedropper تفاعلي)
- [ ] `photo-censor` (blur / pixelate / bar)
- [ ] `svg-blob-generator`
- [ ] `svg-pattern-generator`

### Text & productivity
- [ ] `bionic-reading-converter`
- [ ] `text-to-handwriting` (رسم على canvas → PDF/PNG)
- [ ] `multiple-whitespace-remover` (إن لم يكن موجودًا بقوة كافية)

### Developer / CSS generators (طلب عالي جدًا على 10015)
- [ ] `cron-expression-parser`
- [ ] `json-schema-validator`
- [ ] `jwt-decoder` (decode فقط — موجود جزئيًا في الكتالوج؛ مراجعة تغطية)
- [ ] `css-loader-generator`
- [ ] `css-glassmorphism-generator`
- [ ] `css-clip-path-generator`
- [ ] `css-box-shadow-generator` (موجود أساسيًا)
- [ ] `css-gradient-generator` (موجود أساسيًا)
- [ ] `code-to-image` (snippet → PNG)
- [ ] `url-slug-generator`

### Data
- [ ] `xml-xsd-validator`

---

## المرحلة 2 — مفيدة، قد تحتاج CDN إضافية خفيفة

- [ ] `word-to-pdf-converter` (جودة محدودة مقبولة مع إفصاح)
- [ ] `image-svg-tracer`
- [ ] `json-tree-viewer` تفاعلي أقوى

---

## المرحلة 3 — سيرفر / AI (متوقفة حاليًا)

**الحالة:** لا تُنشر في الكتالوج العام.

مرشّح لاحقًا فقط بعد:
1. دومين واستضافة مستقرة
2. حدود حجم و rate limit
3. disclosure واضح («الملف يُرفع مؤقتًا»)

قائمة مؤجلة:
- PDF → Word عالي الدقة (جداول/صور)
- Word → PDF عالي الدقة
- PDF → PPTX / XLSX
- Background remover
- AI image upscaler
- Speech-to-text
- Plagiarism / paraphrase (AI)

---

## مصادر المنافسة (للجلسات الجاية — واحد واحد)

1. **iLovePDF / Smallpdf** — تنظيم/ضغط/تحويل PDF
2. **10015.io** — generators (CSS, text, image utilities)
3. **CloudConvert / Zamzar** — مصفوفة الصيغ (نغطيها محليًا حيث أمكن)
4. **TinyPNG-style** — ضغط صور (موجود جزئيًا؛ تحسين الجودة)
5. **DevToys / web developer kits** — encode/decode, JWT, formatters

كل جلسة: نختار بندًا واحدًا من المرحلة 1 أو UX، ننفّذ client-side، نحدّث ✅ هنا + CHANGELOG، ثم:

```bash
npm run generate:product && npm run validate
```

راجع [CONTRIBUTING.md](../CONTRIBUTING.md).
