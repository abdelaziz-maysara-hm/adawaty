const numberFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 4,
});

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
}

function numberInput(id, label, placeholder, options = {}) {
    return Object.freeze({
        id,
        type: 'number',
        min: options.min ?? 0,
        max: options.max ?? 1_000_000_000,
        step: options.step ?? 1,
        label: Object.freeze(label),
        unit: Object.freeze(options.unit ?? { ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

function textInput(id, label, placeholder) {
    return Object.freeze({
        id,
        type: 'textarea',
        rows: 3,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function selectInput(id, label, options) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map((option) => Object.freeze({
            value: option.value,
            label: Object.freeze(option.label),
        }))),
    });
}

function parseIpv4(value) {
    const parts = String(value).trim().split('.');

    if (
        parts.length !== 4
        || parts.some((part) => !/^\d{1,3}$/.test(part))
    ) {
        throw new Error('Invalid IPv4 address.');
    }

    const octets = parts.map(Number);

    if (octets.some((octet) => octet > 255)) {
        throw new Error('Invalid IPv4 address.');
    }

    return octets;
}

function ipv4ToInteger(value) {
    return parseIpv4(value).reduce(
        (result, octet) => ((result * 256) + octet) >>> 0,
        0,
    );
}

function integerToIpv4(value) {
    const unsigned = value >>> 0;
    return [
        (unsigned >>> 24) & 255,
        (unsigned >>> 16) & 255,
        (unsigned >>> 8) & 255,
        unsigned & 255,
    ].join('.');
}

function prefixMask(prefix) {
    return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}

function subnetDetails(address, prefix) {
    const ip = ipv4ToInteger(address);
    const mask = prefixMask(prefix);
    const network = (ip & mask) >>> 0;
    const broadcast = (network | (~mask >>> 0)) >>> 0;
    const total = 2 ** (32 - prefix);
    const usable = prefix >= 31 ? total : Math.max(0, total - 2);

    return {
        network: integerToIpv4(network),
        broadcast: integerToIpv4(broadcast),
        mask: integerToIpv4(mask),
        first: integerToIpv4(prefix >= 31 ? network : network + 1),
        last: integerToIpv4(prefix >= 31 ? broadcast : broadcast - 1),
        total,
        usable,
    };
}

function passwordAlphabet(values) {
    const alphabets = {
        letters: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lettersNumbers: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        all: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+',
    };
    return alphabets[values.characters] ?? alphabets.all;
}

function secureRandomIndex(maximum) {
    const cryptoApi = globalThis.crypto;

    if (!cryptoApi?.getRandomValues) {
        throw new Error('Secure randomness is unavailable in this browser.');
    }

    const limit = Math.floor(0x100000000 / maximum) * maximum;
    const buffer = new Uint32Array(1);
    let value;

    do {
        cryptoApi.getRandomValues(buffer);
        [value] = buffer;
    } while (value >= limit);

    return value % maximum;
}

function passwordScore(password) {
    let pool = 0;
    const checks = [
        [/[a-z]/, 26],
        [/[A-Z]/, 26],
        [/\d/, 10],
        [/[^A-Za-z0-9]/, 33],
    ];

    for (const [pattern, size] of checks) {
        if (pattern.test(password)) {
            pool += size;
        }
    }

    return {
        entropy: password.length && pool
            ? password.length * Math.log2(pool)
            : 0,
        variety: checks.filter(([pattern]) => pattern.test(password)).length,
    };
}

const passwordGenerator = Object.freeze({
    id: 'password-generator',
    category: 'security-network',
    icon: '***',
    title: Object.freeze({ ar: 'مولد كلمات مرور آمنة', en: 'Secure Password Generator' }),
    description: Object.freeze({ ar: 'أنشئ كلمة مرور عشوائية قوية محليًا داخل متصفحك.', en: 'Create a strong random password locally in your browser.' }),
    note: Object.freeze({ ar: 'تستخدم الأداة مولد الأرقام العشوائية الآمن في المتصفح.', en: 'Uses the browser cryptographic random-number generator.' }),
    inputs: Object.freeze([
        numberInput('length', { ar: 'الطول', en: 'Length' }, 20, { min: 8, max: 128 }),
        selectInput('characters', { ar: 'مجموعة الرموز', en: 'Character set' }, [
            { value: 'all', label: { ar: 'حروف وأرقام ورموز', en: 'Letters, numbers & symbols' } },
            { value: 'lettersNumbers', label: { ar: 'حروف وأرقام', en: 'Letters & numbers' } },
            { value: 'letters', label: { ar: 'حروف فقط', en: 'Letters only' } },
        ]),
    ]),
    calculate(values, language) {
        const alphabet = passwordAlphabet(values);
        let password = '';

        for (let index = 0; index < values.length; index += 1) {
            password += alphabet[secureRandomIndex(alphabet.length)];
        }

        return output(password, localized(language, 'كلمة المرور الجديدة', 'Generated password'), `${values.length} characters`);
    },
});

const passwordStrength = Object.freeze({
    id: 'password-strength-checker',
    category: 'security-network',
    icon: 'S',
    title: Object.freeze({ ar: 'فاحص قوة كلمة المرور', en: 'Password Strength Checker' }),
    description: Object.freeze({ ar: 'قيّم طول كلمة المرور وتنوع رموزها دون إرسالها لأي خادم.', en: 'Assess password length and character variety without sending it anywhere.' }),
    note: Object.freeze({ ar: 'التقييم إرشادي؛ استخدم كلمة فريدة والمصادقة متعددة العوامل.', en: 'This is guidance; use a unique password and multi-factor authentication.' }),
    inputs: Object.freeze([textInput('password', { ar: 'كلمة المرور', en: 'Password' }, 'Enter a password')]),
    calculate(values, language) {
        const password = values.password;
        const { entropy, variety } = passwordScore(password);
        const rating = entropy >= 80 && variety >= 3
            ? localized(language, 'قوية جدًا', 'Very strong')
            : entropy >= 60 && variety >= 3
                ? localized(language, 'قوية', 'Strong')
                : entropy >= 40
                    ? localized(language, 'متوسطة', 'Moderate')
                    : localized(language, 'ضعيفة', 'Weak');
        return output(rating, localized(language, 'التقييم', 'Strength'), `${Math.round(entropy)} bits · ${password.length} characters`);
    },
});

const passwordEntropy = Object.freeze({
    id: 'password-entropy-calculator',
    category: 'security-network',
    icon: 'H',
    title: Object.freeze({ ar: 'حاسبة إنتروبيا كلمة المرور', en: 'Password Entropy Calculator' }),
    description: Object.freeze({ ar: 'قدّر عدد بتات إنتروبيا كلمة المرور حسب طولها وتنوع رموزها.', en: 'Estimate password entropy in bits from length and character variety.' }),
    note: Object.freeze({ ar: 'النتيجة تقدير رياضي ولا تكشف الأنماط المتوقعة في كلمات المرور.', en: 'This mathematical estimate does not detect predictable password patterns.' }),
    inputs: Object.freeze([textInput('password', { ar: 'كلمة المرور', en: 'Password' }, 'Correct-Horse-2026!')]),
    calculate(values, language) {
        const { entropy, variety } = passwordScore(values.password);
        return output(
            `${numberFormatter.format(entropy)} bits`,
            localized(language, 'الإنتروبيا التقديرية', 'Estimated entropy'),
            localized(language, `${variety} مجموعات رموز مستخدمة`, `${variety} character classes used`),
        );
    },
});

const subnetCalculator = Object.freeze({
    id: 'ipv4-subnet-calculator',
    category: 'security-network',
    icon: 'IP',
    title: Object.freeze({ ar: 'حاسبة شبكة IPv4 الفرعية', en: 'IPv4 Subnet Calculator' }),
    description: Object.freeze({ ar: 'احسب عنوان الشبكة والبث وقناع الشبكة من عنوان IPv4 والبادئة.', en: 'Calculate network, broadcast and subnet mask from an IPv4 address and prefix.' }),
    note: Object.freeze({ ar: 'تدعم بادئات CIDR من /0 إلى /32.', en: 'Supports CIDR prefixes from /0 through /32.' }),
    inputs: Object.freeze([
        textInput('address', { ar: 'عنوان IPv4', en: 'IPv4 address' }, '192.168.1.25'),
        numberInput('prefix', { ar: 'بادئة CIDR', en: 'CIDR prefix' }, 24, { min: 0, max: 32 }),
    ]),
    calculate(values, language) {
        const details = subnetDetails(values.address, values.prefix);
        return output(
            `${details.network}/${values.prefix}`,
            localized(language, 'عنوان الشبكة', 'Network address'),
            `${localized(language, 'القناع', 'Mask')}: ${details.mask} · ${localized(language, 'البث', 'Broadcast')}: ${details.broadcast}`,
        );
    },
});

const cidrRange = Object.freeze({
    id: 'cidr-range-calculator',
    category: 'security-network',
    icon: '/24',
    title: Object.freeze({ ar: 'حاسبة نطاق CIDR', en: 'CIDR Range Calculator' }),
    description: Object.freeze({ ar: 'اعرض أول وآخر عنوان وعدد العناوين المتاحة في كتلة CIDR.', en: 'Find the first and last address and capacity of a CIDR block.' }),
    note: Object.freeze({ ar: 'النطاقات /31 و/32 تُعرض وفق الاستخدام الحديث للوصلات والعناوين المفردة.', en: '/31 and /32 ranges follow modern point-to-point and host usage.' }),
    inputs: Object.freeze([
        textInput('address', { ar: 'عنوان داخل الشبكة', en: 'Address in network' }, '10.20.30.40'),
        numberInput('prefix', { ar: 'بادئة CIDR', en: 'CIDR prefix' }, 20, { min: 0, max: 32 }),
    ]),
    calculate(values, language) {
        const details = subnetDetails(values.address, values.prefix);
        return output(
            `${details.first} – ${details.last}`,
            localized(language, 'نطاق العناوين', 'Address range'),
            `${details.total.toLocaleString('en-US')} total · ${details.usable.toLocaleString('en-US')} usable`,
        );
    },
});

const ipToBinary = Object.freeze({
    id: 'ip-address-to-binary',
    category: 'security-network',
    icon: '01',
    title: Object.freeze({ ar: 'تحويل عنوان IP إلى ثنائي', en: 'IP Address to Binary' }),
    description: Object.freeze({ ar: 'حوّل عنوان IPv4 إلى أربع مجموعات ثنائية بطول ثمانية بتات.', en: 'Convert an IPv4 address into four eight-bit binary groups.' }),
    note: Object.freeze({ ar: 'يتم التحقق من كل جزء قبل التحويل.', en: 'Every octet is validated before conversion.' }),
    inputs: Object.freeze([textInput('address', { ar: 'عنوان IPv4', en: 'IPv4 address' }, '192.168.1.1')]),
    calculate(values, language) {
        const binary = parseIpv4(values.address)
            .map((octet) => octet.toString(2).padStart(8, '0'))
            .join('.');
        return output(binary, localized(language, 'الصيغة الثنائية', 'Binary representation'));
    },
});

const binaryToIp = Object.freeze({
    id: 'binary-to-ip-address',
    category: 'security-network',
    icon: 'IP',
    title: Object.freeze({ ar: 'تحويل الثنائي إلى عنوان IP', en: 'Binary to IP Address' }),
    description: Object.freeze({ ar: 'حوّل أربع مجموعات ثنائية إلى عنوان IPv4 عشري.', en: 'Convert four binary octets into a decimal IPv4 address.' }),
    note: Object.freeze({ ar: 'استخدم نقطة بين كل مجموعة من ثمانية بتات.', en: 'Separate each eight-bit group with a dot.' }),
    inputs: Object.freeze([textInput('binary', { ar: 'العنوان الثنائي', en: 'Binary address' }, '11000000.10101000.00000001.00000001')]),
    calculate(values, language) {
        const groups = values.binary.trim().split('.');
        if (groups.length !== 4 || groups.some((group) => !/^[01]{8}$/.test(group))) {
            throw new Error(localized(language, 'أدخل أربع مجموعات من 8 بتات.', 'Enter four 8-bit binary groups.'));
        }
        return output(groups.map((group) => Number.parseInt(group, 2)).join('.'), localized(language, 'عنوان IPv4', 'IPv4 address'));
    },
});

const macFormatter = Object.freeze({
    id: 'mac-address-formatter',
    category: 'security-network',
    icon: 'MAC',
    title: Object.freeze({ ar: 'منسق عنوان MAC', en: 'MAC Address Formatter' }),
    description: Object.freeze({ ar: 'تحقق من عنوان MAC وأعد تنسيقه بالنقطتين أو الشرطات أو صيغة Cisco.', en: 'Validate and format a MAC address with colons, hyphens or Cisco notation.' }),
    note: Object.freeze({ ar: 'تقبل الأداة العناوين مع الفواصل أو بدونها.', en: 'Accepts addresses with or without separators.' }),
    inputs: Object.freeze([
        textInput('address', { ar: 'عنوان MAC', en: 'MAC address' }, 'A1B2C3D4E5F6'),
        selectInput('format', { ar: 'التنسيق', en: 'Format' }, [
            { value: 'colon', label: { ar: 'نقطتان', en: 'Colon' } },
            { value: 'hyphen', label: { ar: 'شرطة', en: 'Hyphen' } },
            { value: 'cisco', label: { ar: 'صيغة Cisco', en: 'Cisco' } },
        ]),
    ]),
    calculate(values, language) {
        const compact = values.address.replaceAll(/[^a-fA-F0-9]/g, '').toUpperCase();
        if (!/^[A-F0-9]{12}$/.test(compact)) {
            throw new Error(localized(language, 'عنوان MAC غير صالح.', 'Invalid MAC address.'));
        }
        const formatted = values.format === 'cisco'
            ? compact.match(/.{4}/g).join('.')
            : compact.match(/.{2}/g).join(values.format === 'hyphen' ? '-' : ':');
        return output(formatted, localized(language, 'العنوان المنسق', 'Formatted address'));
    },
});

const knownPorts = Object.freeze({
    20: ['FTP Data', 'TCP'],
    21: ['FTP Control', 'TCP'],
    22: ['SSH', 'TCP'],
    25: ['SMTP', 'TCP'],
    53: ['DNS', 'TCP/UDP'],
    67: ['DHCP Server', 'UDP'],
    68: ['DHCP Client', 'UDP'],
    80: ['HTTP', 'TCP'],
    110: ['POP3', 'TCP'],
    123: ['NTP', 'UDP'],
    143: ['IMAP', 'TCP'],
    443: ['HTTPS', 'TCP'],
    3306: ['MySQL', 'TCP'],
    5432: ['PostgreSQL', 'TCP'],
    6379: ['Redis', 'TCP'],
});

const portLookup = Object.freeze({
    id: 'network-port-lookup',
    category: 'security-network',
    icon: ':80',
    title: Object.freeze({ ar: 'دليل منافذ الشبكة', en: 'Network Port Lookup' }),
    description: Object.freeze({ ar: 'اعرف الخدمة والبروتوكول الشائعين لأهم منافذ الشبكة.', en: 'Look up the common service and protocol for popular network ports.' }),
    note: Object.freeze({ ar: 'الاستخدام الفعلي للمنفذ قد يختلف حسب إعداد النظام.', en: 'Actual port usage can vary with system configuration.' }),
    inputs: Object.freeze([numberInput('port', { ar: 'رقم المنفذ', en: 'Port number' }, 443, { min: 0, max: 65535 })]),
    calculate(values, language) {
        const record = knownPorts[values.port];
        return output(
            record?.[0] ?? localized(language, 'غير موجود في القائمة المختصرة', 'Not in the common-port list'),
            localized(language, `المنفذ ${values.port}`, `Port ${values.port}`),
            record ? `${record[1]} protocol` : localized(language, 'قد يكون منفذًا مسجلًا أو خاصًا.', 'It may be registered or private-use.'),
        );
    },
});

const transferTime = Object.freeze({
    id: 'data-transfer-time-calculator',
    category: 'security-network',
    icon: 'Gbps',
    title: Object.freeze({ ar: 'حاسبة زمن نقل البيانات', en: 'Data Transfer Time Calculator' }),
    description: Object.freeze({ ar: 'قدّر زمن نقل ملف من حجمه وسرعة الاتصال.', en: 'Estimate transfer duration from file size and connection speed.' }),
    note: Object.freeze({ ar: 'النتيجة نظرية ولا تشمل ازدحام الشبكة أو الحمل الإضافي للبروتوكولات.', en: 'The estimate excludes congestion and protocol overhead.' }),
    inputs: Object.freeze([
        numberInput('size', { ar: 'حجم الملف', en: 'File size' }, 10, { min: 0.000001, unit: { ar: 'جيجابايت', en: 'GB' }, step: 'any' }),
        numberInput('speed', { ar: 'سرعة الاتصال', en: 'Connection speed' }, 100, { min: 0.000001, unit: { ar: 'ميجابت/ث', en: 'Mbps' }, step: 'any' }),
    ]),
    calculate(values, language) {
        const seconds = (values.size * 8_000) / values.speed;
        const display = seconds >= 3600
            ? `${numberFormatter.format(seconds / 3600)} h`
            : seconds >= 60
                ? `${numberFormatter.format(seconds / 60)} min`
                : `${numberFormatter.format(seconds)} s`;
        return output(display, localized(language, 'الزمن النظري', 'Theoretical transfer time'), `${numberFormatter.format(seconds)} seconds`);
    },
});

const securityNetworkDefinitions = Object.freeze({
    [passwordGenerator.id]: passwordGenerator,
    [passwordStrength.id]: passwordStrength,
    [passwordEntropy.id]: passwordEntropy,
    [subnetCalculator.id]: subnetCalculator,
    [cidrRange.id]: cidrRange,
    [ipToBinary.id]: ipToBinary,
    [binaryToIp.id]: binaryToIp,
    [macFormatter.id]: macFormatter,
    [portLookup.id]: portLookup,
    [transferTime.id]: transferTime,
});

export { securityNetworkDefinitions };

// END OF FILE
