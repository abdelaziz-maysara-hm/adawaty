# أدواتي (Adawaty)

منصة ثنائية اللغة (عربي/إنجليزي) لأدوات ومحولات مجانية تعمل بالكامل داخل المتصفح، بدون سيرفر أو رفع ملفات لأي مكان.

**الموقع المباشر:** https://abdelaziz-maysara-hm.github.io/adawaty/

## نظرة عامة

- أكثر من 430 أداة (تحويل وحدات، حاسبات صحة ومالية، أدوات نصوص، PDF، صور، فيديو، أدوات إسلامية، ...) موزعة على 19 تصنيف.
- كل أداة صفحة HTML مستقلة تُولَّد تلقائياً من تعريف واحد في `src/product/definitions/`، فتحصل كل صفحة على نفس الرأس (canonical, Open Graph, JSON-LD) بدون تكرار يدوي.
- لا يوجد باك-إند: كل الحسابات تتم في المتصفح بجافاسكريبت عادي (ES Modules)، بدون أي build tool أو framework.

## البنية

```
src/product/                منطق الصفحات الحقيقي (تعريفات الأدوات، صفحة الأداة، صفحة الكتالوج)
src/product/definitions/    تعريفات كل أداة مجمّعة حسب الفئة
src/css/                    التنسيق العام والمشترك
tools/<tool-id>/            صفحات الأدوات المولَّدة (لا تُعدَّل يدوياً، تُنشأ بالسكريبت)
categories/<name>/          صفحات الفئات المولَّدة
all-tools/                  صفحة دليل كل الأدوات
scripts/                    سكريبتات التوليد والفحص والاختبار
tests/                      اختبارات تكامل بسيطة (Node test runner)
```

## التطوير محلياً

```bash
npm run generate:product   # يعيد توليد كل صفحات الأدوات والفئات وملف sitemap.xml من التعريفات
npm run check              # فحص صحة الصيغة (syntax) لكل ملفات JS
npm test                   # تشغيل اختبارات التكامل
npm run validate           # check + test معاً (نفس ما يشغّله GitHub Actions قبل النشر)
```

بعد أي تعديل في `src/product/definitions/*` أو `scripts/generate-product-pages.mjs`، لازم تشغّل `npm run generate:product` لتحديث الصفحات الثابتة قبل الـ commit.

## النشر

النشر تلقائي على GitHub Pages عبر `.github/workflows/` عند كل push على `main`، بعد نجاح `npm run validate`.

## الترخيص

لا يوجد ترخيص محدد بعد.
