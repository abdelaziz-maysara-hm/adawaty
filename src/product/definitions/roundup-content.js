/**
 * "Roundup" landing pages -- SEO content pages that target comparison/
 * alternative search intent ("أفضل أدوات PDF مجانية", "بدائل iLovePDF"),
 * distinct from individual tool pages. Each one has real written intro
 * content (fair, factual comparisons -- not disparaging competitors) plus
 * a curated set of genuinely relevant Adawaty tools.
 *
 * This is exactly the kind of page type that brings organic search traffic
 * for comparison queries, which individual tool pages don't target well.
 */
export const ROUNDUP_CONTENT = [
  {
    slug: 'best-free-pdf-tools',
    titleAr: 'أفضل أدوات PDF مجانية أونلاين (بدون رفع حدود)',
    titleEn: 'Best Free Online PDF Tools (No Upload Limits)',
    introAr: [
      'لو بتدوّر على أداة تتعامل مع ملفات PDF (دمج، تقسيم، ضغط، تحويل)، غالبًا بتقابل مواقع بتطلب تسجيل حساب أو بتحدّد عدد العمليات المجانية في اليوم.',
      'أدوات PDF في أدواتي بتشتغل بالكامل جوه متصفحك — الملف نفسه مبيتبعتش لأي سيرفر خارجي، يعني مفيش حد أقصى لعدد المرات، ومفيش انتظار لمعالجة على سيرفر، ومفيش قلق على خصوصية ملف حساس.',
      'تحت مجموعة الأدوات الأكتر استخدامًا للتعامل مع PDF، كل واحدة بصفحة مستقلة وشرح مبسط.',
    ],
    introEn: [
      'If you\'re looking for a tool to handle PDF files (merge, split, compress, convert), you often run into sites that require an account or cap your free daily operations.',
      'Adawaty\'s PDF tools run entirely inside your browser -- the file itself is never sent to an external server, meaning no operation limits, no server-processing wait, and no worry about a sensitive file\'s privacy.',
      'Below is a curated set of the most commonly needed PDF tools, each with its own dedicated page and simple explanation.',
    ],
    toolIds: ['pdf-merge', 'pdf-splitter', 'pdf-compressor', 'pdf-to-word-converter', 'images-to-pdf-converter', 'pdf-editor', 'pdf-watermark', 'scanned-pdf-ocr'],
    category: 'pdf',
  },
  {
    slug: 'ilovepdf-alternative',
    titleAr: 'بدائل iLovePDF مجانية بالكامل بدون حد يومي',
    titleEn: 'Free iLovePDF Alternatives With No Daily Limit',
    introAr: [
      'iLovePDF موقع معروف وشغال كويس لأدوات PDF، وبيديك أدوات مجانية بدون تسجيل — بس نسختهم المجانية بتحدّد عدد المهام اللي تقدر تعملها في اليوم، والملفات بترفع فعليًا لسيرفراتهم عشان تتعالج.',
      'لو محتاج بديل مجاني بالكامل من غير حد يومي، أو حاسس إن ملفك حساس ومش عايز يتبعت لأي سيرفر خارجي، أدوات أدواتي بديل مباشر — نفس الوظائف الأساسية (دمج، تقسيم، ضغط، تحويل PDF)، لكن المعالجة كلها بتحصل جوه متصفحك.',
      'الفرق العملي الوحيد: أدوات المعالجة الثقيلة جدًا (زي تحويل PDF لـWord بجودة عالية جدًا مع جداول معقدة) لسه بتقدر تكون أدق في حلول سيرفر متخصصة — بس لمعظم الاستخدام اليومي (دمج، تقسيم، ضغط بسيط، تحويل صور)، الفرق مش محسوس.',
    ],
    introEn: [
      'iLovePDF is a well-known, solid site for PDF tools, offering free tools with no signup -- but its free tier caps how many tasks you can do per day, and files are actually uploaded to their servers for processing.',
      'If you need a fully free alternative with no daily cap, or you\'re handling a sensitive file you\'d rather not send to an external server, Adawaty\'s tools are a direct alternative -- the same core functions (merge, split, compress, convert PDF), but all processing happens inside your own browser.',
      'The one practical difference: very heavy processing (like converting a PDF to Word with very complex tables at maximum fidelity) can still be more accurate with specialized server-side solutions -- but for most everyday use (merging, splitting, basic compression, image conversion), the difference isn\'t noticeable.',
    ],
    toolIds: ['pdf-merge', 'pdf-splitter', 'pdf-compressor', 'pdf-to-images-converter', 'images-to-pdf-converter', 'pdf-watermark', 'pdf-page-rotator', 'pdf-page-remover'],
    category: 'pdf',
  },
  {
    slug: 'smallpdf-alternative',
    titleAr: 'بدائل Smallpdf مجانية بالكامل',
    titleEn: 'Fully Free Smallpdf Alternatives',
    introAr: [
      'Smallpdf أداة معروفة وواجهتها سهلة، لكن أغلب الأدوات فيها محتاجة اشتراك مدفوع بعد أول استخدام أو استخدامين مجانيين.',
      'لو الهدف استخدام عرضي أو متكرر لأدوات PDF أساسية من غير اشتراك شهري، أدوات أدواتي بتغطي نفس الاحتياجات الشائعة (ضغط، دمج، تحويل) مجانًا بالكامل ومن غير أي حد على عدد المرات.',
    ],
    introEn: [
      'Smallpdf is a well-known tool with an easy interface, but most of its tools require a paid subscription after your first use or two for free.',
      'If your goal is occasional or repeated use of basic PDF tools without a monthly subscription, Adawaty\'s tools cover the same common needs (compress, merge, convert) fully free with no usage cap.',
    ],
    toolIds: ['pdf-compressor', 'pdf-merge', 'pdf-to-word-converter', 'pdf-splitter', 'pdf-editor', 'pdf-page-number-adder'],
    category: 'pdf',
  },
  {
    slug: 'tinypng-alternative',
    titleAr: 'بدائل TinyPNG لضغط الصور مجانًا',
    titleEn: 'Free TinyPNG Alternatives for Image Compression',
    introAr: [
      'TinyPNG أداة معروفة لضغط الصور بجودة عالية، وبتشتغل كويس جدًا للاستخدام العادي — لكن النسخة المجانية محدودة بعدد صور معين مرة واحدة، وبتحتاج رفع كل صورة لسيرفرهم.',
      'أداة ضغط الصور في أدواتي بتعمل نفس الوظيفة الأساسية (تقليل حجم الصورة مع الحفاظ على جودة معقولة) لكن جوه متصفحك مباشرة، فتقدر تضغط عدد غير محدود من الصور من غير رفع أي حاجة لأي مكان.',
    ],
    introEn: [
      'TinyPNG is a well-known tool for high-quality image compression, and it works great for typical use -- but the free tier is limited to a certain number of images at once, and requires uploading each image to their server.',
      'Adawaty\'s image compressor does the same core job (reducing image size while keeping reasonable quality) but runs directly in your browser, so you can compress an unlimited number of images without uploading anything anywhere.',
    ],
    toolIds: ['image-compressor', 'image-format-converter', 'image-resizer', 'image-batch-processor', 'image-metadata-remover'],
    category: 'image',
  },
  {
    slug: 'best-free-video-tools',
    titleAr: 'أفضل أدوات تحويل وضغط الفيديو مجانًا أونلاين',
    titleEn: 'Best Free Online Video Conversion & Compression Tools',
    introAr: [
      'أدوات معالجة الفيديو أونلاين غالبًا بتحتاج رفع ملف كبير الحجم لسيرفر خارجي، وده بياخد وقت طويل حسب سرعة الإنترنت، وأحيانًا بيكون فيه حد أقصى لحجم الملف المسموح.',
      'أدوات الفيديو في أدواتي بتستخدم تقنية بتخلي المعالجة تحصل جوه المتصفح نفسه، فمفيش رفع فعلي للملف الأصلي لأي سيرفر — العملية بتاخد وقت أطول شوية من سيرفر مخصص قوي، لكن الخصوصية والتحكم الكامل يستاهلوا الفرق البسيط في السرعة.',
    ],
    introEn: [
      'Online video processing tools often require uploading a large file to an external server, which takes a while depending on your internet speed, and sometimes comes with a file size cap.',
      'Adawaty\'s video tools use technology that processes everything inside the browser itself, so the original file is never actually uploaded to any server -- it takes a bit longer than a dedicated powerful server, but the privacy and full control are worth the small speed trade-off.',
    ],
    toolIds: ['video-compressor', 'video-trimmer', 'video-format-converter', 'video-to-gif-converter', 'video-audio-extractor', 'video-resizer'],
    category: 'video',
  },
  {
    slug: 'free-developer-tools-online',
    titleAr: 'أدوات مطورين مجانية أونلاين: JSON، JWT، Hash وأكتر',
    titleEn: 'Free Online Developer Tools: JSON, JWT, Hash, and More',
    introAr: [
      'أدوات المطورين الصغيرة (تنسيق JSON، فك تشفير JWT، توليد Hash، اختبار Regex) غالبًا بتحتاج تفتح موقع مختلف لكل واحدة، وبعضها بيبعت بياناتك الحساسة (زي JWT tokens) لسيرفر خارجي.',
      'مجموعة أدوات المطورين في أدواتي كلها في مكان واحد، وكلها بتشتغل محليًا في متصفحك — مفيد جدًا لو بتتعامل مع بيانات حساسة (توكنز، مفاتيح) ومش عايز تبعتها لأي مكان.',
    ],
    introEn: [
      'Small developer utilities (JSON formatting, JWT decoding, hash generation, regex testing) often require opening a different site for each one, and some send sensitive data (like JWT tokens) to an external server.',
      'Adawaty\'s developer tools collection puts them all in one place, and every one runs locally in your browser -- especially useful if you\'re handling sensitive data (tokens, keys) you don\'t want sent anywhere.',
    ],
    toolIds: ['json-formatter', 'jwt-decoder', 'hash-generator', 'regex-tester', 'uuid-generator', 'url-slug-generator', 'curl-command-generator', 'css-beautifier'],
    category: 'developer',
  },
];
