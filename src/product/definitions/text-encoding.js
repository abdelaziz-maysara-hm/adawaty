function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
}

function textInput(id, label, sample, rows = 7) {
    return Object.freeze({
        id,
        type: 'textarea',
        rows,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder: sample,
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

const directionOptions = Object.freeze([
    { value: 'encode', label: { ar: 'ترميز', en: 'Encode' } },
    { value: 'decode', label: { ar: 'فك الترميز', en: 'Decode' } },
]);

const morseEntries = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
    G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
    M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
    S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
    Y: '-.--', Z: '--..', 0: '-----', 1: '.----', 2: '..---',
    3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...',
    8: '---..', 9: '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..',
    '!': '-.-.--', '/': '-..-.', '-': '-....-', '@': '.--.-.',
};
const fromMorse = Object.fromEntries(Object.entries(morseEntries).map(([key, value]) => [value, key]));

const nato = {
    A: 'Alpha', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo',
    F: 'Foxtrot', G: 'Golf', H: 'Hotel', I: 'India', J: 'Juliett',
    K: 'Kilo', L: 'Lima', M: 'Mike', N: 'November', O: 'Oscar',
    P: 'Papa', Q: 'Quebec', R: 'Romeo', S: 'Sierra', T: 'Tango',
    U: 'Uniform', V: 'Victor', W: 'Whiskey', X: 'X-ray', Y: 'Yankee',
    Z: 'Zulu', 0: 'Zero', 1: 'One', 2: 'Two', 3: 'Three', 4: 'Four',
    5: 'Five', 6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine',
};

const morseTranslator = Object.freeze({
    id: 'morse-code-translator',
    category: 'text',
    icon: '·−',
    title: Object.freeze({ ar: 'مترجم شفرة مورس', en: 'Morse Code Translator' }),
    description: Object.freeze({ ar: 'حوّل الحروف والأرقام الإنجليزية إلى شفرة مورس أو العكس.', en: 'Translate English letters and numbers to Morse code or back.' }),
    note: Object.freeze({ ar: 'تفصل المسافة بين الرموز وتفصل الشرطة المائلة بين الكلمات.', en: 'Spaces separate symbols and a slash separates words.' }),
    inputs: Object.freeze([
        textInput('text', { ar: 'النص أو شفرة مورس', en: 'Text or Morse code' }, 'SOS tools'),
        selectInput('operation', { ar: 'العملية', en: 'Operation' }, directionOptions),
    ]),
    calculate(values, language) {
        if (values.operation === 'encode') {
            const encoded = values.text.toUpperCase().split('').map((character) =>
                character === ' ' ? '/' : morseEntries[character] ?? '').filter(Boolean).join(' ');
            return output(encoded, localized(language, 'شفرة مورس', 'Morse code'));
        }
        const decoded = values.text.trim().split(/\s+/).map((symbol) =>
            symbol === '/' ? ' ' : fromMorse[symbol] ?? '�').join('');
        return output(decoded, localized(language, 'النص المفكوك', 'Decoded text'));
    },
});

const binaryTextConverter = Object.freeze({
    id: 'binary-text-converter',
    category: 'developer',
    icon: '0101',
    title: Object.freeze({ ar: 'محول النص والثنائي', en: 'Binary Text Converter' }),
    description: Object.freeze({ ar: 'حوّل نص UTF-8 إلى بايتات ثنائية أو أعد البايتات إلى نص.', en: 'Convert UTF-8 text to binary bytes or decode bytes into text.' }),
    note: Object.freeze({ ar: 'تُفصل البايتات بمسافة لتسهيل القراءة.', en: 'Bytes are separated with spaces for readability.' }),
    inputs: Object.freeze([
        textInput('text', { ar: 'النص أو البايتات الثنائية', en: 'Text or binary bytes' }, 'Adawaty'),
        selectInput('operation', { ar: 'العملية', en: 'Operation' }, directionOptions),
    ]),
    calculate(values, language) {
        try {
            if (values.operation === 'encode') {
                const encoded = [...new TextEncoder().encode(values.text)]
                    .map((byte) => byte.toString(2).padStart(8, '0')).join(' ');
                return output(encoded, localized(language, 'تم الترميز إلى ثنائي', 'Binary encoding'));
            }
            const chunks = values.text.trim().split(/\s+/);
            if (chunks.some((chunk) => !/^[01]{8}$/.test(chunk))) {
                throw new Error();
            }
            const decoded = new TextDecoder('utf-8', { fatal: true })
                .decode(Uint8Array.from(chunks, (chunk) => Number.parseInt(chunk, 2)));
            return output(decoded, localized(language, 'تم فك النص', 'Decoded text'));
        } catch {
            throw new Error(localized(language, 'أدخل بايتات ثنائية صحيحة من 8 خانات.', 'Enter valid 8-bit binary bytes.'));
        }
    },
});

const rot13Converter = Object.freeze({
    id: 'rot13-converter',
    category: 'text',
    icon: 'R13',
    title: Object.freeze({ ar: 'محول ROT13', en: 'ROT13 Converter' }),
    description: Object.freeze({ ar: 'طبّق استبدال ROT13 على الحروف الإنجليزية للترميز أو الفك.', en: 'Apply ROT13 substitution to English letters for encoding or decoding.' }),
    note: Object.freeze({ ar: 'تطبيق العملية مرتين يعيد النص الأصلي.', en: 'Applying ROT13 twice restores the original text.' }),
    inputs: Object.freeze([textInput('text', { ar: 'النص', en: 'Text' }, 'Hello World')]),
    calculate(values, language) {
        const converted = values.text.replace(/[a-z]/gi, (character) => {
            const start = character <= 'Z' ? 65 : 97;
            return String.fromCharCode(((character.charCodeAt(0) - start + 13) % 26) + start);
        });
        return output(converted, localized(language, 'ناتج ROT13', 'ROT13 result'));
    },
});

const natoConverter = Object.freeze({
    id: 'nato-phonetic-alphabet-converter',
    category: 'text',
    icon: 'ABC',
    title: Object.freeze({ ar: 'محول أبجدية الناتو الصوتية', en: 'NATO Phonetic Alphabet Converter' }),
    description: Object.freeze({ ar: 'حوّل الحروف والأرقام إلى كلمات الأبجدية الصوتية القياسية.', en: 'Convert letters and digits into standard NATO phonetic words.' }),
    note: Object.freeze({ ar: 'تساعد الأبجدية الصوتية في توضيح التهجئة عبر الاتصال الصوتي.', en: 'The phonetic alphabet clarifies spelling in voice communication.' }),
    inputs: Object.freeze([textInput('text', { ar: 'النص', en: 'Text' }, 'TOOLS 24', 4)]),
    calculate(values, language) {
        const converted = values.text.toUpperCase().split('').map((character) =>
            character === ' ' ? '/' : nato[character] ?? character).join(' ');
        return output(converted, localized(language, 'الأبجدية الصوتية', 'Phonetic spelling'));
    },
});

const unicodeConverter = Object.freeze({
    id: 'unicode-code-point-converter',
    category: 'developer',
    icon: 'U+',
    title: Object.freeze({ ar: 'محول نقاط Unicode', en: 'Unicode Code Point Converter' }),
    description: Object.freeze({ ar: 'حوّل النص إلى نقاط Unicode أو أعد صيغة U+ إلى أحرف.', en: 'Convert text into Unicode code points or decode U+ notation.' }),
    note: Object.freeze({ ar: 'يدعم الأحرف خارج النطاق الأساسي مثل الرموز التعبيرية.', en: 'Supports characters outside the basic multilingual plane, including emoji.' }),
    inputs: Object.freeze([
        textInput('text', { ar: 'النص أو نقاط Unicode', en: 'Text or Unicode points' }, 'أدواتي 🚀', 4),
        selectInput('operation', { ar: 'العملية', en: 'Operation' }, directionOptions),
    ]),
    calculate(values, language) {
        try {
            if (values.operation === 'encode') {
                return output([...values.text].map((character) =>
                    `U+${character.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`).join(' '), localized(language, 'نقاط Unicode', 'Unicode code points'));
            }
            const points = values.text.trim().split(/\s+/).map((token) => {
                if (!/^U\+[0-9a-f]{1,6}$/i.test(token)) {
                    throw new Error();
                }
                return Number.parseInt(token.slice(2), 16);
            });
            return output(String.fromCodePoint(...points), localized(language, 'النص المفكوك', 'Decoded text'));
        } catch {
            throw new Error(localized(language, 'استخدم صيغة مثل U+0041 U+1F680.', 'Use notation such as U+0041 U+1F680.'));
        }
    },
});

function normalizedLetters(value) {
    return value.toLocaleLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]/gu, '');
}

const palindromeChecker = Object.freeze({
    id: 'palindrome-checker',
    category: 'text',
    icon: '↔',
    title: Object.freeze({ ar: 'فاحص النص المتناظر', en: 'Palindrome Checker' }),
    description: Object.freeze({ ar: 'تحقق مما إذا كان النص يُقرأ بالطريقة نفسها من الاتجاهين.', en: 'Check whether text reads the same forward and backward.' }),
    note: Object.freeze({ ar: 'يتجاهل المسافات وعلامات الترقيم وحالة الأحرف.', en: 'Ignores spacing, punctuation and letter case.' }),
    inputs: Object.freeze([textInput('text', { ar: 'النص', en: 'Text' }, 'Never odd or even', 4)]),
    calculate(values, language) {
        const normalized = normalizedLetters(values.text);
        const matches = normalized.length > 0 && normalized === [...normalized].reverse().join('');
        return output(localized(language, matches ? 'نعم' : 'لا', matches ? 'Yes' : 'No'), localized(language, matches ? 'النص متناظر' : 'النص غير متناظر', matches ? 'Palindrome' : 'Not a palindrome'), `${normalized.length} characters`);
    },
});

const anagramChecker = Object.freeze({
    id: 'anagram-checker',
    category: 'text',
    icon: '⇄A',
    title: Object.freeze({ ar: 'فاحص إعادة ترتيب الحروف', en: 'Anagram Checker' }),
    description: Object.freeze({ ar: 'تحقق مما إذا كان نصان يحتويان على الحروف نفسها بترتيب مختلف.', en: 'Check whether two texts contain the same letters in a different order.' }),
    note: Object.freeze({ ar: 'يتجاهل المسافات والترقيم وحالة الأحرف.', en: 'Ignores spaces, punctuation and letter case.' }),
    inputs: Object.freeze([
        textInput('first', { ar: 'النص الأول', en: 'First text' }, 'listen', 3),
        textInput('second', { ar: 'النص الثاني', en: 'Second text' }, 'silent', 3),
    ]),
    calculate(values, language) {
        const sort = (value) => [...normalizedLetters(value)].sort().join('');
        const first = sort(values.first);
        const matches = first.length > 0 && first === sort(values.second);
        return output(localized(language, matches ? 'متطابقان' : 'غير متطابقين', matches ? 'Anagrams' : 'Not anagrams'), localized(language, 'نتيجة المقارنة', 'Comparison result'));
    },
});

const initialsGenerator = Object.freeze({
    id: 'initials-generator',
    category: 'text',
    icon: 'AB',
    title: Object.freeze({ ar: 'مولد الأحرف الأولى', en: 'Initials Generator' }),
    description: Object.freeze({ ar: 'استخرج الأحرف الأولى من اسم أو عنوان طويل.', en: 'Extract initials from a name or multi-word title.' }),
    note: Object.freeze({ ar: 'يدعم الكلمات العربية والإنجليزية وأحرف Unicode.', en: 'Supports Arabic, English and other Unicode words.' }),
    inputs: Object.freeze([textInput('text', { ar: 'الاسم أو العنوان', en: 'Name or title' }, 'Adawaty Free Tools Platform', 3)]),
    calculate(values, language) {
        const words = values.text.trim().match(/[\p{L}\p{N}]+/gu) ?? [];
        const initials = words.map((word) => [...word][0]).join('').toLocaleUpperCase();
        return output(initials, localized(language, `${words.length} كلمة`, `${words.length} words`));
    },
});

const vowelConsonantCounter = Object.freeze({
    id: 'vowel-consonant-counter',
    category: 'text',
    icon: 'A/Z',
    title: Object.freeze({ ar: 'عداد حروف العلة والساكنة', en: 'Vowel and Consonant Counter' }),
    description: Object.freeze({ ar: 'احسب حروف العلة والحروف الأخرى في النص العربي أو الإنجليزي.', en: 'Count vowel-like and other letters in Arabic or English text.' }),
    note: Object.freeze({ ar: 'تُعامل ا وأشكالها و و ي كحروف علة عربية لأغراض العد العام.', en: 'Arabic alef forms, waw and ya are treated as vowel-like for general counting.' }),
    inputs: Object.freeze([textInput('text', { ar: 'النص', en: 'Text' }, 'Adawaty أدواتي', 4)]),
    calculate(values, language) {
        const letters = values.text.match(/\p{L}/gu) ?? [];
        const vowels = letters.filter((letter) => /[aeiouاويأإآ]/iu.test(letter)).length;
        return output(vowels, localized(language, 'حروف العلة', 'Vowels'), localized(language, `الحروف الأخرى: ${letters.length - vowels}`, `Other letters: ${letters.length - vowels}`));
    },
});

const wordFrequency = Object.freeze({
    id: 'word-frequency-analyzer',
    category: 'text',
    icon: 'ƒ',
    title: Object.freeze({ ar: 'محلل تكرار الكلمات', en: 'Word Frequency Analyzer' }),
    description: Object.freeze({ ar: 'رتب الكلمات حسب عدد مرات ظهورها في النص.', en: 'Rank words by how often they appear in text.' }),
    note: Object.freeze({ ar: 'يتجاهل حالة الأحرف وعلامات الترقيم.', en: 'Letter case and punctuation are ignored.' }),
    inputs: Object.freeze([textInput('text', { ar: 'النص', en: 'Text' }, 'tools make work easier and tools save time')]),
    calculate(values, language) {
        const words = values.text.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
        const counts = new Map();
        for (const word of words) {
            counts.set(word, (counts.get(word) ?? 0) + 1);
        }
        const ranked = [...counts].sort((left, right) =>
            right[1] - left[1] || left[0].localeCompare(right[0]));
        return output(ranked.map(([word, count]) => `${word}: ${count}`).join('\n'), localized(language, `${ranked.length} كلمة فريدة`, `${ranked.length} unique words`), localized(language, `إجمالي الكلمات: ${words.length}`, `Total words: ${words.length}`));
    },
});

const textEncodingDefinitions = Object.freeze({
    [morseTranslator.id]: morseTranslator,
    [binaryTextConverter.id]: binaryTextConverter,
    [rot13Converter.id]: rot13Converter,
    [natoConverter.id]: natoConverter,
    [unicodeConverter.id]: unicodeConverter,
    [palindromeChecker.id]: palindromeChecker,
    [anagramChecker.id]: anagramChecker,
    [initialsGenerator.id]: initialsGenerator,
    [vowelConsonantCounter.id]: vowelConsonantCounter,
    [wordFrequency.id]: wordFrequency,
});

export { textEncodingDefinitions };

// END OF FILE
