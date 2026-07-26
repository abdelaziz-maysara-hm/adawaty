function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
}

function textInput(id, label, placeholder, rows = 9) {
    return Object.freeze({
        id,
        type: 'textarea',
        rows,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function numberInput(id, label, placeholder, options = {}) {
    return Object.freeze({
        id,
        type: 'number',
        min: options.min ?? 1,
        max: options.max ?? 1000,
        step: options.step ?? 1,
        label: Object.freeze(label),
        unit: Object.freeze(options.unit ?? { ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

function selectInput(id, label, options) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map((item) => Object.freeze({
            value: item.value,
            label: Object.freeze(item.label),
        }))),
    });
}

function words(value) {
    return String(value).match(/[\p{L}\p{N}]+(?:['’_-][\p{L}\p{N}]+)*/gu) ?? [];
}

function lines(value) {
    return String(value).replace(/\r\n?/g, '\n').split('\n');
}

const lineCounter = Object.freeze({
    id: 'line-counter',
    category: 'text',
    icon: '≡',
    title: Object.freeze({ ar: 'عداد الأسطر', en: 'Line Counter' }),
    description: Object.freeze({ ar: 'احسب إجمالي الأسطر والأسطر غير الفارغة في النص.', en: 'Count total and non-empty lines in text.' }),
    note: Object.freeze({ ar: 'يُحسب السطر الأخير حتى إن لم ينتهِ بفاصل.', en: 'The final line is counted even without a trailing break.' }),
    inputs: Object.freeze([textInput('text', { ar: 'النص', en: 'Text' }, 'First line\nSecond line\n\nFourth line')]),
    calculate(values, language) {
        const allLines = lines(values.text);
        const nonEmpty = allLines.filter((line) => line.trim()).length;
        return output(allLines.length, localized(language, 'إجمالي الأسطر', 'Total lines'), `${nonEmpty} non-empty`);
    },
});

const sentenceCounter = Object.freeze({
    id: 'sentence-counter',
    category: 'text',
    icon: '.?!',
    title: Object.freeze({ ar: 'عداد الجمل', en: 'Sentence Counter' }),
    description: Object.freeze({ ar: 'قدّر عدد الجمل في النص العربي أو الإنجليزي.', en: 'Estimate the number of sentences in Arabic or English text.' }),
    note: Object.freeze({ ar: 'يعتمد العد على علامات نهاية الجملة.', en: 'Counting uses common sentence-ending punctuation.' }),
    inputs: Object.freeze([textInput('text', { ar: 'النص', en: 'Text' }, 'Hello world. How are you? I am well!')]),
    calculate(values, language) {
        const trimmed = values.text.trim();
        const count = trimmed ? (trimmed.match(/[.!?؟]+(?:\s|$)/g)?.length ?? 1) : 0;
        return output(count, localized(language, 'عدد الجمل', 'Sentence count'));
    },
});

const paragraphCounter = Object.freeze({
    id: 'paragraph-counter',
    category: 'text',
    icon: '¶',
    title: Object.freeze({ ar: 'عداد الفقرات', en: 'Paragraph Counter' }),
    description: Object.freeze({ ar: 'احسب الفقرات المفصولة بسطر فارغ أو أكثر.', en: 'Count paragraphs separated by one or more blank lines.' }),
    note: Object.freeze({ ar: 'لا تُحسب المساحات الفارغة كفقرات.', en: 'Whitespace-only blocks are not counted.' }),
    inputs: Object.freeze([textInput('text', { ar: 'النص', en: 'Text' }, 'First paragraph.\n\nSecond paragraph.')]),
    calculate(values, language) {
        const count = values.text.trim()
            ? values.text.trim().split(/\n\s*\n/).filter((item) => item.trim()).length
            : 0;
        return output(count, localized(language, 'عدد الفقرات', 'Paragraph count'));
    },
});

const readingTime = Object.freeze({
    id: 'reading-time-calculator',
    category: 'text',
    icon: 'min',
    title: Object.freeze({ ar: 'حاسبة وقت القراءة', en: 'Reading Time Calculator' }),
    description: Object.freeze({ ar: 'قدّر مدة قراءة النص حسب سرعة القراءة بالدقيقة.', en: 'Estimate text reading time from a chosen words-per-minute speed.' }),
    note: Object.freeze({ ar: 'السرعة الافتراضية 200 كلمة في الدقيقة.', en: 'The default speed is 200 words per minute.' }),
    inputs: Object.freeze([
        textInput('text', { ar: 'النص', en: 'Text' }, 'Paste your article here.'),
        numberInput('speed', { ar: 'سرعة القراءة', en: 'Reading speed' }, 200, { min: 50, max: 1000, unit: { ar: 'كلمة/دقيقة', en: 'wpm' } }),
    ]),
    calculate(values, language) {
        const count = words(values.text).length;
        const minutes = count / values.speed;
        return output(
            `${minutes.toFixed(2)} min`,
            localized(language, 'وقت القراءة التقديري', 'Estimated reading time'),
            `${count} words`,
        );
    },
});

const duplicateLines = Object.freeze({
    id: 'duplicate-line-remover',
    category: 'text',
    icon: '≠',
    title: Object.freeze({ ar: 'حذف الأسطر المكررة', en: 'Duplicate Line Remover' }),
    description: Object.freeze({ ar: 'احذف الأسطر المتكررة مع الحفاظ على أول ظهور وترتيبه.', en: 'Remove repeated lines while preserving first appearance and order.' }),
    note: Object.freeze({ ar: 'تُقارن الأسطر بعد إزالة المسافات من البداية والنهاية.', en: 'Lines are compared after trimming surrounding whitespace.' }),
    inputs: Object.freeze([textInput('text', { ar: 'الأسطر', en: 'Lines' }, 'apple\nbanana\napple\norange')]),
    calculate(values, language) {
        const unique = [];
        const seen = new Set();
        for (const line of lines(values.text)) {
            const normalized = line.trim();
            if (!seen.has(normalized)) {
                seen.add(normalized);
                unique.push(line);
            }
        }
        return output(unique.join('\n'), localized(language, 'الأسطر الفريدة', 'Unique lines'), `${lines(values.text).length - unique.length} duplicates removed`);
    },
});

const lineSorter = Object.freeze({
    id: 'line-sorter',
    category: 'text',
    icon: 'A↕Z',
    title: Object.freeze({ ar: 'ترتيب الأسطر', en: 'Line Sorter' }),
    description: Object.freeze({ ar: 'رتّب أسطر النص تصاعديًا أو تنازليًا مع دعم العربية.', en: 'Sort text lines ascending or descending with Arabic support.' }),
    note: Object.freeze({ ar: 'يستخدم الترتيب اللغوي للغة المختارة.', en: 'Uses locale-aware alphabetical ordering.' }),
    inputs: Object.freeze([
        textInput('text', { ar: 'الأسطر', en: 'Lines' }, 'banana\napple\norange'),
        selectInput('direction', { ar: 'اتجاه الترتيب', en: 'Sort direction' }, [
            { value: 'ascending', label: { ar: 'تصاعدي', en: 'Ascending' } },
            { value: 'descending', label: { ar: 'تنازلي', en: 'Descending' } },
        ]),
    ]),
    calculate(values, language) {
        const sorted = [...lines(values.text)].sort((first, second) => (
            first.localeCompare(second, language === 'ar' ? 'ar' : 'en', { numeric: true })
        ));
        if (values.direction === 'descending') {
            sorted.reverse();
        }
        return output(sorted.join('\n'), localized(language, 'الأسطر المرتبة', 'Sorted lines'));
    },
});

const textReverser = Object.freeze({
    id: 'text-reverser',
    category: 'text',
    icon: '↔',
    title: Object.freeze({ ar: 'عكس النص', en: 'Text Reverser' }),
    description: Object.freeze({ ar: 'اعكس ترتيب رموز النص مع الحفاظ على رموز Unicode المركبة.', en: 'Reverse text while preserving composed Unicode characters.' }),
    note: Object.freeze({ ar: 'تُعكس الرموز المرئية وليس وحدات UTF-16.', en: 'Visible graphemes are reversed instead of UTF-16 units.' }),
    inputs: Object.freeze([textInput('text', { ar: 'النص', en: 'Text' }, 'Adawaty')]),
    calculate(values, language) {
        const segments = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(values.text)]
            .map((segment) => segment.segment);
        return output(segments.reverse().join(''), localized(language, 'النص المعكوس', 'Reversed text'));
    },
});

const whitespaceCleaner = Object.freeze({
    id: 'whitespace-cleaner',
    category: 'text',
    icon: '␠',
    title: Object.freeze({ ar: 'منظف المسافات', en: 'Whitespace Cleaner' }),
    description: Object.freeze({ ar: 'أزل المسافات الزائدة ونظف الأسطر الفارغة المتكررة.', en: 'Remove extra spaces and collapse repeated blank lines.' }),
    note: Object.freeze({ ar: 'يحافظ على فواصل الفقرات المفردة.', en: 'Single paragraph breaks are preserved.' }),
    inputs: Object.freeze([textInput('text', { ar: 'النص', en: 'Text' }, '  Too   many spaces. \n\n\n Next paragraph.  ')]),
    calculate(values, language) {
        const cleaned = values.text
            .replace(/[^\S\r\n]+/g, ' ')
            .replace(/ *\n */g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        return output(cleaned, localized(language, 'النص المنظف', 'Cleaned text'));
    },
});

const findReplace = Object.freeze({
    id: 'find-and-replace-tool',
    category: 'text',
    icon: '↻',
    title: Object.freeze({ ar: 'بحث واستبدال النص', en: 'Find and Replace Tool' }),
    description: Object.freeze({ ar: 'استبدل كل ظهور لعبارة محددة داخل النص.', en: 'Replace every occurrence of a chosen phrase in text.' }),
    note: Object.freeze({ ar: 'العملية حساسة لحالة الأحرف في الإنجليزية.', en: 'Matching is case-sensitive.' }),
    inputs: Object.freeze([
        textInput('text', { ar: 'النص', en: 'Text' }, 'Adawaty has useful tools. Adawaty is bilingual.'),
        textInput('find', { ar: 'ابحث عن', en: 'Find' }, 'Adawaty', 2),
        textInput('replacement', { ar: 'استبدل بـ', en: 'Replace with' }, 'The platform', 2),
    ]),
    calculate(values, language) {
        if (!values.find) {
            throw new Error(localized(language, 'أدخل عبارة للبحث.', 'Enter text to find.'));
        }
        const occurrences = values.text.split(values.find).length - 1;
        return output(
            values.text.replaceAll(values.find, values.replacement),
            localized(language, 'النص بعد الاستبدال', 'Replaced text'),
            `${occurrences} replacements`,
        );
    },
});

const loremWords = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'.split(' ');

const loremGenerator = Object.freeze({
    id: 'lorem-ipsum-generator',
    category: 'text',
    icon: 'Lorem',
    title: Object.freeze({ ar: 'مولد Lorem Ipsum', en: 'Lorem Ipsum Generator' }),
    description: Object.freeze({ ar: 'أنشئ فقرات نص تجريبي للتصميم والنماذج الأولية.', en: 'Generate sample paragraphs for design and prototyping.' }),
    note: Object.freeze({ ar: 'النص الناتج للاستخدام التجريبي وليس للنشر النهائي.', en: 'Generated copy is for mockups, not final publication.' }),
    inputs: Object.freeze([
        numberInput('paragraphs', { ar: 'عدد الفقرات', en: 'Paragraphs' }, 3, { min: 1, max: 20, step: 1 }),
        numberInput('wordsPerParagraph', { ar: 'كلمات كل فقرة', en: 'Words per paragraph' }, 50, { min: 5, max: 300, step: 1 }),
    ]),
    calculate(values, language) {
        const paragraphs = Array.from({ length: values.paragraphs }, (_, paragraphIndex) => {
            const generated = Array.from({ length: values.wordsPerParagraph }, (_, wordIndex) => (
                loremWords[(paragraphIndex + wordIndex) % loremWords.length]
            )).join(' ');
            return `${generated[0].toUpperCase()}${generated.slice(1)}.`;
        });
        return output(paragraphs.join('\n\n'), localized(language, 'النص التجريبي', 'Generated sample text'), `${values.paragraphs} paragraphs`);
    },
});

const textProductivityDefinitions = Object.freeze({
    [lineCounter.id]: lineCounter,
    [sentenceCounter.id]: sentenceCounter,
    [paragraphCounter.id]: paragraphCounter,
    [readingTime.id]: readingTime,
    [duplicateLines.id]: duplicateLines,
    [lineSorter.id]: lineSorter,
    [textReverser.id]: textReverser,
    [whitespaceCleaner.id]: whitespaceCleaner,
    [findReplace.id]: findReplace,
    [loremGenerator.id]: loremGenerator,
});

export { textProductivityDefinitions };

// END OF FILE
