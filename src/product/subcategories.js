/**
 * Sub-category taxonomy for the largest top-level categories. Kept as a
 * standalone id -> subcategory data mapping rather than a field added to
 * every individual tool definition (which would mean touching 400+
 * tools across ~30 definition files) -- this file is the single place
 * to add, rename, or re-group sub-categories going forward.
 *
 * Each entry: `[subcategoryId, { ar, en }, [...toolIds]]`. A tool not
 * listed under its parent category here simply has no sub-category
 * (falls into an implicit "Other" bucket at render time) -- this is
 * expected and fine; only the biggest, most naturally-groupable
 * categories are covered.
 */
const SUBCATEGORIES = Object.freeze({
    developer: Object.freeze([
        ['json', { ar: 'أدوات JSON', en: 'JSON Tools' }, [
            'json-array-deduplicator', 'json-array-sorter', 'json-diff', 'json-file-to-csv-converter',
            'json-flattener', 'json-formatter', 'json-key-sorter', 'json-merge', 'json-minifier',
            'json-path-extractor', 'json-property-remover', 'json-schema-validator', 'json-string-escaper',
            'json-to-csv-converter', 'json-to-xml-converter', 'json-tree-viewer', 'json-unflattener',
            'json-validator', 'ndjson-to-json-converter', 'dummy-json-generator', 'csv-to-json-converter',
            'csv-to-json-lines', 'excel-to-json-converter', 'xml-to-json-converter',
        ]],
        ['csv-excel', { ar: 'أدوات CSV و Excel', en: 'CSV & Excel Tools' }, [
            'csv-column-extractor', 'csv-column-remover', 'csv-deduplicator', 'csv-delimiter-converter',
            'csv-file-to-json-converter', 'csv-header-renamer', 'csv-row-filter', 'csv-row-sorter',
            'csv-to-excel-converter', 'csv-to-html-table', 'csv-to-markdown-table', 'csv-to-sql-insert',
            'csv-transposer', 'dummy-csv-generator', 'excel-to-csv-converter', 'excel-to-html-table',
        ]],
        ['html', { ar: 'أدوات HTML', en: 'HTML Tools' }, [
            'html-beautifier', 'html-class-extractor', 'html-comment-remover', 'html-data-attribute-extractor',
            'html-entity-encoder-decoder', 'html-form-field-extractor', 'html-heading-extractor',
            'html-id-extractor', 'html-image-source-extractor', 'html-inline-event-remover',
            'html-link-extractor', 'html-list-to-text-converter', 'html-meta-tag-extractor', 'html-minifier',
            'html-script-remover', 'html-style-remover', 'html-table-to-csv-converter', 'html-tag-counter',
            'html-to-markdown-converter', 'html-to-text-converter',
        ]],
        ['xml', { ar: 'أدوات XML', en: 'XML Tools' }, [
            'xml-compare', 'xml-formatter', 'xml-minifier', 'xml-validator',
        ]],
        ['encoding-hashing', { ar: 'ترميز وتجزئة', en: 'Encoding & Hashing' }, [
            'base58-encoder-decoder', 'base64-encoder-decoder', 'base64-to-file-converter',
            'binary-file-to-hex-converter', 'binary-text-converter', 'data-uri-decoder', 'data-uri-encoder',
            'file-sha1-checksum', 'file-sha256-checksum', 'file-to-base64-converter', 'gzip-file-compressor',
            'gzip-file-decompressor', 'hash-generator', 'javascript-string-escape-tool', 'jwt-decoder',
            'jwt-encoder', 'jwt-inspector', 'multi-file-sha256-manifest', 'unicode-code-point-converter',
            'url-encoder-decoder',
        ]],
        ['ids', { ar: 'مولّدات المعرّفات', en: 'ID Generators' }, [
            'api-key-generator', 'guid-generator', 'nanoid-generator', 'random-string-generator',
            'ulid-generator', 'uuid-generator',
        ]],
        ['web-css', { ar: 'أدوات الويب و CSS', en: 'Web & CSS Tools' }, [
            'cron-expression-builder', 'cron-expression-parser', 'css-beautifier', 'css-gradient-generator',
            'css-minifier', 'css-prefixer', 'css-px-rem-converter', 'css-specificity-calculator',
            'css-validator', 'curl-command-generator', 'http-status-code-lookup', 'query-string-builder',
            'query-string-parser', 'regex-escape-tool', 'regex-generator', 'regex-tester', 'url-domain-extractor',
            'url-list-deduplicator', 'url-normalizer', 'url-parser', 'url-query-parameter-remover',
        ]],
        ['files-text', { ar: 'ملفات ونصوص', en: 'Files & Text' }, [
            'file-metadata-exporter', 'file-parts-merger', 'file-splitter-to-zip', 'text-diff-checker',
            'text-file-duplicate-line-remover', 'text-file-encoding-normalizer', 'text-file-line-sorter',
            'text-file-merger', 'zip-entry-list', 'zip-files-creator', 'zip-single-file-extractor',
        ]],
        ['code-formatting', { ar: 'تنسيق الأكواد', en: 'Code Formatting' }, [
            'javascript-formatter', 'javascript-minifier', 'sql-formatter', 'dummy-sql-generator',
        ]],
        ['markdown', { ar: 'أدوات Markdown', en: 'Markdown Tools' }, [
            'markdown-to-html-converter', 'markdown-link-extractor', 'markdown-image-extractor',
        ]],
    ]),
    image: Object.freeze([
        ['compression', { ar: 'ضغط الصور', en: 'Compression' }, [
            'compress-image-to-100kb', 'compress-image-to-200kb', 'compress-image-to-20kb',
            'compress-image-to-500kb', 'compress-image-to-50kb', 'compress-image-to-target-size',
            'compression-analysis', 'image-compressor', 'gif-compressor',
        ]],
        ['format-conversion', { ar: 'تحويل الصيغ', en: 'Format Conversion' }, [
            'avif-to-jpg-converter', 'avif-to-png-converter', 'bmp-to-jpg-converter', 'bmp-to-png-converter',
            'heic-to-jpg-converter', 'heic-to-png-converter', 'jfif-to-jpg-converter', 'jpg-to-png-converter',
            'jpg-to-webp-converter', 'png-to-jpg-converter', 'png-to-webp-converter',
            'powerpoint-to-jpg-converter', 'svg-to-png-converter', 'tiff-to-jpg-converter',
            'tiff-to-png-converter', 'webp-to-jpg-converter', 'webp-to-png-converter', 'image-format-converter',
            'base64-to-image', 'image-to-base64',
        ]],
        ['editing', { ar: 'تعديل وتحرير', en: 'Editing' }, [
            'auto-crop-image', 'auto-rotate-image', 'image-blur-tool', 'image-color-adjuster',
            'image-color-inverter', 'image-cropper', 'image-grayscale-converter', 'image-resizer',
            'image-rotate-flip', 'image-sepia-filter', 'image-watermark-tool', 'text-watermark',
            'gif-resizer', 'gif-reverser', 'gif-speed-changer',
        ]],
        ['analysis', { ar: 'تحليل ومعلومات', en: 'Analysis & Info' }, [
            'blur-detector', 'dominant-color', 'histogram', 'image-average-color-picker', 'image-color-picker',
            'image-size', 'image-validator', 'noise-detector', 'sharpness-detector', 'edit-exif', 'view-exif',
            'image-metadata-remover',
        ]],
        ['creative-social', { ar: 'إبداعي ومواقع التواصل', en: 'Creative & Social' }, [
            'favicon-generator', 'grid-maker', 'image-collage-maker', 'image-contact-sheet', 'image-slider',
            'meme-generator', 'photo-censor', 'photo-strip', 'social-media-image-pack',
            'social-media-image-resizer', 'color-blindness-simulator', 'image-svg-tracer',
        ]],
        ['batch-ocr', { ar: 'معالجة مجمّعة و OCR', en: 'Batch & OCR' }, [
            'image-batch-processor', 'image-to-text-ocr',
        ]],
    ]),
    math: Object.freeze([
        ['calculus', { ar: 'التفاضل والتكامل', en: 'Calculus' }, [
            'numerical-derivative-calculator', 'polynomial-definite-integral-calculator',
            'polynomial-derivative-calculator', 'polynomial-evaluator', 'polynomial-limit-calculator',
            'polynomial-tangent-line-calculator', 'power-rule-derivative-calculator', 'riemann-sum-calculator',
            'exponential-function-derivative-calculator', 'quadratic-partial-derivative-calculator',
        ]],
        ['geometry', { ar: 'الهندسة', en: 'Geometry' }, [
            'arc-length-calculator', 'chord-length-calculator', 'circular-segment-area-calculator',
            'herons-formula-calculator', 'point-to-line-distance-calculator', 'pythagorean-theorem-calculator',
            'regular-polygon-calculator', 'sector-area-calculator', 'three-dimensional-distance-calculator',
            'triangle-area-coordinates-calculator', 'triangle-centroid-calculator',
            'triangle-circumradius-calculator', 'triangle-inradius-calculator',
        ]],
        ['statistics-probability', { ar: 'الإحصاء والاحتمالات', en: 'Statistics & Probability' }, [
            'binomial-probability-calculator', 'coefficient-of-variation-calculator', 'combination-calculator',
            'confidence-interval-calculator', 'covariance-calculator', 'expected-value-calculator',
            'mean-absolute-deviation-calculator', 'odds-probability-converter', 'pearson-correlation-calculator',
            'percentile-calculator', 'permutation-calculator', 'probability-calculator',
            'quartile-iqr-calculator', 'sample-size-calculator', 'standard-deviation-calculator',
            'standard-error-calculator', 'variance-calculator', 'z-score-calculator',
            'linear-regression-calculator', 'geometric-mean-calculator', 'harmonic-mean-calculator',
        ]],
        ['algebra', { ar: 'الجبر', en: 'Algebra' }, [
            'linear-equation-solver', 'line-equation-two-points-calculator', 'logarithm-calculator',
            'quadratic-equation-calculator', 'two-variable-equation-solver', 'two-by-two-matrix-calculator',
        ]],
        ['sequences-series', { ar: 'المتتاليات والمتسلسلات', en: 'Sequences & Series' }, [
            'arithmetic-sequence-calculator', 'arithmetic-series-sum-calculator',
            'geometric-sequence-calculator', 'geometric-series-sum-calculator',
        ]],
        ['trigonometry', { ar: 'حساب المثلثات', en: 'Trigonometry' }, [
            'trigonometric-functions-calculator', 'inverse-trigonometric-calculator',
            'law-of-sines-side-calculator', 'law-of-cosines-angle-calculator', 'law-of-cosines-side-calculator',
        ]],
        ['everyday-math', { ar: 'رياضيات يومية', en: 'Everyday Math' }, [
            'percentage-calculator', 'percentage-error-calculator', 'average-rate-of-change-calculator',
            'number-base-converter', 'scientific-notation-converter', 'decimal-degrees-dms-converter',
        ]],
    ]),
    text: Object.freeze([
        ['counters', { ar: 'عدّادات النصوص', en: 'Text Counters' }, [
            'word-counter', 'character-counter', 'line-counter', 'sentence-counter', 'paragraph-counter',
            'vowel-consonant-counter', 'reading-time-calculator',
        ]],
        ['lists', { ar: 'أدوات القوائم', en: 'List Tools' }, [
            'list-chunker', 'list-difference', 'list-frequency-table', 'list-intersection', 'list-numberer',
            'list-randomizer', 'list-reverser', 'list-union',
        ]],
        ['lines', { ar: 'أدوات الأسطر', en: 'Line Tools' }, [
            'line-sorter', 'line-number-adder', 'line-prefix-adder', 'line-suffix-adder',
            'duplicate-line-remover',
        ]],
        ['conversion-cipher', { ar: 'تحويل وتشفير بسيط', en: 'Conversion & Simple Ciphers' }, [
            'text-case-converter', 'rot13-converter', 'caesar-cipher', 'morse-code-translator',
            'nato-phonetic-alphabet-converter', 'bionic-reading-converter', 'text-to-handwriting',
            'text-reverser', 'epub-to-txt-converter', 'powerpoint-to-txt-converter', 'word-to-txt-converter',
        ]],
        ['generators', { ar: 'مولّدات نصوص', en: 'Text Generators' }, [
            'lorem-ipsum-generator', 'acronym-generator', 'initials-generator', 'slug-generator',
        ]],
        ['analysis', { ar: 'تحليل النصوص', en: 'Text Analysis' }, [
            'word-frequency-analyzer', 'anagram-checker', 'palindrome-checker', 'find-and-replace-tool',
            'whitespace-cleaner', 'text-word-wrapper', 'email-address-extractor', 'url-extractor',
        ]],
    ]),
    pdf: Object.freeze([
        ['organize', { ar: 'دمج وتقسيم وترتيب', en: 'Merge, Split & Organize' }, [
            'pdf-merge', 'pdf-splitter', 'pdf-page-reorderer', 'pdf-page-interleaver', 'pdf-page-extractor',
            'pdf-page-remover', 'pdf-blank-page-remover', 'pdf-page-reverser', 'pdf-workflow',
        ]],
        ['convert-from', { ar: 'تحويل من PDF', en: 'Convert From PDF' }, [
            'pdf-to-word-converter', 'pdf-to-excel-converter', 'pdf-to-images-converter', 'pdf-to-jpg-converter',
            'pdf-to-png-converter', 'pdf-to-powerpoint-converter', 'pdf-to-markdown', 'pdf-text-extractor',
            'extract-images-pdf',
        ]],
        ['convert-to', { ar: 'تحويل إلى PDF', en: 'Convert To PDF' }, [
            'word-to-pdf-converter', 'excel-to-pdf-converter', 'images-to-pdf-converter', 'jpg-to-pdf-converter',
            'png-to-pdf-converter', 'html-file-to-pdf', 'epub-to-pdf-converter', 'markdown-to-pdf',
            'powerpoint-to-pdf-converter', 'txt-to-pdf',
        ]],
        ['edit-enhance', { ar: 'تحرير وتحسين', en: 'Edit & Enhance' }, [
            'pdf-editor', 'pdf-watermark', 'pdf-sign', 'pdf-page-rotator', 'pdf-page-crop',
            'pdf-page-size-normalizer', 'grayscale-pdf', 'pdf-scanned-look', 'pdf-page-number-adder',
        ]],
        ['security-cleanup', { ar: 'أمان وتنظيف', en: 'Security & Cleanup' }, [
            'pdf-protect', 'pdf-metadata-cleaner', 'pdf-compressor',
        ]],
        ['ocr', { ar: 'التعرف الضوئي (OCR)', en: 'OCR' }, [
            'scanned-pdf-ocr', 'scanned-pdf-to-word-ocr',
        ]],
    ]),
    finance: Object.freeze([
        ['loans-debt', { ar: 'القروض والديون', en: 'Loans & Debt' }, [
            'loan-calculator', 'mortgage-calculator', 'loan-affordability-calculator',
            'credit-card-payoff-calculator', 'debt-to-income-calculator',
        ]],
        ['investment', { ar: 'الاستثمار', en: 'Investment' }, [
            'compound-interest-calculator', 'roi-calculator', 'cagr-calculator', 'dividend-yield-calculator',
            'investment-fee-calculator', 'payback-period-calculator', 'net-worth-calculator',
        ]],
        ['business-ecommerce', { ar: 'الأعمال والتجارة الإلكترونية', en: 'Business & E-commerce' }, [
            'break-even-calculator', 'profit-margin-calculator', 'marketplace-fee-profit-calculator',
            'cart-abandonment-rate-calculator', 'customer-acquisition-cost-calculator',
            'customer-lifetime-value-calculator', 'customer-retention-rate-calculator',
            'ecommerce-conversion-rate-calculator', 'return-on-ad-spend-calculator',
            'inventory-turnover-calculator', 'inventory-reorder-point-calculator',
            'shipping-dimensional-weight-calculator',
        ]],
        ['personal-finance', { ar: 'المالية الشخصية', en: 'Personal Finance' }, [
            'savings-goal-calculator', 'emergency-fund-calculator', 'hourly-salary-calculator',
            'tip-calculator', 'discount-calculator', 'inflation-calculator', 'vat-calculator',
        ]],
    ]),
    converter: Object.freeze([
        ['units', { ar: 'وحدات القياس', en: 'Measurement Units' }, [
            'length-converter', 'area-converter', 'volume-converter', 'weight-converter',
            'temperature-converter', 'speed-converter', 'time-unit-converter', 'angle-converter',
            'energy-converter', 'force-unit-converter', 'power-unit-converter', 'pressure-converter',
            'torque-converter', 'frequency-converter', 'density-unit-converter', 'flow-rate-converter',
            'illuminance-converter', 'acceleration-converter', 'data-storage-converter',
            'data-transfer-rate-converter', 'cooking-volume-converter',
        ]],
        ['documents', { ar: 'المستندات والملفات', en: 'Documents & Files' }, [
            'word-to-html-converter', 'pdf-to-csv-converter', 'pdf-to-epub-converter', 'json-to-excel-converter',
            'extract-images-from-word', 'extract-images-from-powerpoint', 'word-compressor',
            'excel-compressor', 'powerpoint-compressor',
        ]],
    ]),
});

/** Returns [subcategoryId, {ar, en}][] for a category, or an empty array if it has no defined sub-categories. */
function getSubcategories(category) {
    return SUBCATEGORIES[category] ?? [];
}

/** Returns the subcategoryId a tool belongs to within its category, or null if uncategorized at this level. */
function getSubcategoryForTool(category, toolId) {
    const groups = SUBCATEGORIES[category];
    if (!groups) return null;
    for (const [subcategoryId, , toolIds] of groups) {
        if (toolIds.includes(toolId)) return subcategoryId;
    }
    return null;
}

export { SUBCATEGORIES, getSubcategories, getSubcategoryForTool };

// END OF FILE
