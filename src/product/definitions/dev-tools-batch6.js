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
 * A basic indentation-based JS formatter: inserts newlines and indentation
 * after `{`, `}`, and `;` only. Deliberately keeps parentheses inline
 * (function calls and parameter lists stay on one line) rather than
 * breaking on every `(`, which is what a naive first attempt got wrong
 * during testing. String contents (single/double/backtick-quoted) are
 * tracked so punctuation inside a string is never treated as code syntax.
 */
function formatJavaScript(code) {
    const lines = [];
    let indent = 0;
    let current = '';
    let inString = false;
    let stringChar = '';

    for (let index = 0; index < code.length; index += 1) {
        const character = code[index];

        if (inString) {
            current += character;
            if (character === stringChar && code[index - 1] !== '\\') {
                inString = false;
            }
            continue;
        }

        if (character === '"' || character === "'" || character === '`') {
            inString = true;
            stringChar = character;
            current += character;
            continue;
        }

        if (character === '{') {
            current += character;
            lines.push('  '.repeat(indent) + current.trim());
            current = '';
            indent += 1;
            continue;
        }

        if (character === '}') {
            if (current.trim()) {
                lines.push('  '.repeat(indent) + current.trim());
                current = '';
            }
            indent = Math.max(0, indent - 1);
            lines.push(`${'  '.repeat(indent)}}`);
            continue;
        }

        if (character === ';') {
            current += character;
            lines.push('  '.repeat(indent) + current.trim());
            current = '';
            continue;
        }

        current += character;
    }

    if (current.trim()) {
        lines.push('  '.repeat(indent) + current.trim());
    }

    return lines.filter((line) => line.trim().length > 0).join('\n');
}

const javascriptFormatter = devTool({
    id: 'javascript-formatter',
    icon: 'JS{}',
    title: Object.freeze({ ar: 'تنسيق كود JavaScript', en: 'JavaScript Formatter' }),
    description: Object.freeze({
        ar: 'أضف مسافات بادئة وأسطرًا جديدة لكود JavaScript مضغوط، عشان يبقى أسهل في القراءة والمراجعة.',
        en: 'Add indentation and line breaks to compact JavaScript code, making it easier to read and review.',
    }),
    note: Object.freeze({
        ar: 'تنسيق مبسط قائم على الأقواس والفواصل المنقوطة، وليس محلل نحوي كامل — قد يحتاج كود معقد جدًا مراجعة يدوية بعده.',
        en: 'A simplified brace/semicolon-based formatter, not a full syntax parser \u2014 very complex code may need manual review afterward.',
    }),
    inputs: Object.freeze([
        textInput('code', { ar: 'كود JavaScript', en: 'JavaScript code' }, 'function add(a,b){return a+b;}'),
    ]),
    calculate(values, language) {
        if (!values.code.trim()) {
            throw new Error(localized(language, 'أدخل كود JavaScript.', 'Enter some JavaScript code.'));
        }
        return output(
            formatJavaScript(values.code),
            localized(language, 'الكود المنسّق جاهز', 'The formatted code is ready'),
        );
    },
});

function generateGuid() {
    const randomHexDigit = () => Math.floor(Math.random() * 16).toString(16);
    const segment = (length) => Array.from({ length }, randomHexDigit).join('');
    return `{${segment(8)}-${segment(4)}-${segment(4)}-${segment(4)}-${segment(12)}}`.toUpperCase();
}

const guidGenerator = devTool({
    id: 'guid-generator',
    icon: '{GUID}',
    title: Object.freeze({ ar: 'مولّد GUID', en: 'GUID Generator' }),
    description: Object.freeze({
        ar: 'أنشئ معرّفًا فريدًا بصيغة GUID الكلاسيكية بأقواس وأحرف كبيرة `{XXXXXXXX-XXXX-...}`، الصيغة الشائعة في أنظمة مثل .NET وWindows.',
        en: 'Generate a unique identifier in the classic braced, uppercase GUID format `{XXXXXXXX-XXXX-...}`, common in systems like .NET and Windows.',
    }),
    note: Object.freeze({
        ar: 'نفس المعيار التقني وراء UUID، لكن بصيغة العرض الكلاسيكية بالأقواس والأحرف الكبيرة. لصيغة UUID القياسية بدون أقواس استخدم أداة مولّد UUID.',
        en: 'The same underlying standard as UUID, but in the classic braced, uppercase display format. For the standard lowercase UUID format without braces, use the UUID Generator tool.',
    }),
    inputs: Object.freeze([]),
    calculate(values, language) {
        return output(
            generateGuid(),
            localized(language, 'GUID الجديد جاهز', 'The new GUID is ready'),
        );
    },
});

/**
 * Reuses the same recursive-descent XML parser approach as
 * xml-to-json-converter (dev-tools-batch5.js) to turn each document into a
 * plain object, then structurally diffs the two objects the same way
 * json-diff does. This catches meaningful content differences while
 * ignoring cosmetic ones like attribute order or extra whitespace --
 * unlike pasting raw XML into the generic line-by-line text-diff-checker.
 */
function parseXmlToObject(xmlText, language) {
    const text = xmlText.trim();
    let position = 0;

    function skipWhitespace() {
        while (position < text.length && /\s/.test(text[position])) position += 1;
    }

    function fail(message) {
        throw new Error(localized(language, `تعذر تحليل XML: ${message}`, `Could not parse XML: ${message}`));
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
        while (position < text.length && text[position] !== '>' && text[position] !== '/') position += 1;

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

function diffStructuralValues(a, b, path = '') {
    const diffs = [];
    if (typeof a !== typeof b) {
        diffs.push({ path: path || '(root)', type: 'type-mismatch' });
        return diffs;
    }
    if (a === null || b === null || typeof a !== 'object') {
        if (a !== b) diffs.push({ path: path || '(root)', type: 'value', a, b });
        return diffs;
    }
    const allKeys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
    for (const key of allKeys) {
        const childPath = path ? `${path}.${key}` : key;
        if (!(key in a)) { diffs.push({ path: childPath, type: 'added', b: b[key] }); continue; }
        if (!(key in b)) { diffs.push({ path: childPath, type: 'removed', a: a[key] }); continue; }
        diffs.push(...diffStructuralValues(a[key], b[key], childPath));
    }
    return diffs;
}

function describeXmlDiff(diff, language) {
    if (diff.type === 'added') {
        return localized(language, `+ ${diff.path}: أُضيف (${JSON.stringify(diff.b)})`, `+ ${diff.path}: added (${JSON.stringify(diff.b)})`);
    }
    if (diff.type === 'removed') {
        return localized(language, `- ${diff.path}: حُذف (كان ${JSON.stringify(diff.a)})`, `- ${diff.path}: removed (was ${JSON.stringify(diff.a)})`);
    }
    if (diff.type === 'type-mismatch') {
        return localized(language, `~ ${diff.path}: نوع مختلف`, `~ ${diff.path}: different type`);
    }
    return localized(
        language,
        `~ ${diff.path}: ${JSON.stringify(diff.a)} → ${JSON.stringify(diff.b)}`,
        `~ ${diff.path}: ${JSON.stringify(diff.a)} → ${JSON.stringify(diff.b)}`,
    );
}

const xmlCompare = devTool({
    id: 'xml-compare',
    icon: 'XML≠',
    title: Object.freeze({ ar: 'مقارنة مستندي XML', en: 'XML Compare' }),
    description: Object.freeze({
        ar: 'قارن بنيويًا بين مستندي XML واعرض كل قيمة أُضيفت أو حُذفت أو تغيّرت، متجاهلاً فروق التباعد والمسافات.',
        en: 'Structurally compare two XML documents and list every value added, removed, or changed, ignoring whitespace differences.',
    }),
    note: Object.freeze({
        ar: 'المقارنة على مستوى محتوى العناصر النصي، وليست على خصائص الوسوم (Attributes).',
        en: 'Comparison is at the element text-content level, not tag attributes.',
    }),
    inputs: Object.freeze([
        textInput('before', { ar: 'XML الأول', en: 'First XML' }, '<root><version>1</version></root>'),
        textInput('after', { ar: 'XML الثاني', en: 'Second XML' }, '<root><version>2</version><name>Adawaty</name></root>'),
    ]),
    calculate(values, language) {
        const before = parseXmlToObject(values.before, language);
        const after = parseXmlToObject(values.after, language);
        const diffs = diffStructuralValues(before, after);

        if (diffs.length === 0) {
            return output(
                localized(language, 'لا توجد فروق', 'No differences'),
                localized(language, 'المستندان متطابقان بنيويًا', 'Both documents are structurally identical'),
            );
        }

        return output(
            String(diffs.length),
            localized(language, 'فرق تم العثور عليه', 'Differences found'),
            diffs.map((diff) => describeXmlDiff(diff, language)).join('\n'),
        );
    },
});

/** Checks brace balance and that every declaration inside a rule block has a colon. */
function validateCssSyntax(css) {
    const errors = [];
    let braceDepth = 0;

    for (const character of css) {
        if (character === '{') braceDepth += 1;
        if (character === '}') braceDepth -= 1;
        if (braceDepth < 0) {
            errors.push({ key: 'unexpected-close' });
            break;
        }
    }
    if (braceDepth > 0) errors.push({ key: 'unclosed' });

    const blockMatches = [...css.matchAll(/\{([^{}]*)\}/g)];
    for (const [, blockContent] of blockMatches) {
        const declarations = blockContent.split(';').map((decl) => decl.trim()).filter(Boolean);
        for (const declaration of declarations) {
            if (!declaration.includes(':')) {
                errors.push({ key: 'no-colon', declaration });
            }
        }
    }

    return { valid: errors.length === 0, errors };
}

function describeCssError(error, language) {
    switch (error.key) {
        case 'unexpected-close':
            return localized(language, 'قوس إغلاق } غير متوقع بدون فتح مطابق.', 'Unexpected closing brace } with no matching open.');
        case 'unclosed':
            return localized(language, 'يوجد قوس فتح { بدون إغلاق مطابق.', 'There is an unclosed opening brace {.');
        case 'no-colon':
            return localized(
                language,
                `تصريح بدون نقطتين رأسيتين: "${error.declaration}"`,
                `Declaration missing a colon: "${error.declaration}"`,
            );
        default:
            return '';
    }
}

const cssValidator = devTool({
    id: 'css-validator',
    icon: 'CSS✓',
    title: Object.freeze({ ar: 'التحقق من صحة CSS', en: 'CSS Syntax Validator' }),
    description: Object.freeze({
        ar: 'تأكد أن كود CSS صحيح البنية: أقواس متوازنة، وكل تصريح فيه خاصية وقيمة مفصولتين بنقطتين رأسيتين.',
        en: 'Check that CSS code is syntactically valid: balanced braces, and every declaration has a property and value separated by a colon.',
    }),
    note: Object.freeze({
        ar: 'هذا فحص بنية أساسي، وليس تحققًا من صحة أسماء الخصائص أو القيم نفسها.',
        en: 'This is a basic structural check, not validation of whether property names or values themselves are correct.',
    }),
    inputs: Object.freeze([
        textInput('css', { ar: 'كود CSS', en: 'CSS code' }, '.box { color: red; padding: 10px; }'),
    ]),
    calculate(values, language) {
        if (!values.css.trim()) {
            throw new Error(localized(language, 'أدخل كود CSS.', 'Enter some CSS code.'));
        }
        const result = validateCssSyntax(values.css);
        return output(
            result.valid ? localized(language, 'صحيح', 'Valid') : localized(language, 'غير صحيح', 'Invalid'),
            result.valid
                ? localized(language, 'الكود صحيح البنية ✓', 'The code is syntactically valid \u2713')
                : localized(language, 'وُجدت مشاكل في البنية', 'Structural issues were found'),
            result.errors.map((error) => describeCssError(error, language)).join('\n'),
        );
    },
});

const devToolsBatch6Definitions = Object.freeze({
    [javascriptFormatter.id]: javascriptFormatter,
    [guidGenerator.id]: guidGenerator,
    [xmlCompare.id]: xmlCompare,
    [cssValidator.id]: cssValidator,
});

export { devToolsBatch6Definitions };

// END OF FILE
