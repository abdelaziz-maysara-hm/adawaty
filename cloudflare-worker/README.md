# Adawaty AI Worker — دليل النشر

ده الباك اند الاختياري (Opt-in) لأداة تلخيص النصوص. الموقع بيستخدم النسخة
المجانية اللي بتشتغل جوّه المتصفح كافتراضي دايمًا — الـWorker ده بيتفعّل
بس لو الزائر ضغط بنفسه على زر "جرّب النسخة المتقدمة (سحابية)".

## قبل ما تبدأ

- الـAccount ID موجود بالفعل جوّه `wrangler.jsonc` (مش سري، آمن يكون في الكود).
- محتاج الـAPI Token اللي عملته (السري) — هتحتاجه في الخطوة 3 بس، ومش
  هيتخزن في أي ملف أو يترفع على GitHub أبدًا.

## الخطوات

### 1. افتح Terminal في مجلد الـWorker

```bash
cd cloudflare-worker
```

### 2. ثبّت الأدوات المطلوبة

```bash
npm install
```

### 3. اعمل تسجيل دخول لمرة واحدة باستخدام الـToken

عندك خياران:

**الخيار الأسهل (متصفح):**
```bash
npx wrangler login
```
ده هيفتح صفحة في المتصفح تسجّل دخولك تلقائيًا.

**أو الخيار اللي مايحتاجش متصفح** (لو الـToken جاهز عندك):

على Mac/Linux:
```bash
export CLOUDFLARE_API_TOKEN="الصق_الـ_Token_هنا"
```

على Windows (PowerShell):
```powershell
$env:CLOUDFLARE_API_TOKEN="الصق_الـ_Token_هنا"
```

### 4. انشر الـWorker

```bash
npx wrangler deploy
```

لو كل حاجة تمام، هيطلعلك في الآخر سطر شكله كده:
```
Deployed adawaty-ai-worker triggers (...)
  https://adawaty-ai-worker.<اسم-حسابك>.workers.dev
```

**انسخ الرابط ده وابعتهولي** — هو ده اللي هستخدمه عشان أوصّل زر "النسخة
المتقدمة" في الموقع بالـWorker.

## اختبار سريع (اختياري)

بعد النشر، تقدر تتأكد إن كل حاجة شغالة من الترمينال نفسه:

```bash
curl -X POST "https://adawaty-ai-worker.<اسم-حسابك>.workers.dev" \
  -H "Content-Type: application/json" \
  -H "Origin: https://adawaty.tools" \
  -d '{"text": "This is a test sentence to check that summarization works correctly.", "language": "en"}'
```

المفروض يرجّعلك رد فيه ملخص قصير.

## لو حصلت مشكلة

- **"Not logged in"**: أعد الخطوة 3
- **"binding AI not found"**: تأكد إنك مسجّل دخول بالحساب الصح اللي فعّلت فيه Workers AI
- أي رسالة خطأ تانية، ابعتهالي زي ما هي وهساعدك أشخّصها
