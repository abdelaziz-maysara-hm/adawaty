# خارطة طريق الأدوات (Tools Roadmap)

هدف المشروع: أشمل موقع أدوات مجانية بيدعم العربي بالكامل — بنفس روح مواقع الـ all-in-one (مثل 10015.io و iLovePDF و SmallSEOTools) مع ميزة أساسية: **كل شيء يعمل داخل المتصفح** بدون رفع ملفات لسيرفر.

**قاعدة الاختيار:** أداة تتضاف هنا لو (أ) عليها طلب بحث حقيقي، و(ب) ممكن تتنفذ بجودة حقيقية 100% داخل المتصفح.

**سياسة المنتج (0.5.39+):** لا أدوات backend في الكتالوج العام. أي مسار سيرفر سابق (مثل PDF→Word Pro / pdf2docx) **متوقف ومُزال** إلى أن يتوفر stack مستقر + disclosure واضح. الهدف الحالي = ثقة المستخدم وخصوصية كاملة.

آخر تحديث: **0.5.40** — `image-average-color-picker` (يوليو 2026).

---

## أولويات البنية وتجربة المستخدم

- [x] إثراء صفحة `/all-tools/` ببحث فوري + فلاتر تصنيفات + tags (processing / calculator) — موجودة بالفعل في catalogue-page.js
- [x] واجهة تقدم موحدة (شريط متحرك) لكل الأدوات — غير محدد (indeterminate) حاليًا؛ نسبة حقيقية لـ ffmpeg مؤجلة (محتاجة تعديل كل موقع استدعاء)
- [x] رسائل خطأ أوضح: حالة بصرية مميزة (لون أحمر) + رسالة عامة ثنائية اللغة لأي خطأ تقني غير مترجم، مع إبقاء رسائل الأدوات المخصصة كما هي
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
- [x] `pdf-page-crop`
- [x] `pdf-blank-page-remover`
- [x] `pdf-scanned-look` (محاكاة مسح ضوئي — شائع على 10015)
- [ ] `pdf-password-protector` / `pdf-password-remover` — مؤجل (pdf-lib لا يدعم encryption حاليًا)

### Image (فجوات 10015-style)
- [x] `image-average-color-picker` / dominant color ✅ (0.5.40)
- [x] `image-color-extractor` (لوحة ألوان من صورة)
- [ ] `image-color-picker` (eyedropper تفاعلي)
- [x] `photo-censor` (blur / pixelate على كامل الصورة؛ منطقة محددة مؤجلة)
- [x] `svg-blob-generator`
- [x] `svg-pattern-generator`

### Text & productivity
- [x] `bionic-reading-converter`
- [x] `text-to-handwriting` (رسم على canvas → PDF/PNG)
- [x] مغطاة بالفعل عبر `whitespace-cleaner`

### Developer / CSS generators (طلب عالي جدًا على 10015)
- [x] `cron-expression-parser`
- [x] `json-schema-validator`
- [x] `jwt-decoder` — موجود بالفعل في الكتالوج
- [x] `css-loader-generator`
- [x] `css-glassmorphism-generator`
- [x] `css-clip-path-generator`
- [x] `css-box-shadow-generator` — موجود بالفعل
- [x] مغطاة بالفعل عبر `css-linear-gradient-generator`
- [x] `code-to-image` (snippet → PNG)
- [x] `url-slug-generator`

### Data
- [ ] `xml-xsd-validator`

---

## المرحلة 2 — مفيدة، قد تحتاج CDN إضافية خفيفة

- [x] `word-to-pdf-converter` — يدعم النص اللاتيني فقط حاليًا (mammoth.js + pdf-lib)؛ العربي مؤجل لحد ما نلاقي حل خط Unicode موثوق
- [ ] `image-svg-tracer`
- [x] `json-tree-viewer` (نسخة أساسية: عرض شجري نصي، بدون طي/فرد تفاعلي)

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

## إعلانات Google AdSense (1 أغسطس 2026)

كود AdSense مضاف في `<head>` كل صفحة في الموقع، عبر مصدرين:
1. **الصفحات المولَّدة تلقائيًا** (كل أدوات/فئات/all-tools): الكود مضاف داخل `scripts/generate-product-pages.mjs` نفسه (في القالبين)، فأي صفحة جديدة تتولّد بـ `npm run generate:product` هتاخده تلقائيًا — مفيش داعي تتذكره يدويًا.
2. **الصفحات اليدوية** (`index.html`, `404.html`, `tools/visual-pdf-editor/index.html`): مضاف يدويًا، ولازم يتضاف يدويًا لأي صفحة يدوية جديدة تتعمل مستقبلًا (أي صفحة برة نظام التوليد).

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7919896989773628" crossorigin="anonymous"></script>
```

للتحقق السريع:
```bash
find . -name "*.html" -not -path "./node_modules/*" | xargs grep -L "adsbygoogle.js"
```
لو رجّع أي أسماء ملفات، دي صفحات ناقصة الكود.

**⚠️ لو ضفت أداة جديدة تمامًا برة نظام `generate-product-pages.mjs` (صفحة يدوية مخصصة زي visual-pdf-editor)، لازم تضيف الكود ده يدويًا في `<head>`.**

## دفعة SEO (1 أغسطس 2026)

تمت إضافة (على كل الصفحات المولَّدة تلقائيًا + الصفحات اليدوية):
- ✅ ترقية الـ schema من `WebApplication` إلى `SoftwareApplication` (النوع الموصى به من جوجل)
- ✅ `BreadcrumbList` schema لكل صفحة أداة وفئة
- ✅ `hreflang` (ar/en/x-default) — ملاحظة: كلها بترجع لنفس الرابط لأن الموقع بيبدّل اللغة بالـ JS مش بروابط منفصلة؛ فصل حقيقي للغتين برابطين مختلفين لسه قرار معماري مؤجل
- ✅ Twitter Card + `og:locale` على كل الصفحات

**اتأجل عن قصد:**
- ❌ **FAQ schema:** يحتاج محتوى أسئلة وأجوبة حقيقي لكل أداة، مش نص عام مولَّد تلقائيًا (جوجل بيعاقب المحتوى الضعيف المتكرر) — مهمة محتوى منفصلة، مش كود
- ❌ **Sitemap index / تقسيم الـ sitemap:** غير ضروري حاليًا (455 أداة فقط، بعيد جدًا عن حد جوجل الفعلي وهو 50,000 رابط لكل sitemap) — تنفيذه دلوقتي هيضيف تعقيد بدون فايدة حقيقية

## دفعة الصفحة الرئيسية (1 أغسطس 2026)

- [x] **الأدوات اللي استخدمتها مؤخرًا** — قسم شخصي حقيقي (localStorage في متصفح الزائر بس، مفيش بيانات بترفع لأي مكان)، بيظهر بس لو فيه سجل استخدام فعلي، مبني على `src/product/usage-tracking.js`
- [x] **أُضيفت مؤخرًا** — قائمة حقيقية لآخر 6 أدوات اتضافت فعلًا (مش عشوائية)
- [x] **Analytics readiness hooks** — دالة `trackEvent()` عامة بتبعت CustomEvents، بدون أي مكتبة تحليلات خارجية، جاهزة لو حبينا نوصلها بخدمة تحليلات حقيقية لاحقًا
- **❌ رفضت عن قصد:** قسم "Trending/الأكثر رواجًا" — الموقع static بالكامل ومفيش تتبع حقيقي عبر كل الزوار، وأي رقم هنعرضه هيبقى مُلفّق يوهم الزوار بشعبية مش حقيقية. ده تضليل، مش تحسين.

**ملاحظة أداء مهمة:** أول تنفيذ ليّا كان هيستورد محرك `tool-definitions.js` كامل (1.1 ميجا) على الصفحة الرئيسية بس عشان يجيب أسماء 6 أدوات — ده كان هيبطّئ تحميل الصفحة الرئيسية لكل زائر عشان ميزة شخصية بيستخدمها بعض الزوار بس. صلّحتها: المولّد (`generate-product-pages.mjs`) دلوقتي بيطلع ملف بيانات خفيف منفصل (`src/data/tool-index.json`, 64 كيلوبايت بس) للأسماء/الأيقونات فقط، بدون أي كود معالجة.
