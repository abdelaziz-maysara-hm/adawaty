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
   Limiter, Expander) — native `BiquadFilterNode`/`DynamicsCompressorNode` graphs. Not started.
4. **Metadata** (view/edit/remove tags, bitrate/codec/duration/channel/sample-rate viewers) —
   needs a small browser-side ID3/metadata parsing library. Not started.
5. **Conversion + Compression** (broader format coverage, bitrate reduction, WhatsApp/Telegram-
   optimized presets) — mostly covered already by the shipped `audio-format-converter`, which
   reuses the video ffmpeg.wasm engine (no new dependency needed). Bitrate-reduction presets still
   open.
6. **Utilities** (repair, recover, validate, batch versions) — thin wrappers around the tools
   above; comes last once the underlying single-file tools exist.

### Developer Tools (Part 9, ~100 tools) — in progress

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
several catalogue-sounding names already exist under the exact expected slug.

**Still open** (roughly 65+ catalogue items after the above): JSON viewer/editor +
JSON↔XML/YAML/Excel conversions; the rest of the XML tool set (validator, beautifier, viewer,
editor, compare/diff, XPath tester, XSD validator — note the validator needs a Node-safe
well-formedness check, not `DOMParser`, since that's browser-only and the test harness runs in
Node); the full YAML tool set (formatter, validator, beautifier, minifier, viewer, compare, merge,
diff, YAML↔TOML); HTML formatter/validator/preview, HTML↔Markdown, HTML entity encode/decode; CSS
formatter/validator/prefixer/unprefixer plus `clip-path` generator; the JS tool set (formatter,
beautifier, minifier, obfuscator/deobfuscator, validator, diff/compare); `regex-generator`;
`jwt-encoder`, `jwt-inspector`, `guid-generator`, `api-key-generator`; dummy-data generators
(JSON/CSV/XML/SQL); and a combined `developer-toolkit` landing page. No architecture blockers on
any of these — same pattern as what shipped, pick up whenever.

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
