# أدواتي (Adawaty)

منصة ثنائية اللغة (عربي/إنجليزي) لأدوات ومحولات مجانية تعمل بالكامل داخل المتصفح، بدون سيرفر أو رفع ملفات لأي مكان في معظم الأدوات.

**الموقع المباشر:** [https://adawaty-five.vercel.app/](https://adawaty-five.vercel.app/)  
**مرآة GitHub Pages:** [https://abdelaziz-maysara-hm.github.io/adawaty/](https://abdelaziz-maysara-hm.github.io/adawaty/)

## نظرة عامة

- أكثر من 430 أداة عالية القيمة (PDF، صور، فيديو، صوت، نصوص، بيانات، حاسبات علمية/صحية/مالية، أدوات إسلامية، ...) موزعة على 19 تصنيف.
- كل أداة صفحة HTML مستقلة تُولَّد تلقائيًا من تعريف واحد في `src/product/definitions/`، فتحصل كل صفحة على نفس الرأس (canonical, Open Graph, JSON-LD) بدون تكرار يدوي.
- لا يوجد باك-إند للأدوات الأساسية: الحسابات تتم في المتصفح بجافاسكريبت عادي (ES Modules).
- بعض أدوات التحويل المتقدمة (مثل PDF→Word Pro) قد تستخدم مسار سيرفر معزول مع إفصاح واضح.

## البنية

```
src/product/                منطق الصفحات الحقيقي (تعريفات الأدوات، صفحة الأداة، صفحة الكتالوج)
src/product/definitions/    تعريفات كل أداة مجمّعة حسب الفئة
src/css/                    التنسيق العام والمشترك
tools/<tool-id>/            صفحات الأدوات المولَّدة (لا تُعدَّل يدويًا)
categories/<name>/          صفحات الفئات المولَّدة
all-tools/                  صفحة دليل كل الأدوات
scripts/                    سكربتات التوليد والفحص والاختبار
tests/                      اختبارات تكامل بسيطة (Node test runner)
docs/                       ROADMAP ووثائق التشغيل
```

## التطوير محليًا

```bash
npm install
npm run generate:product   # يعيد توليد صفحات الأدوات والفئات و sitemap.xml
npm run check              # فحص صحة الصيغة لكل ملفات JS
npm test                   # تشغيل اختبارات التكامل
npm run validate           # check + test (نفس ما يشغّله GitHub Actions)
```

بعد أي تعديل في `src/product/definitions/*` أو `scripts/generate-product-pages.mjs`، شغّل `npm run generate:product` قبل الـ commit.

للتفاصيل الكاملة عن المساهمة: انظر [CONTRIBUTING.md](CONTRIBUTING.md).

## خارطة الطريق

قائمة المهام والأولويات في [`docs/ROADMAP.md`](docs/ROADMAP.md).

## النشر

- النشر التلقائي على GitHub Pages عبر `.github/workflows/` عند كل push على `main` بعد نجاح `npm run validate`.
- النشر على Vercel مرتبط بنفس الريبو.

## الترخيص

MIT License — انظر ملف [LICENSE](LICENSE).
