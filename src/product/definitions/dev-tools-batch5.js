function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value, label, details };
}

function textInput(id, label, placeholder) {
    return Object.freeze({
        id,
        type: 'textarea',
        rows: 10,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function devTool(config) {
    return Object.freeze({
        category: 'developer',
        ...config,
    });
}

/**
 * Minimal recursive-descent XML parser covering elements, nested children,
 * text content, and self-closing tags. Attributes are intentionally not
 * modeled in the JSON output (element structure and text content only) to
 * keep the conversion predictable and simple.
 */
function parseXmlToObject(xmlText, language) {
    const text = xmlText.trim();
    let position = 0;

    function skipWhitespace() {
        while (position < text.length && /\s/.test(text[position])) position += 1;
    }

    function fail(message) {
        throw new Error(localized(
            language,
            `تعذر تحليل XML: ${message}`,
            `Could not parse XML: ${message}`,
        ));
    }

    function parseElement() {
        skipWhitespace();
        if (text[position] !== '<') fail(localized(language, 'وسم متوقع', 'expected a tag'));
        position += 1;

        let tagName = '';
        while (position < text.length && !/[\s/>]/.test(text[position])) {
            tagName += text[position];
            position += 1;
        }

        while (position < text.length && text[position] !== '>' && text[position] !== '/') {
            position += 1;
        }

        if (text[position] === '/') {
            position += 2;
            return { tagName, textValue: '', children: [] };
        }
        position += 1;

        const children = [];
        let textValue = '';
        for (;;) {
            if (position >= text.length) fail(`</${tagName}>`);
            if (text.slice(position, position + 2) === '</') {
                position += 2;
                while (position < text.length && text[position] !== '>') position += 1;
                position += 1;
                break;
            }
            if (text[position] === '<') {
                children.push(parseElement());
            } else {
                const start = position;
                while (position < text.length && text[position] !== '<') position += 1;
                textValue += text.slice(start, position);
            }
        }

        return { tagName, textValue: textValue.trim(), children };
    }

    function toPlainValue(node) {
        if (node.children.length === 0) return node.textValue;
        const result = {};
        for (const child of node.children) {
            const value = toPlainValue(child);
            if (result[child.tagName] === undefined) {
                result[child.tagName] = value;
            } else if (Array.isArray(result[child.tagName])) {
                result[child.tagName].push(value);
            } else {
                result[child.tagName] = [result[child.tagName], value];
            }
        }
        return result;
    }

    const root = parseElement();
    return { [root.tagName]: toPlainValue(root) };
}

const xmlToJsonConverter = devTool({
    id: 'xml-to-json-converter',
    icon: 'XML→',
    title: Object.freeze({ ar: 'تحويل XML إلى JSON', en: 'XML to JSON Converter' }),
    description: Object.freeze({
        ar: 'حوّل مستند XML إلى كائن JSON، مع تحويل الوسوم المتكررة تلقائيًا إلى مصفوفات.',
        en: 'Convert an XML document into a JSON object, automatically turning repeated sibling tags into arrays.',
    }),
    note: Object.freeze({
        ar: 'خصائص الوسوم (Attributes) لا تُضمَّن في الناتج حاليًا، فقط بنية العناصر ومحتواها النصي.',
        en: 'Tag attributes are not currently included in the output, only element structure and text content.',
    }),
    inputs: Object.freeze([
        textInput('xml', { ar: 'XML', en: 'XML' }, '<root><name>Adawaty</name><tools><tool>PDF</tool><tool>Video</tool></tools></root>'),
    ]),
    calculate(values, language) {
        if (!values.xml.trim()) {
            throw new Error(localized(language, 'أدخل محتوى XML.', 'Enter some XML content.'));
        }
        const result = parseXmlToObject(values.xml, language);
        return output(
            JSON.stringify(result, null, 2),
            localized(language, 'JSON الناتج جاهز', 'The resulting JSON is ready'),
        );
    },
});

/**
 * Checks XML well-formedness via a tag-matching stack (open/close pairing,
 * a single root element, no unclosed tags). This is deliberately not using
 * the browser-only DOMParser, since the automated test suite executes tool
 * logic in Node, not a browser.
 */
function checkXmlWellFormed(xmlText) {
    const text = xmlText.trim();
    if (text.length === 0) {
        return { valid: false, reasonKey: 'empty' };
    }

    const tagPattern = /<(\/?)([a-zA-Z_][\w:-]*)[^>]*?(\/?)>/g;
    const stack = [];
    let rootCount = 0;
    let match = tagPattern.exec(text);

    while (match !== null) {
        const [, isClosing, tagName, isSelfClosing] = match;

        if (!isSelfClosing) {
            if (isClosing) {
                const expected = stack.pop();
                if (expected !== tagName) {
                    return { valid: false, reasonKey: 'mismatch', tagName, expected };
                }
            } else {
                if (stack.length === 0) {
                    rootCount += 1;
                    if (rootCount > 1) {
                        return { valid: false, reasonKey: 'multiple-roots' };
                    }
                }
                stack.push(tagName);
            }
        }

        match = tagPattern.exec(text);
    }

    if (stack.length > 0) {
        return { valid: false, reasonKey: 'unclosed', tagName: stack[stack.length - 1] };
    }
    if (rootCount === 0) {
        return { valid: false, reasonKey: 'no-elements' };
    }

    return { valid: true };
}

function describeXmlValidation(result, language) {
    if (result.valid) {
        return localized(language, 'المستند صحيح البنية ✓', 'The document is well-formed \u2713');
    }
    switch (result.reasonKey) {
        case 'empty':
            return localized(language, 'المحتوى فارغ.', 'The content is empty.');
        case 'mismatch':
            return localized(
                language,
                `وسم إغلاق غير مطابق: توقعت </${result.expected}> لكن وجدت </${result.tagName}>`,
                `Mismatched closing tag: expected </${result.expected}> but found </${result.tagName}>`,
            );
        case 'unclosed':
            return localized(
                language,
                `وسم غير مغلق: <${result.tagName}>`,
                `Unclosed tag: <${result.tagName}>`,
            );
        case 'multiple-roots':
            return localized(
                language,
                'المستند يحتوي على أكثر من عنصر جذر واحد.',
                'The document has more than one root element.',
            );
        default:
            return localized(language, 'لا يوجد أي عنصر XML.', 'No XML element was found.');
    }
}

const xmlValidator = devTool({
    id: 'xml-validator',
    icon: 'XML✓',
    title: Object.freeze({ ar: 'التحقق من صحة بنية XML', en: 'XML Well-Formedness Validator' }),
    description: Object.freeze({
        ar: 'تأكد أن مستند XML صحيح البنية: وسوم متطابقة، عنصر جذر واحد، ولا وسوم غير مغلقة.',
        en: 'Check that an XML document is well-formed: matching tags, a single root element, and no unclosed tags.',
    }),
    note: Object.freeze({
        ar: 'هذا فحص بنية أساسي فقط، وليس تحققًا كاملًا من مخطط XSD.',
        en: 'This is a basic structural check only, not full validation against an XSD schema.',
    }),
    inputs: Object.freeze([
        textInput('xml', { ar: 'XML', en: 'XML' }, '<root><item>1</item></root>'),
    ]),
    calculate(values, language) {
        const result = checkXmlWellFormed(values.xml);
        return output(
            result.valid ? localized(language, 'صحيح', 'Valid') : localized(language, 'غير صحيح', 'Invalid'),
            describeXmlValidation(result, language),
        );
    },
});

const VENDOR_PREFIX_MAP = Object.freeze({
    transform: Object.freeze(['-webkit-', '-ms-']),
    transition: Object.freeze(['-webkit-']),
    'user-select': Object.freeze(['-webkit-', '-moz-', '-ms-']),
    'backdrop-filter': Object.freeze(['-webkit-']),
    appearance: Object.freeze(['-webkit-', '-moz-']),
    'box-sizing': Object.freeze(['-webkit-', '-moz-']),
    'background-clip': Object.freeze(['-webkit-']),
    'text-size-adjust': Object.freeze(['-webkit-', '-ms-']),
});

function addVendorPrefixes(cssText) {
    const declarations = cssText.split(';').map((line) => line.trim()).filter(Boolean);
    const outputLines = [];

    for (const declaration of declarations) {
        const separatorIndex = declaration.indexOf(':');
        if (separatorIndex === -1) {
            outputLines.push(`${declaration};`);
            continue;
        }

        const property = declaration.slice(0, separatorIndex).trim();
        const value = declaration.slice(separatorIndex + 1).trim();
        const prefixes = VENDOR_PREFIX_MAP[property];

        if (prefixes) {
            for (const prefix of prefixes) {
                outputLines.push(`${prefix}${property}: ${value};`);
            }
        }
        outputLines.push(`${property}: ${value};`);
    }

    return outputLines.join('\n');
}

const cssPrefixer = devTool({
    id: 'css-prefixer',
    icon: 'CSS-webkit',
    title: Object.freeze({ ar: 'إضافة بادئات المتصفحات لـCSS', en: 'CSS Vendor Prefixer' }),
    description: Object.freeze({
        ar: 'أضف بادئات المتصفحات (webkit، moz، ms) تلقائيًا لخصائص CSS المعروفة باحتياجها لدعم متصفحات أوسع.',
        en: 'Automatically add browser vendor prefixes (webkit, moz, ms) for CSS properties known to need them for wider browser support.',
    }),
    note: Object.freeze({
        ar: 'يغطي مجموعة من الخصائص الشائعة الاحتياج للبادئات؛ معظم المتصفحات الحديثة لم تعد تحتاج بادئات لخصائص كثيرة أصلًا.',
        en: 'Covers a set of commonly-prefixed properties; most modern browsers no longer need prefixes for many properties at all.',
    }),
    inputs: Object.freeze([
        textInput('css', { ar: 'قواعد CSS', en: 'CSS declarations' }, 'transform: rotate(45deg);\nuser-select: none;'),
    ]),
    calculate(values, language) {
        if (!values.css.trim()) {
            throw new Error(localized(language, 'أدخل قواعد CSS.', 'Enter some CSS declarations.'));
        }
        return output(
            addVendorPrefixes(values.css),
            localized(language, 'CSS مع البادئات جاهز', 'The prefixed CSS is ready'),
        );
    },
});

const devToolsBatch5Definitions = Object.freeze({
    [xmlToJsonConverter.id]: xmlToJsonConverter,
    [xmlValidator.id]: xmlValidator,
    [cssPrefixer.id]: cssPrefixer,
});

export { devToolsBatch5Definitions };

// END OF FILE
