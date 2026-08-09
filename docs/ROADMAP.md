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

## دفعة الأداء والأمان (1 أغسطس 2026)

**تم تنفيذه (آمن، بدون مخاطرة):**
- [x] `Referrer-Policy: strict-origin-when-cross-origin` على كل صفحة
- [x] `Permissions-Policy` تعطيل كاميرا/ميكروفون/موقع جغرافي/دفع/USB (الموقع مش محتاجهم أصلًا)
- [x] `preconnect` لـ `cdn.jsdelivr.net` و`cdn.sheetjs.com` (المصدرين الوحيدين اللي بيتحمّل منهم مكتبات ديناميكيًا في الموقع كله)

**اتفحص ولقيت إنه مش محتاج تعديل:**
- **تحميل الخطوط:** الموقع بيستخدم `font-family: Inter, "Noto Sans Arabic", ...` كـ**stack نظام** بدون أي `@font-face` أو تحميل فعلي لخط ويب — يعني مفيش مشكلة أداء خطوط أصلًا، الموقع بيعتمد على خطوط النظام المتاحة. إضافة تحميل خط ويب حقيقي (Google Fonts مثلًا) هتزود وقت التحميل، مش تحسّنه.
- **Lazy loading للصور:** الموقع شبه خالي من الصور (تصميم نصوص/أيقونات)، الصورة الوحيدة (`result-preview`) مخفية افتراضيًا ومش بتظهر غير بعد معالجة فعلية، فمفيش فايدة حقيقية من `loading="lazy"` عليها.
- **Dynamic imports:** موجودة بالفعل من زمان — كل مكتبات PDF/فيديو/صوت/zip بتتحمّل بس وقت الحاجة الفعلية ليها، مش مع كل صفحة.

**❌ مؤجل عن قصد (خطورة حقيقية):**
- **CSP (Content-Security-Policy):** الموقع بيحمّل مكتبات من مصدرين CDN بس (`cdn.jsdelivr.net`, `cdn.sheetjs.com`) — ده قابل للتنفيذ فعليًا، بس **لازم يتظبط بحذر شديد** لأنه لو غلط هيوقف عشرات الأدوات **بصمت** (الصفحة تفتح عادي، بس أي أداة بتستخدم مكتبة خارجية هتفشل من غير رسالة خطأ واضحة). مفيش عندي متصفح حقيقي أقدر أتأكد بيه إن الـ CSP شغال صح قبل النشر. الطريقة الآمنة: تفعيله كـ**Report-Only** الأول (متاح كـ HTTP header على Vercel عبر `vercel.json`، مش متاح كـ meta tag) ومراقبة الأخطاء كام يوم قبل التفعيل الفعلي.
- **Trusted Types:** يحتاج مراجعة كل استخدام لـ `innerHTML` في الكود (موجود في أكتر من مكان زي عرض شجرة JSON وقوائم الملفات) واستبداله بطرق آمنة — إعادة هيكلة حقيقية، مش إضافة سطر.
- **SRI:** بيتطبق على `<script src>` عادي، لكن مكتبات الموقع بتتحمّل بـ `import()` ديناميكي مش `<script>` تقليدي، فـ SRI التقليدي مش منطبق بنفس الطريقة هنا.

## إصلاح: "أدوات ذات صلة" كانت مفقودة فعليًا رغم رسالة كوميت تقول إنها اتضافت (4 أغسطس 2026)

راجعت الكود مباشرة (مش بس رسائل الكوميتات) ولقيت إن `ea30d3e1` ("add FAQ schema + related tools") كان فيه push بالغلط لملف شبه فاضي، والاسترجاع اللي بعده (`c5d19911`) رجّع النسخة **القديمة** (من قبل الإضافة)، مش نسخة مُصلَّحة فيها الميزة فعليًا. يعني الميزة **ماكانتش موجودة خالص** في الموقع الحي رغم تاريخ الكوميتات.

**الإصلاح:**
- [x] **أدوات ذات صلة**: كل صفحة أداة دلوقتي بتعرض حتى 6 أدوات حقيقية من نفس الفئة (روابط فعلية، مش عامة)، مع `ItemList` schema لمحركات البحث.
- [ ] **FAQ schema**: لسه مؤجل عن قصد (نفس السبب الأصلي — محتاج أسئلة وأجوبة حقيقية لكل أداة، مش نص عام مولَّد).

**درس مهم:** رسالة الكوميت مش دليل كافٍ على إن الميزة موجودة فعليًا — أي مراجعة "هل ده اتعمل؟" لازم تتحقق من الكود نفسه، مش تاريخ الكوميتات بس.

**تحقق:** `npm run validate` (6/6 نجحوا)، فحص مباشر لصفحة `pdf-merge` أكّد وجود 6 أدوات ذات صلة حقيقية بروابط صحيحة.

## صفحات "أفضل أدوات X" و"بدائل Y" — أول دفعة (4 أغسطس 2026)

نوع صفحة جديد كليًا للموقع: صفحات محتوى مستقلة بمحتوى حقيقي مكتوب (مش قائمة أدوات بس) تستهدف نية بحث المقارنة/البدائل ("أفضل أدوات PDF مجانية"، "بدائل iLovePDF").

**الملفات الجديدة:**
- `src/product/definitions/roundup-content.js` — المحتوى الحقيقي (نص تعريفي + قائمة الأدوات المرتبطة) لكل صفحة، منفصل عن تعريفات الأدوات نفسها
- دالة `createRoundupPage()` في `generate-product-pages.mjs` — بتولّد الصفحات في `/best/{slug}/`

**6 صفحات أولى:**
1. `/best/best-free-pdf-tools/` — أفضل أدوات PDF مجانية
2. `/best/ilovepdf-alternative/` — بدائل iLovePDF
3. `/best/smallpdf-alternative/` — بدائل Smallpdf
4. `/best/tinypng-alternative/` — بدائل TinyPNG
5. `/best/best-free-video-tools/` — أفضل أدوات فيديو
6. `/best/free-developer-tools-online/` — أدوات مطورين مجانية

**قواعد المحتوى المتبعة:**
- مقارنة **عادلة وصادقة** مع المنافسين (iLovePDF/Smallpdf/TinyPNG منتجات حقيقية شغالة كويس، مش تشويه) — الفرق الحقيقي المذكور: معالجة محلية بدون حدود مقابل رفع للسيرفر وحدود يومية
- **إفصاح صريح عن القيود:** كل صفحة بتوضح متى الحل السيرفري المتخصص لسه أفضل (زي تحويل PDF معقد جدًا)، مش ادّعاء تفوق مطلق

**الربط الداخلي (مهم للـSEO، مش بس sitemap):**
- كل صفحة تصنيف (PDF، الصور، الفيديو، المطورين) فيها روابط لصفحات "أفضل/بدائل" المرتبطة بيها
- قسم جديد في الصفحة الرئيسية ("أدلة") بيعرض 4 من الصفحات الستة
- كل صفحة فيها `ItemList` schema للأدوات المذكورة، و`BreadcrumbList`

**⚠️ ملاحظة صيانة:** قسم "أدلة" في `index.html` مكتوب يدويًا (زي "أُضيفت مؤخرًا")، مش متولّد أوتوماتيك — أي صفحة جديدة تتضاف لـ`roundup-content.js` محتاجة إضافة يدوية في الصفحة الرئيسية لو عايزينها تظهر هناك.

**تحقق:** `npm run validate` (6/6)، فحصت فعليًا كل الصفحات الستة اتولّدت بمحتوى صحيح وروابط أدوات حقيقية، والربط من صفحات التصنيف والـsitemap.

## دفعة تانية من صفحات "أفضل/بدائل" (4 أغسطس 2026)

**4 صفحات إضافية** (المجموع دلوقتي 10):
7. `/best/best-free-audio-tools/` — أفضل أدوات صوت مجانية
8. `/best/free-text-tools-online/` — أدوات تنظيف نصوص
9. `/best/free-css-generator-tools/` — مولّدات CSS
10. `/best/free-health-calculators-online/` — حاسبات صحية (BMI، سعرات، ماكروز)

**تأكيد مهم:** روابط الاكتشاف من صفحات التصنيف (`categoryRoundups` filter) **تلقائية بالكامل** — أي صفحة جديدة تتضاف لـ`roundup-content.js` بفئة موجودة، هتظهر روابطها في صفحة التصنيف المطابقة من غير أي تعديل كود إضافي. اتأكد ده فعليًا لصفحات audio/text/color-css/health الجديدة.

**العدد الحالي:** 10 صفحات "أفضل/بدائل"، كلها في الـsitemap ومربوطة داخليًا.

## دفعة إصلاحات من ملاحظات اختبار حقيقي (4 أغسطس 2026)

صاحب المشروع جرّب الأدوات فعليًا وبعت ملاحظات مفصّلة. الحالة:

### ✅ اتصلح فعليًا
- **قص الفيديو (video-trimmer):** كان بياخد ثواني بس (رقم خام)، بقى ياخد صيغة `دقيقة:ثانية` (1:30) أو ثواني بس (90) أو `ساعة:دقيقة:ثانية`. اختبرت منطق التحليل (parsing) مباشرة بحالات حقيقية.
- **تغيير أبعاد الفيديو (video-resizer):** كان بيغيّر العرض بس (الطول تلقائي دايمًا). بقى فيه اختيار طول مستقل (تلقائي أو قيمة محددة).
- **العلامة المائية لـPDF (pdf-watermark):** كانت قطرية بس (زاوية ثابتة -35 درجة في الكود). بقى فيه اختيار (قطري/أفقي/رأسي).

### ⚠️ محتاج تفاصيل أكتر منك
- **ترقيم صفحات PDF فوق 6 صفحات:** راجعت كود `pdf-page-number-adder` بالكامل ومفيش حد أقصى مبرمج على 6 صفحات — الكود بيلف على كل الصفحات مهما كان عددها. **محتاج تفاصيل**: إيه اللي بيحصل بالظبط بعد الصفحة 6؟ (رسالة خطأ؟ الأرقام بتختفي؟ بتتكرر؟) ومعاها اسم الملف أو عدد صفحاته لو ممكن.

### 📋 طلبات مميزات جديدة (مؤجلة، محتاجة جلسة عمل منفصلة نظرًا لحجمها)
- **قاطع فيديو (Video Splitter)** — تقسيم فيديو لأجزاء، أداة جديدة كاملة
- **دمج صوت مع فيديو (Audio+Video merger)** — أداة جديدة كاملة
- **صيغ إضافية لاستخراج الصوت** (MP3 بجانب WAV الحالي)
- **توافق MPC Player مع فيديو بعد حذف الصوت** — يحتاج فحص الحاوية (container)/الترميز الناتج، الـWindows Media Player بيشتغل فمشكلة توافق محدد بـMPC مش عطل عام

### 🐌 الأداء (بطء الضغط/التحويل/تغيير الأبعاد)
هنا محتاج صراحة: أدوات الفيديو كلها بتشتغل بتقنية WebAssembly (ffmpeg.wasm) جوه المتصفح — قرار معماري اتخد بدري في المشروع عشان نتجنب رفع الفيديوهات لسيرفر (خصوصية + توفير تكلفة استضافة). **البطء ده جزء متأصل في الطريقة دي، مش bug قابل للإصلاح السريع** — أي حل حقيقي للسرعة يحتاج معالجة سيرفرية، وده قرار معماري كبير رجعنا عنه قبل كده لأسباب تكلفة ومخاطر (راجع قسم الـbackend في التاريخ). لو السرعة أولوية قصوى، محتاجين نقعد نناقش القرار ده من الأول.

**تحقق:** `npm run validate` (6/6) بعد كل التعديلات، فحص مباشر لمنطق تحليل الوقت الجديد بحالات حقيقية.

---

## Scope decision: expanding from the 2,300+ tool master catalogue (August 2026)

A candidate catalogue of **~2,300+ tools across 22 categories** (PDF, Images, Video, Audio,
Developer, Security/Encoding, Networking, SEO, Text, Calculators, Unit Converters, Social Media,
Office/Spreadsheet, Design, Database, Cloud/DevOps, E-commerce, Archive, plus a suggested Business
Suite add-on) is tracked at `docs/tools-master-database.txt` — the single source of truth for
names, Arabic labels, and slugs going forward.

Scope is split into four buckets so this stays aligned with the existing "no backend, no AI,
everything client-side" positioning:

- **Phase 1 — in scope now:** runs entirely client-side. Covers PDF, Images, Video (main list +
  Metadata + Batch, excluding AI Video Enhancement), Audio (Part 7, ~98 tools, excluding *Album
  Art Editor* and *Lyrics Editor* — see the audio note below), Developer, Security & Encoding
  (excluding live-lookup tools), Text/Document (excluding AI Text), Calculators, Unit Converters,
  Office/Spreadsheet, Design (excluding AI Design), Archive & Compression (excluding cloud/AI
  subsections).
- **Phase 2 — needs per-tool review:** SEO/Webmaster (meta-tag tools fine, crawling needs a live
  fetch → out for now) and Social Media (utilities fine, posting/scheduling needs platform APIs).
- **Phase 3 — deferred, backend/API required:** Networking (DNS/WHOIS/ping/port-scan need a server
  hop), Database (SQL/NoSQL tools need a live connection — note: the source catalogue has this
  section's SQL Conversion/Migration/Utilities duplicated; worth a cleanup pass whenever this
  category is picked up), Cloud & DevOps (provider API keys), E-commerce (marketplace API
  integrations), Archive's Cloud Archive subsection, and the enterprise add-ons (Backup & Recovery,
  Enterprise Storage, File System Tools).
- **Phase 4 — deferred, AI-powered:** every 🤖-tagged subsection across all categories (AI Video
  Enhancement, the whole of Audio AI/Part 8, AI Text, AI Content, AI Design, AI Commerce +
  Productivity Suite, AI Archive, AI-assisted SEO Crawling).
- **Phase 5 — future/strategic:** the catalogue's closing recommendation for a full Business Suite
  (HR, CRM, Accounting, Invoicing, Legal, PM, Marketing, Operations) as a paid-plan, backend-
  dependent expansion. Parked until Phases 1–3 are further along.

Data note: the source catalogue's part numbering jumps from Part 5 (Video) to Part 7 (Audio) —
Part 6 appears to be a gap (possibly a missing "Video Tools 101–200" section); worth confirming
if/when Video is revisited.

### PDF Tools (Part 1-2 of the master catalogue, 200 items) — full classification (August 2026)

Per the site owner's request: went through the full 200-item PDF section of
`docs/tools-master-database.txt` (not just checking for gaps as new ones came up), classified
every item by execution tier and against what's actually live, so future PDF work can be
picked in priority order without re-auditing from scratch. Cross-checked against the real
live tool list (not just catalogue-slug matching, since catalogue naming and shipped naming
often differ — e.g. the catalogue's `pdf-to-jpg`/`pdf-to-png`/`pdf-to-webp`/`pdf-to-gif` are all
one already-shipped generic `pdf-to-images-converter`).

**Already built (35 catalogue items covered)**: merge, split, compress,
PDF↔Word, PDF↔images (generic, covers jpg/png/webp/gif in both directions), PDF→TXT, page
extract/delete/rotate/reorder/reverse, page numbers, watermark, crop, page-size normalize,
password protect, sign (image placement), OCR (language-agnostic already, covers the
catalogue's separate Arabic/English/multi-language entries), text extraction, metadata removal,
blank-page removal, and the multi-op `pdf-workflow` (covers the catalogue's generic batch
converter concept).

**Quick wins — genuinely simple Tier A, not yet built (23 items, priority order
for the next PDF batch)**:
- `txt-to-pdf` ✅ **done (0.5.75)** — genuine bilingual support: `pdf-lib`'s built-in fonts can't
  encode Arabic at all and have no text-shaping engine even with a custom font, so text is
  rendered via a real `<canvas>` (the browser's native text engine already shapes Arabic
  correctly) and embedded as a page image, not native PDF text. Disclosed tradeoff: resulting
  text is not selectable/searchable. Reused the codebase's existing `renderTextPng` pattern from
  `pdf-editor-tools.js`, extended to full paragraph wrapping and pagination.
- `pdf-to-md` — PDF to Markdown (PDF إلى Markdown)
- `md-to-pdf` — Markdown to PDF (Markdown إلى PDF)
- `pdf-to-csv` — PDF to CSV (PDF إلى CSV)
- `csv-to-pdf` — CSV to PDF (CSV إلى PDF)
- `insert-blank-page` — Insert Blank Page (إضافة صفحة فارغة)
- `insert-image-pdf` — Insert Image into PDF (إضافة صورة إلى PDF)
- `insert-text-pdf` — Insert Text into PDF (إضافة نص)
- `pdf-header` — Add Header (إضافة Header)
- `pdf-footer` — Add Footer (إضافة Footer)
- `add-logo-pdf` — Add Logo (إضافة شعار)
- `add-background-pdf` — Add Background (إضافة خلفية)
- `pdf-a4` — Convert to A4 (تحويل إلى A4)
- `pdf-letter` — Convert to Letter (تحويل إلى Letter)
- `pdf-legal` — Convert to Legal (تحويل إلى Legal)
- `flatten-pdf` — Flatten PDF (تسطيح PDF)
- `extract-images-pdf` ✅ **done (0.5.73)** — walks every page's operator list via `pdfjs-dist`,
  extracts every embedded image, packages as PNGs in one ZIP. Verified byte-for-byte before
  shipping: a real embedded image's extracted raw pixel data matched an independent Python/Pillow
  read of the original source image exactly.
- `view-metadata-pdf` — View Metadata (عرض Metadata)
- `redact-pdf` — **investigated (0.5.73), deliberately NOT shipped, a real safety finding**:
  drawing a black box over PDF text (the obvious naive approach) does not remove the underlying
  text — independently confirmed with `pypdf` that "covered" text remains fully extractable via
  copy-paste underneath the visual overlay. This is the well-documented real-world PDF redaction
  failure mode behind actual sensitive-data leaks. Raised directly with the site owner rather than
  silently shipping a misleadingly-named cover-up tool or quietly renaming around the problem; the
  decision was to skip this entirely for now. **Genuine redaction (actually stripping the covered
  region's content stream, not just drawing over it) is a separate, meaningfully bigger task if
  revisited later — don't reuse the naive draw-a-box approach under the "redact" name.**
- `search-pdf` — Search in PDF (البحث داخل PDF)
- `grayscale-pdf` ✅ **done (0.5.76)** — renders each page via `pdfjs-dist`, converts to
  grayscale, rebuilds via `pdf-lib` (same architecture as `txt-to-pdf`). Verified at 3 independent
  layers before shipping: real colored PDF → confirmed color present after rendering → applied
  grayscale + rebuild → re-rendered the *output* with a third, unrelated library (PyMuPDF) and
  confirmed zero color saturation remained. Same disclosed tradeoff as `txt-to-pdf`: pages become
  images, original text no longer selectable/searchable.
- `bw-pdf` — Black & White PDF (تحويل لأسود وأبيض)
- `invert-pdf-colors` — Invert PDF Colors (عكس الألوان)

Note: several of these (`pdf-a4`/`pdf-letter`/`pdf-legal`, `insert-blank-page`,
`insert-image-pdf`, `add-logo-pdf`) are close enough to already-shipped tools
(`pdf-page-size-normalizer`, `pdf-sign`, `pdf-watermark`) that they may turn out to be presets
or minor variants rather than fully separate tools once actually scoped — run
`npm run list:tools` and re-check descriptions before building each one, same as every batch.

**Needs a real feasibility check before starting (27 items)** —
grouped because each needs its own investigation, not because they're all the same kind of
hard:
- `pdf-to-excel`/`csv`, `pdf-to-powerpoint`, `excel-to-pdf`, `powerpoint-to-pdf`, `docx-to-pdf`:
  need real table/slide/document-structure detection, not just text extraction — verify
  reliability on real messy documents before committing to shipping these.
- `repair-pdf`/`recover-pdf`: depends entirely on what `pdf-lib` can actually recover from a
  corrupt file in practice — test against genuinely corrupted real-world PDFs, not just a
  clean file, before assuming this works.
- `compare-pdf`: feasible in principle (extract text from both, reuse the existing `json-diff`-
  style line-diff approach) but needs a design decision on how to present differences when the
  two PDFs have different page counts or layouts, not just different text.
- `highlight-pdf`/`underline-pdf`/`strikeout-pdf`/sticky notes/draw/shapes annotations (10
  items): feasible using the same coordinate-based static-input pattern as `pdf-sign`, but each
  needs its own UX decision (typing exact x/y coordinates for a highlight box is a much worse
  experience than for a single signature placement) — worth prototyping one (`highlight-pdf`,
  probably the highest-demand of this group) before committing to the pattern for the rest.
- `extract-metadata-pdf`/`pdf-permissions`: likely genuinely easy (read-only or built into the
  existing `pdf-lib`/`pdf-encrypt-lite` APIs already in use) — probably reclassify as quick wins
  once actually checked, just not verified yet.
- `bookmark-pdf`/`edit-bookmarks-pdf`/`generate-pdf-toc`/`auto-toc-pdf`: `pdf-lib` supports
  outline/bookmark APIs in principle — needs direct verification the same way the 0.5.58/0.5.59
  PDF encryption claims were checked, given how wrong external documentation turned out to be
  there.
- `pdf-comment-viewer`/`presentation-pdf`: these are interactive *viewers*, not "upload → process
  → download" tools — likely a different UI paradigm than the current tool-page renderer
  supports, same class of question as the live-microphone and PDF-form gaps above.

**Hard removal operations, likely unreliable without real content-detection (4 items)**:
`remove-watermark-pdf` (Remove Watermark)
`remove-logo-pdf` (Remove Logo)
`remove-background-pdf` (Remove Background)
`remove-images-pdf` (Remove Images from PDF)
— *adding* a watermark/logo/background/image is trivial (place new content); *removing* an
existing one requires reliably detecting what to remove first, which is a fundamentally harder,
more error-prone problem without AI-assisted content detection. Not attempted for now rather
than shipping something that silently fails on real-world files.

**Not feasible with the current stack, confirmed directly (10 items)**:
- `unlock-pdf` (Unlock PDF) — pdf-lib cannot decrypt (verified 0.5.58)
- `decrypt-pdf` (Decrypt PDF) — pdf-lib cannot decrypt (verified 0.5.58)
- `remove-password-pdf` (Remove Password) — pdf-lib cannot decrypt (verified 0.5.58)
- `verify-pdf-signature` (Verify Signature) — needs real PKI/certificate-chain validation infrastructure
- `fill-pdf-form` (Fill PDF Form) — needs dynamic per-file UI (verified 0.5.60, architecture gap)
- `create-pdf-form` (Create PDF Form) — needs a form-building UI beyond static inputs
- `digital-signature-pdf` (Digital Signature Creator) — needs real PKI infrastructure for a legally-meaningful signature, distinct from pdf-sign's cosmetic image placement
- `pdf-certificate-viewer` (Certificate Viewer) — needs PKI infrastructure
- `pdf-certificate-validator` (Certificate Validator) — needs PKI infrastructure
- `remove-pdf-certificates` (Certificate Remover) — needs PKI infrastructure

**AI-dependent, deferred per the Tier system above (15 items)**: summarize,
explain, chat-with-PDF, table/form/invoice/resume/contract extraction, translation, Q&A, and
research-assistant style tools — all Tier C/D/E, need the backend+AI infrastructure decision
noted in the monetization strategy above, not attempted individually.

**Niche or low real-world priority (85 items)**: exotic format
conversions (TIFF/BMP/SVG/HTML/EPUB/MOBI/AZW3/RTF/ODT/XML/JSON ↔ PDF), font
extraction/embedding/subsetting, PDF/A/X/E/UA standards compliance and accessibility tooling,
print-layout tools (booklet, N-up, poster, book fold), color variants beyond grayscale/B&W/
invert (sepia, night mode, color reduction), embedded-file attachment tools, standalone
in-browser viewers, bookmark/comment import-export, and the 10-item "batch-X" wrapper family
(each just applies an already-shipped single-file tool to multiple files — real convenience
value, but lower priority than genuinely new capabilities). Available on request if any of
these turns out to matter more than expected; not worth pre-building blind.

### Image Tools (Part 3-4 of the master catalogue, 200 items) — full classification (August 2026)

Same treatment as the PDF classification above. Cross-checked against the real live tool
list, not just slug matching.

**Already built or covered as a variant/mode of an existing tool (40)**:
compress, resize (width/height/percentage all fold into the existing `image-resizer`), crop,
rotate/flip, the common format conversions (jpg/png/webp/bmp/gif, all via one generic
`image-format-converter`), watermark, brightness/contrast (via `image-color-adjuster`),
grayscale, sepia, EXIF removal, social-media platform presets (via
`social-media-image-resizer`), collage, color palette/average color extraction, and general
blur/pixelate (`photo-censor`, covers the catalogue's face-blur/face-pixelate as a general-
purpose tool rather than face-specific).

**Quick wins — genuinely simple Tier A (11 items) — ALL DONE (0.5.63)**:
- `text-watermark` ✅ shipped as `text-watermark`
- `view-exif` ✅ shipped as `view-exif` (using the new `piexifjs` dependency, verified with a real
  round trip against two independent tools before use)
- `edit-exif` ✅ shipped as `edit-exif`
- `grid-maker` ✅ shipped as `grid-maker`
- `contact-sheet` ✅ shipped as `image-contact-sheet` (renamed from the catalogue's plain
  `contact-sheet` to avoid confusion with the pre-existing, unrelated
  `video-contact-sheet-generator`)
- `photo-strip` ✅ shipped as `photo-strip`
- `image-slider` ✅ shipped as `image-slider`, but as a static labeled before/after composite
  image rather than a true interactive drag-slider — the tool-page renderer only supports static
  upload-then-download tools, the same UI-paradigm limit as the live-microphone and PDF-form gaps
- `dominant-color` ✅ shipped as `dominant-color`
- `image-size` ✅ shipped as `image-size`
- `compression-analysis` ✅ shipped as `compression-analysis`
- `image-validator` ✅ shipped as `image-validator`

Note: `view-exif`/`edit-exif` naturally absorb the catalogue's separate GPS/camera/lens/ISO/
shutter-speed/aperture-viewer entries (141, 144-149) as one combined metadata tool rather than
7 near-identical single-field viewers.

**Correction (found while starting the next batch)**: `heic-to-jpg` was miscategorized as "needs
investigation" in the 0.5.62 classification -- it was actually **already live** as
`heic-to-jpg-converter` in `document-media-tools.js`, using `heic2any` (a real, already-shipped
CDN dependency this whole time). `npm run list:tools -- heic` caught this immediately when
starting the next batch, exactly the workflow this tool exists for. Added `heic-to-png-converter`
right alongside it in the same file, reusing the exact same `loadHeic2Any()` helper rather than
introducing a second HEIC library. **Verification limitation, disclosed and accepted explicitly by
the site owner**: both `heic2any` and the newer `heic-to` library need real browser-only
`Worker`/`Blob`-URL APIs that don't exist in a plain Node sandbox -- confirmed by testing both
against a real HEIC file (downloaded from libheif's own repo, verified authentic via `file`,
independently decoded via ImageMagick/libheif as 1280x854 ground truth) and hitting a hard
`Worker is not defined` / `window is not defined` wall with no viable polyfill. This is the first
tool in this whole session shipped without the usual full independent-tool verification --
explicitly because `heic-to-jpg-converter` (using the identical `heic2any` engine) is already
proven live in production, and the site owner asked to ship `heic-to-png` and test it personally
in a real browser rather than block on a sandbox limitation. Worth remembering as a real
constraint for any future Worker-based library, not just this one.

**Needs a real feasibility check before starting (16 items after the correction below)**:
- `avif-to-jpg` ✅ shipped (0.5.65) as `avif-to-jpg-converter`. Researched before building:
  AVIF *decode* has been natively supported by every major browser engine since ~2020-2023
  (Chrome 85+, Firefox 93+, Safari 16.4+) via the standard `<img>`/`createImageBitmap` pipeline
  already used everywhere in this codebase's `decodeImage()` helper -- confirmed via multiple
  independent sources, and confirmed the existing `renderImage`/`decodeImage` functions have no
  format-specific gating that would block AVIF specifically. No new dependency needed.
  `jpg-to-avif` (the *encode* direction) deliberately NOT built alongside it: `canvas.toBlob`'s
  AVIF encode support is still genuinely inconsistent across browsers as of 2026 (solid in Chrome,
  gaps in Firefox/Safari per current sources) -- same "the two directions of a conversion pair
  aren't equally easy" lesson already applied to SVG-to-PNG/PNG-to-SVG below.
- `raw-to-jpg`/`raw-to-png`: real camera RAW formats need a genuine RAW decoder (not just a
  canvas trick) — a substantially bigger dependency than anything added so far.
- `svg-to-png`: likely genuinely easy (render SVG to canvas). `png-to-svg` (raster-to-vector
  tracing) is a fundamentally different, much harder problem — don't assume both directions are
  equally easy just because they're listed as a pair.
- `smart-crop`/`auto-rotate-image`/`auto-crop-image`/`perspective-correction`/`deskew-image`/
  `straighten-image` (6 items). **Update (0.5.67)**: checked each individually before building
  anything (per the process fix below). `auto-rotate-image` and `auto-crop-image` — **DONE**:
  neither is actually AI/"smart" despite the naming — auto-rotate reads the standard EXIF
  Orientation tag (reusing the already-integrated `piexifjs`), auto-crop scans inward from each
  edge for the content bounding box (pure pixel comparison against the corner color). Both
  verified with real test data before shipping. Still deliberately skipped: `smart-crop` (implies
  genuine saliency detection, likely AI-dependent), `perspective-correction` (needs a UX decision
  for specifying 4 corners), `deskew-image`/`straighten-image` (auto angle-detection is a
  meaningfully harder problem than the manual rotation that already exists).
- `histogram`/`sharpness-detector`/`blur-detector`/`noise-detector` (4 items) — **DONE (0.5.66)**:
  all pure canvas pixel-math, verified with real discriminating test data (a checkerboard vs. a
  flat image for sharpness/blur, a clean vs. randomly-perturbed image for noise) before shipping.
  While building these, caught and avoided a real `svg-to-png` duplicate (already existed as
  `svg-to-png-converter`, more feature-complete) — found via `npm run list:tools -- svg-to-png`
  called as its own separate query. **Note on `list-tool-ids.mjs` usage**: it does plain substring
  matching, not regex OR — a combined query like `"svg-to-png\|png-to-svg\|svg"` silently matches
  nothing (the literal backslash-pipes aren't a substring of any real tool name), which is exactly
  how this duplicate almost slipped through earlier in the same investigation. Always run one
  separate query per term, never combine terms with `\|` expecting OR semantics.

**Hard removal operations (4)**: `remove-watermark`, `remove-logo`,
`batch-remove-watermark`, `batch-remove-bg` — same reasoning as the PDF classification above:
reliably detecting existing content to remove is much harder than adding new content.

**AI-dependent, deferred (65 items — by far the largest bucket in this
category, unlike PDF)**: upscaling/sharpen/denoise/deblur/restore-old-photo/colorize (Tier E
image-model tools), all background removal/replacement (Tier E, the single most commonly-
requested image tool globally per the earlier competitor research, genuinely blocked on AI
infrastructure not being built yet), all object removal/inpainting/sky-replacement, essentially
every face-related tool (beautify, skin-smooth, face-swap, age progression, eye/hair color
changers — all need real ML face-detection/generation models), and the entire "image to
[art style]" family (anime/cartoon/sketch/Ghibli/Pixar/3D/style-transfer — all need real
diffusion or style-transfer models, not canvas filters). This is why Image, despite scoring only
6 explicit "AI "-prefixed catalogue entries, is actually far more AI-dependent than PDF's 13 —
most of Image's AI operations don't say "AI" in their name (`remove-background`, `face-swap`,
`anime-style`), unlike PDF's, which mostly do. Worth remembering when eyeballing a category's
AI-dependency from the explicit tag count alone.

**Niche or low real-world priority (62 items)**: individual color-adjustment
sliders already folded into `image-color-adjuster` (saturation/hue/temperature/exposure/gamma/
vibrance/color-balance), filter presets likely better as one filter-picker tool than 10 separate
pages (vintage/oil-painting/sketch/cartoon/anime/pixel-art/glass/neon/HDR/film — note several of
these overlap with the AI-dependent bucket above under different names), more platform-preset
variants (better added to the existing resizer's preset list than shipped as separate pages),
solid/gradient/studio/white/black background generators, circle/square crop shape variants,
TIFF conversions, more collage-style layouts, and the 6-item batch-wrapper family.

### Video Tools (Part 5, no fixed count due to the Part 6 numbering gap noted below) — in progress

Checked `npm run list:tools` broadly (both with and without a `video-` prefix, since image/PDF/
audio equivalents of several common operations already existed) before picking anything.

**Done**: `video-rotate` (90°/180°), `video-crop`, `video-merge` (silent output by design — see
the CHANGELOG 0.5.55 entry for why: concat fails outright if one input lacks an audio track, a
realistic case for arbitrary uploads), `video-watermark` (image overlay, 5 position presets),
`video-reverse` (0.5.74, verified with an unambiguous OCR-based test reading actual frame-number
text rather than an indirect pixel diff), `video-loop` (0.5.75, `-stream_loop`/`-c copy`, verified
duration math against real ffmpeg).
Every ffmpeg filter command was run against a real generated test video through the sandbox's
system ffmpeg binary before being written into a tool, including re-running the *exact* generated
command strings (not hand-retyped) end-to-end — catching the merge audio-mismatch failure this
way before it could reach production.

**Still open**: brightness/contrast adjustment, subtitle burn-in, and anything from the broader
catalogue once the Part 6 numbering gap (noted below) is resolved or worked around.

### Audio Tools (Part 7, ~98 tools) — in progress

Product decision: Adawaty's audio tools target **general audio** (voice notes, recordings,
podcasts, calls), not music production/curation — *Album Art Editor* and *Lyrics Editor* are
dropped from scope for that reason. The rest of Part 7 stays in scope, since editing/volume/
filter/metadata utilities are useful for any audio file regardless of whether it happens to be
music.

Build order follows technical dependency, not popularity — starting with what pure Web Audio API
can do, pushing anything needing an external codec/encoder library later:

1. **Editing + Volume** (`decodeAudioData` + `AudioBuffer`, WAV export, zero external deps) —
   **done**: Trim, Volume Adjust, Fade In/Out, Reverse, Cut, Split, Merge, Loop, Speed, plus
   Stereo→Mono and a full-format converter (via the existing in-browser ffmpeg engine, since that
   dependency was already shipped for video).
2. **Recording** (Voice Recorder, Mic Test, Level Meter, Waveform Viewer, Spectrum Analyzer,
   Silence/Noise Detector) — split by what today's architecture supports:
   - **Done, file-based** (fits the existing "upload → process → download" tool pattern with zero
     new infrastructure): Waveform Viewer (renders a PNG of the full waveform) and Silence/Noise
     Detector (reports silent stretches as text, detection-only, no file modification).
   - **Needs a live-microphone UI decision before starting**: Voice Recorder, Mic Test, and Level
     Meter all need `getUserMedia` + `MediaRecorder`/`AnalyserNode` driving a *live, interactive*
     UI (start/stop button, running timer, real-time meter) — the current tool-page renderer
     (`src/product/tool-page.js`) only supports static forms (`select`/`textarea`/`text`/`number`/
     `file`) submitted once to a `process()` call. There is no interactive-tool infrastructure
     yet anywhere in the product. Building these three needs that infrastructure decided and
     built first, not just three more tool definitions.
   - Spectrum/Frequency Analyzer deferred for a related but separate reason: a correct offline
     spectrogram needs either a manual FFT implementation or careful `OfflineAudioContext` +
     `AnalyserNode` frame-stepping, neither of which is worth rushing. Revisit once there's time to
     get it right rather than shipping something subtly wrong.
3. **Filters** (Equalizer, Bass/Treble Booster, Low/High/Band Pass, Noise Gate, Compressor,
   Limiter, Expander) — **done, core set**: `audio-equalizer` (bass/treble shelf filters),
   `audio-compressor-dynamics`, `audio-limiter`, `audio-noise-gate`. Implemented as pure
   sample-math (a manually written biquad filter using the RBJ Audio EQ Cookbook formulas, plus
   a downward-compressor algorithm) since real Web Audio filter nodes
   (`BiquadFilterNode`/`DynamicsCompressorNode`) don't exist in the Node test environment.
   Verified the equalizer is genuinely frequency-selective with real sine-wave signals (a 100Hz
   tone gets boosted, an 8000Hz tone is unaffected by the same bass-boost setting) before
   shipping. Still open from this wave: dedicated Low-Pass/High-Pass/Band-Pass filter tools and
   an Expander (the compressor/limiter/gate above cover the most commonly needed cases first).
4. **Metadata** (view/edit/remove tags, bitrate/codec/duration/channel/sample-rate viewers) —
   needs a small browser-side ID3/metadata parsing library. Not started.
5. **Conversion + Compression** (broader format coverage, bitrate reduction, WhatsApp/Telegram-
   optimized presets) — mostly covered already by the shipped `audio-format-converter`, which
   reuses the video ffmpeg.wasm engine (no new dependency needed). Bitrate-reduction presets still
   open.
6. **Utilities** (repair, recover, validate, batch versions) — thin wrappers around the tools
   above; comes last once the underlying single-file tools exist.

### Security & Encoding Tools (Part 10, 100 items) — in progress

Identified as the largest gap of any fully-in-scope category (only 10 live tools against 100
catalogue items before this section started, and every single item is pure client-side JS — no
AI, no backend, unlike most other large gaps in the catalogue).

**Already built before this section started**: `hash-generator` (MD5/SHA1/256/512),
`jwt-decoder`/`jwt-encoder`/`jwt-inspector`, `password-generator`, `uuid-generator`,
`base64-encoder-decoder`.

**Done (0.5.68)**: `hmac-generator`, `base32-encoder-decoder`, `crc32-calculator`,
`otp-generator` (TOTP), `pin-generator`. Every algorithm verified against an independent,
authoritative reference before shipping — Base32 matched Python's `base64.b32encode` byte-for-
byte, CRC32 matched both a known reference value and Python's `zlib.crc32`, and TOTP matched
**RFC 6238's own officially published test vector** exactly (the strongest verification standard
used this session — matching the spec's reference output, not just a self-consistent round trip).

**Done (0.5.69)**: `aes-encryption-tool` (combined encrypt/decrypt, AES-256-GCM +
PBKDF2-derived key from a password) — picked specifically for search demand ("encrypt text
online" carries real general-audience volume, unlike some niche remaining items). Verified two
ways: a full round trip correctly recovers plaintext and rejects a wrong password, and the raw
AES-256-GCM primitive was cross-checked byte-for-byte against Python's independent
`cryptography` library with identical fixed key/IV inputs.

**Done (0.5.70)**: `bcrypt-generator` (generate + verify modes, `bcryptjs` v3.0.3 loaded from its
UMD build specifically since the plain ESM entry unconditionally imports Node's `crypto` and
can't load in a browser). Verified bidirectional cross-compatibility with Python's independent
`bcrypt` package (hash with one, verify with the other, both directions, both correct-password
acceptance and wrong-password rejection). **Also surfaced and fixed a genuine gap in the test
harness itself**: this is the first *non-file* tool to dynamically `import()` a CDN module —
every earlier CDN-dependent tool needed a file input, which already excluded it from
auto-execution testing, so Node's inability to `import()` an `https:` URL (only `file:`/`data:`
are supported by the default loader) never surfaced before. Added `bcrypt-generator` to the
existing `browserOnlyTools` exclusion set in `tests/product/tool-user-journeys.integration.mjs`
with a comment explaining why — **relevant for any future CDN-dependent tool with no file input**,
not just this one.

**Done (0.5.71)**: `file-signature-viewer` — generalizes the magic-byte detection approach from
`image-validator` (0.5.63) to common file types broadly (images, audio, video, archives, PDF).
**Caught a real bug through testing with real files, not written from memory of the spec**: a
genuine HEIC test file was initially misidentified as an MP4 video, since HEIC/HEIF and MP4 share
the identical ISO-BMFF `ftyp` container structure and the file's actual brand string (`mif1`)
wasn't in the first version's narrower accepted-brand list. Fixed by widening to the full real
HEIF specification brand set and re-verifying against the same real file before shipping.

**Still open** (~82 items after the above): DES/3DES/RSA encrypt-decrypt and RSA/AES key
generation (Web Crypto supports AES-GCM/CBC and RSA-OAEP/PSS natively — verify the exact API
shape before building, same rigor as everything above, but no new dependency expected);
bcrypt/Argon2/scrypt password hashing (Web Crypto does *not* support these — would need a
dedicated library, a deliberate dependency decision like `piexifjs`/`pdf-encrypt-lite` before
this session's earlier tools); certificate/CSR/PEM/DER/PFX tooling (X.509 parsing — check for an
existing lightweight library rather than hand-rolling ASN.1 parsing); OAuth/OpenID token
tooling (mostly straightforward JWT-adjacent parsing, likely quick once scoped); file-signature/
magic-number/MIME detection (similar pattern to the already-shipped `image-validator`, likely a
genuine quick win); SSH key viewer/fingerprint (needs an SSH key format parser); PBKDF2 (Web
Crypto supports this natively via `deriveBits`, likely another quick win); a batch UUID/NanoID
generator (trivial, wraps the existing single-item generators); and a combined `security-toolkit`
landing page. No architecture blockers identified on most of these — same pattern as what
shipped, pick up whenever, **starting with `npm run list:tools` before writing any code, per the
0.5.67 timing correction above.**

### Developer Tools (Part 9, ~100 tools) — in progress

**Mandatory pre-check before writing any new tool (added 0.5.52, after two separate duplicate
incidents in 0.5.47 and 0.5.49 that a plain-text `grep` for `id: '...'` missed)**: run
`npm run list:tools` (optionally `npm run list:tools -- <keyword>` to filter), or directly
`node scripts/list-tool-ids.mjs <keyword>`. This imports every definitions module the same way
`tool-definitions.js` does and reads the real `id` + Arabic title off each tool object at
runtime — it can't miss a tool no matter which internal coding style its file happens to use.
This matters concretely: a plain grep for `id: '...'` never matches `web-transform-tools.js` or
`web-content-tools.js`, both of which pass the id as a *positional function argument*
(`tool('some-id', icon, title, ...)`) rather than an object key — exactly how the
`html-to-markdown-converter` collision in 0.5.51 slipped past a text search. Read the filtered
results for a similar id *or* title before concluding a catalogue item is genuinely missing —
exact-slug collisions and same-function-different-name duplicates have both happened before.

**Timing correction (0.5.67)**: the check has to run *before writing any tool code at all*, not
just before registering it in `tool-definitions.js`. The `svg-to-png` duplicate in 0.5.66 was
caught via this exact check, but only right before registration — its full implementation had
already been written by that point, real wasted effort even though nothing duplicate ever shipped.
Run the check as the literal first step, before creating a new file or writing a line of tool
logic, not as a final gate.

Checked existing coverage before adding anything: **13 of the 100 catalogue slugs already
existed** (`json-formatter`, `json-validator`, `json-minifier`, `xml-formatter`,
`html-beautifier`, `html-minifier`, `css-beautifier`, `css-minifier`, `regex-tester`,
`uuid-generator`, `ulid-generator`, `jwt-decoder`, `password-generator`), plus several more
catalogue items were already covered under different, arguably clearer slug names elsewhere in
the product (`base64-encoder-decoder`, `url-encoder-decoder`, `cron-expression-builder` +
`cron-expression-parser`, `unix-timestamp-converter`, `lorem-ipsum-generator`,
`regex-escape-tool`) — worth checking existing IDs broadly before assuming a catalogue slug is
missing, since the master catalogue's exact naming doesn't always match what already shipped.

**Done, first batch**: `json-diff` (recursive comparison, nested/array-aware), `json-to-csv` +
`csv-to-json` (quoted-value-safe conversion), and `css-gradient-generator`.

**Done, second batch**: `json-merge` (deep merge), `json-sort` (recursive key sort),
`json-string-escaper` (escape/unescape for embedding), `xml-minifier`, and `nanoid-generator`
(using `crypto.getRandomValues`).

**Done, third batch**: `jwt-encoder` (HS256 sign), `jwt-inspector` (decode + optional HS256
signature verification + expiry check, complementing rather than duplicating the existing
non-verifying `jwt-decoder`), `regex-generator` (common pattern presets), and
`api-key-generator` (styled test key, explicitly not a real credential). Verified
`crypto.subtle` HMAC works identically in the Node test harness and the browser before building
on it.

**Correction (0.5.47)**: two "CSS generators" and one "string generator" originally counted in
these batches (`css-box-shadow-generator`, `css-border-radius-generator`,
`random-string-generator`) turned out to already exist under the same id in `color-css.js` and
`data-developer.js` respectively. Because `tool-definitions.js` merges every definitions file via
object spread, the duplicate ids silently overwrote the original, already-shipped tools with no
error anywhere. Removed the duplicates and restored the originals as the live versions; net result
of the two batches is 9 new tools, not 12. Added a permanent test
(`tests/product/tool-id-uniqueness.integration.mjs`, now part of `npm run validate`) that imports
every definitions module directly and asserts no id is defined twice, so this exact bug class
can't recur silently again. **Lesson for future batches**: grep existing tool ids
(`grep -ohE "id: '[a-z0-9-]+'" src/product/definitions/*.js | sort | uniq -d`, filtering to ids
that also appear near a `category:` field) before picking "gaps" from the master catalogue --
several catalogue-sounding names already exist under the exact expected slug. Applied
successfully in batch 3 above.

**Correction (0.5.49)**: `json-to-csv`, `csv-to-json`, and `json-sort` from the batches above
turned out to functionally duplicate already-existing tools under different slugs
(`json-to-csv-converter`, `csv-to-json-converter`, `json-key-sorter` in `data-developer.js` and
`web-developer.js`) -- the exact-id uniqueness guard from the previous correction can't catch this
class of problem since the ids genuinely differ, only the functionality matches. Removed the 3
duplicates, keeping the originals live. Net result across batches 1-3 is 10 new tools, not 13.
**Expanded lesson**: an exact-id grep isn't sufficient on its own -- before building a tool, also
check for an existing one with the same core verb+noun in its description (`sort`/`sorter`,
`merge`/`combiner`, `-converter` suffix variants), not just a matching id string.

**Done, fourth batch**: `dummy-json-generator`, `dummy-csv-generator`, `dummy-sql-generator`
(shared realistic-looking fake-record generator, distinct from the existing `csv-to-sql-insert`
converter). Also discovered `css-clip-path-generator` and `html-entity-encoder-decoder` already
exist (likely added by an earlier unrelated PR) — removed from the open list below instead of
risking a fourth duplicate.

**Done, fifth batch**: `xml-to-json-converter` (recursive-descent parser, repeated tags become
arrays), `xml-validator` (Node-safe well-formedness check via tag-matching stack, not
`DOMParser`), and `css-prefixer` (vendor prefixes for known properties). **Process win**: the
id-uniqueness guard from 0.5.47 caught a real collision this batch (`html-to-markdown-converter`
already existed in `web-transform-tools.js`, more complete than mine since it also handles
images) before anything was pushed -- `npm run validate` failed immediately with a clear message,
the duplicate was removed, and the original stayed live. This is the guard working exactly as
designed.

**Done, sixth batch**: `javascript-formatter` (indentation-based, parens stay inline),
`guid-generator` (classic braced uppercase format, explicitly distinguished from `uuid-generator`
in its own copy), `xml-compare` (structural diff reusing the `xml-to-json-converter` parser +
the `json-diff` algorithm), `css-validator` (basic syntax check). First batch built entirely
using `npm run list:tools` as the mandatory first step — worked as intended, zero collisions.

**Still open** (roughly 45+ catalogue items after the above): JSON viewer/editor + JSON↔Excel
conversion; XML beautifier/pretty-printer (distinct from the existing `xml-formatter`), viewer,
editor, XPath tester, XSD validator (full schema validation is a large spec — worth scoping
carefully or deferring rather than a partial/misleading implementation); the full YAML tool set
(formatter, validator, beautifier, minifier, viewer, compare, merge, diff, YAML↔TOML) — still
completely untouched, needs a real parser (either a careful hand-written one or a CDN import like
the JSZip pattern already used elsewhere, worth a dedicated session rather than folding into a
mixed batch); HTML validator/preview; CSS formatter (distinct from the existing `css-beautifier`
— check whether these would actually differ before building); JS beautifier (distinct from the
new `javascript-formatter` — likely redundant, skip), JS obfuscator/deobfuscator, JS diff/compare;
and a combined `developer-toolkit` landing page. No architecture blockers on any of these — same
pattern as what shipped, pick up whenever, **always starting with `npm run list:tools`**.

---

## Pre-launch priority: cover the highest real-world search demand (August 2026)

Site owner is close to launching and asked specifically to prioritize the tools people actually
search for most, not just fill out the catalogue evenly. Checked the current category
distribution: Developer (132 tools, this session's recent focus) is proportionally large relative
to its typical per-tool search volume, while PDF (26) and Image (22-23) -- traditionally among
the highest-traffic categories for any general-purpose tool site -- are comparatively smaller.

**Done**: `bmi-calculator` (genuinely missing), plus un-retired `percentage-calculator`,
`discount-calculator`, and `tip-calculator` after researching real competitor-site patterns and
getting an explicit decision from the owner to reverse the 2026-07-30 retirement specifically for
these three (see CHANGELOG 0.5.57 for the full history and reasoning -- this was a deliberate,
surfaced decision, not something changed silently).

**Still open, next in priority order**: a focused audit of PDF and Image tools specifically for
gaps in the *highest*-demand basic operations (background removal is confirmed missing but is
AI-dependent -- Tier E, deferred per the monetization strategy above, not a near-term build;
currency conversion is confirmed missing but needs live exchange rates -- Tier B backend
dependency, also deferred). Worth checking things like PDF page numbering, PDF form filling, and
common image format/size presets (social media dimensions) specifically, since these are
high-volume, purely client-side-feasible operations that may already be covered under
differently-styled ids -- use `npm run list:tools` first, the same way as every batch above.

**Update (0.5.58) — PDF audit result**: checked password/protect/unlock/encrypt, pdf-to-excel,
pdf-sign, pdf-form, pdf-to-powerpoint -- all missing. **PDF protect/unlock specifically is NOT
safely buildable right now**: verified directly with a real qpdf-encrypted test file that
`pdf-lib` v1.17.1 (the exact version this project uses) does not actually decrypt with a supplied
password despite some external documentation claiming otherwise -- `PDFDocument.load(bytes,
{ password })` throws the same "encrypted" error regardless of whether the password is correct,
wrong, or absent. Adding real encrypt/decrypt support needs a small dedicated library (e.g.
`@pdfsmaller/pdf-encrypt-lite`, ~7KB, built specifically to pair with pdf-lib) -- a deliberate
new-dependency decision to make once, not something to slip into a routine batch.
**Update (0.5.60)**: `pdf-sign` shipped -- places a signature *image* on a chosen page/position,
a static-input-friendly solution to the same underlying need. `pdf-form` (auto-detecting and
filling a PDF's own form fields) investigated and found **architecturally infeasible right now**:
`pdf-lib`'s `getForm()` API genuinely works, but the tool-page renderer only supports a static,
pre-defined `inputs` array declared at tool-definition time -- there's no mechanism to generate
input fields dynamically based on an uploaded file's actual content (the specific fields a given
PDF happens to have). Same class of gap as the live-microphone audio tools noted in Wave 2 above:
a real infrastructure/UI-paradigm decision to make deliberately, not a routine tool to slip in.
`pdf-to-excel`/`pdf-to-powerpoint` remain open and unscoped.

**Update (0.5.59) — PDF protect resolved**: `pdf-protect` shipped, using a new dedicated
dependency (`@pdfsmaller/pdf-encrypt-lite`, ~7KB) added specifically to pair with `pdf-lib` for
real RC4-128 encryption, since `pdf-lib` alone can only encrypt structurally-empty placeholders,
not genuinely protect a file. Verified at every layer against independent tools (`qpdf`, `pypdf`)
before shipping, including the exact combined pipeline (`pdf-lib` normalize → `.save()` → encrypt)
end-to-end, not just each library in isolation. **`pdf-unlock` (removing an existing password)
remains unsolved** -- this new library only adds encryption, and `pdf-lib` still can't decrypt
(the 0.5.58 finding). A genuine decryption library would need the same rigor of direct
verification before being trusted, given how wrong the initial pdf-lib documentation claim
turned out to be.

**Update (0.5.58)**: `image-to-base64`, `base64-to-image`, and `social-media-image-resizer` (8
platform-preset dimensions, proper center "cover crop" so images are never stretched) shipped.

**Update (0.5.60)**: `meme-generator` shipped (classic top/bottom captions, real canvas
`measureText()` word wrapping). Confirmed `photo-censor` (blur/pixelate) already existed under a
name an earlier keyword search missed -- avoided duplicating it. Still open: passport/ID photo
maker (deliberately skipped -- proper passport photos usually imply background removal, the same
Tier E AI dependency noted above).

---

## Monetization & cost strategy: "Totally Free," ad-funded (August 2026)

Product decision, following a detailed cost/revenue analysis of the full ~2,300+ tool catalogue:
Adawaty stays **completely free for every user, on every tool, with no Pro tier and no paid
credits.** This is a deliberate competitive differentiator against other tool sites that gate
features behind a paywall. The site funds itself through ads, not subscriptions.

This works economically **only if** the backend cost per pageview stays reliably below ad revenue
per pageview — so the plan below exists specifically to keep it that way as the catalogue grows
into tools that aren't free to run.

### Why "totally free" doesn't mean "unlimited GPU for anyone"

Free for the user and free to operate are different things. The plan is: real users get the full
product with no paywall; behind the scenes, every tool is routed to the cheapest viable execution
method, and technical fair-use protections (rate limits, bot blocking, file size/duration caps,
caching) keep automated abuse from breaking the economics. A real user browsing and using tools
normally should never notice a limit exists.

### The six-tier cost classification (replaces plain "client-side vs not")

The existing Phase 1–5 scope split above (client-side now / needs review / deferred-backend /
deferred-AI / future business suite) remains the right lens for **what to build when**. This tier
system is a second, orthogonal lens for **what each tool costs to run once built** — every tool
eventually gets tagged with one of these:

| Tier | What it covers | Cost per use | Usage policy |
|---|---|---|---|
| 🟢 A — Browser only | Everything running 100% client-side today: PDF, Image, most Video/Audio editing, Text, Calculators, Unit Converters, Developer, most Office tools | ≈ $0 | Unlimited |
| 🔵 B — Simple backend | DNS/HTTP/SPF-DKIM-DMARC lookups, ping, redirect/webhook/API testers — things blocked by browser CORS that need a server hop but no AI | Near-zero | Unlimited / fair-use |
| 🟣 C — Cheap AI text | Summarize, rewrite, translate, SEO titles/descriptions, social captions, code explanation — one shared text-AI backend serving dozens of tools via prompt changes, not one API per tool | Very low | Free, with a daily quota |
| 🟡 D — Medium AI | OCR, Speech-to-Text/transcription, PDF Q&A, invoice/document extraction | Low–medium | Free, with a tighter quota |
| 🟠 E — Heavy AI image/audio | AI voice enhancement/noise removal, image generation/editing/upscaling | Medium | Small free daily allowance |
| 🔴 F — AI video / heavy GPU | Video upscaling/restoration, frame interpolation, talking avatars, lip sync, face swap | High — the one tier that can genuinely break the economics if left open | Small free allowance + strict technical fair-use limits, never marketed as "unlimited" |

**Everything currently shipped is Tier A.** This is exactly why the current build-out keeps
targeting 100% client-side tools: it's the only tier that's already free to build *and* free to
run, with zero new infrastructure or budget decisions needed. Tiers B–F all require backend
infrastructure that doesn't exist yet (a request-routing/rate-limiting layer, an AI provider
integration, abuse protection) — building any of them is a deliberate infrastructure decision to
make once, not something to slip in via "just one more tool."

### The economic target, once tiers B–F are built

Rule of thumb from the analysis: if actual ad RPM is ~$1.50 per 1,000 pageviews, the blended
AI+backend cost across those 1,000 pageviews needs to stay under ~$0.50–0.75 to leave a real
margin (not $1.40, which eats the revenue). Practical levers to hit that, in priority order:

1. Route every AI tool through the cheapest provider that does the job well enough (Groq/Gemini
   Flash-Lite/Workers AI before anything premium) — one shared engine per tier, not one paid API
   per tool.
2. Prefer in-browser execution (WASM/WebGPU) over a server call wherever the task allows it, even
   for tools that seem AI-like at first glance.
3. Hard daily quotas per tier, invisible to normal usage patterns, strict for Tier E/F specifically
   since that's the one place a single heavy request can cost more than thousands of text
   requests combined.
4. SEO-structured tool pages (short explainer → tool → instructions → FAQ → related tools) to lift
   pageviews-per-visitor, which lifts ad revenue without adding any processing cost — a visitor
   who uses 3 tools in one visit is 3 pageviews of ad revenue for the same one-time acquisition
   cost.
5. Delete uploaded files quickly (an hour or few) rather than storing them, so storage never
   becomes a real cost line.

This is planning math, not a guarantee — actual RPM depends heavily on audience geography (US/UK/
EU traffic is worth substantially more than average), which is part of why the product targets
bilingual Arabic/English content rather than Arabic-only.

### What this means for current priorities

No change to what's being built right now: **Tier A (100% client-side) tools remain the priority**,
category by category, exactly as the Phase 1 list above lays out. Tiers B–F are recorded here as
a real, planned part of the product's future — not forgotten, not blocked on a decision that has
to happen today — but they need a dedicated infrastructure/budget conversation before the first
one gets built, so that conversation doesn't get skipped by momentum once an AI tool "seems easy
to just add."
