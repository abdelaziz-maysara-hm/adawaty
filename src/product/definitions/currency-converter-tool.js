function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 6,
    minimumFractionDigits: 2,
});

const CURRENCIES = Object.freeze([
    Object.freeze({ code: 'EGP', ar: 'جنيه مصري (EGP)', en: 'Egyptian Pound (EGP)' }),
    Object.freeze({ code: 'USD', ar: 'دولار أمريكي (USD)', en: 'US Dollar (USD)' }),
    Object.freeze({ code: 'EUR', ar: 'يورو (EUR)', en: 'Euro (EUR)' }),
    Object.freeze({ code: 'SAR', ar: 'ريال سعودي (SAR)', en: 'Saudi Riyal (SAR)' }),
    Object.freeze({ code: 'AED', ar: 'درهم إماراتي (AED)', en: 'UAE Dirham (AED)' }),
    Object.freeze({ code: 'GBP', ar: 'جنيه إسترليني (GBP)', en: 'British Pound (GBP)' }),
    Object.freeze({ code: 'KWD', ar: 'دينار كويتي (KWD)', en: 'Kuwaiti Dinar (KWD)' }),
    Object.freeze({ code: 'QAR', ar: 'ريال قطري (QAR)', en: 'Qatari Riyal (QAR)' }),
    Object.freeze({ code: 'JOD', ar: 'دينار أردني (JOD)', en: 'Jordanian Dinar (JOD)' }),
    Object.freeze({ code: 'TRY', ar: 'ليرة تركية (TRY)', en: 'Turkish Lira (TRY)' }),
    Object.freeze({ code: 'CHF', ar: 'فرنك سويسري (CHF)', en: 'Swiss Franc (CHF)' }),
    Object.freeze({ code: 'JPY', ar: 'ين ياباني (JPY)', en: 'Japanese Yen (JPY)' }),
    Object.freeze({ code: 'CNY', ar: 'يوان صيني (CNY)', en: 'Chinese Yuan (CNY)' }),
    Object.freeze({ code: 'INR', ar: 'روبية هندية (INR)', en: 'Indian Rupee (INR)' }),
    Object.freeze({ code: 'CAD', ar: 'دولار كندي (CAD)', en: 'Canadian Dollar (CAD)' }),
    Object.freeze({ code: 'AUD', ar: 'دولار أسترالي (AUD)', en: 'Australian Dollar (AUD)' }),
]);

const currencyOptions = Object.freeze(
    CURRENCIES.map((currency) => Object.freeze({
        value: currency.code,
        label: Object.freeze({ ar: currency.ar, en: currency.en }),
    })),
);

const CLOUD_WORKER_URL = 'https://adawaty-cloud-worker.abdelazizmaysara4.workers.dev/api/currency-rates';

async function fetchUsdRates() {
    // Proxied through the Adawaty Cloud Worker rather than calling
    // open.er-api.com directly from the browser: independent sources
    // disagreed on whether that upstream sends CORS headers at all
    // (one live-monitoring source specifically reported "CORS:
    // Disabled"), and this couldn't be verified directly in this
    // environment (no real browser available, and the sandbox's own
    // network egress allowlist blocks the domain outright). A
    // server-to-server fetch inside the Worker has no CORS
    // restriction, removing the ambiguity entirely rather than
    // gambling on it. See cloudflare-worker/src/index.js's
    // handleCurrencyRates() for the actual upstream call and its
    // 1-hour edge cache.
    const response = await fetch(`${CLOUD_WORKER_URL}?base=USD`, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (!data.rates) {
        throw new Error('Unexpected rates response');
    }
    return Object.freeze({
        rates: data.rates,
        updatedAt: data.updatedAt ?? null,
    });
}

function convertAmount(amount, from, to, rates) {
    if (from === to) {
        return amount;
    }
    const fromRate = from === 'USD' ? 1 : rates[from];
    const toRate = to === 'USD' ? 1 : rates[to];
    if (fromRate == null || toRate == null || fromRate <= 0 || toRate <= 0) {
        return null;
    }
    // Convert from → USD → to
    return (amount / fromRate) * toRate;
}

const currencyConverter = Object.freeze({
    id: 'currency-converter',
    category: 'converter',
    icon: '¤',
    action: Object.freeze({ ar: 'حوّل العملة', en: 'Convert currency' }),
    title: Object.freeze({ ar: 'محول العملات', en: 'Currency Converter' }),
    description: Object.freeze({
        ar: 'حوّل بين الجنيه المصري والدولار واليورو والريال والدرهم وعملات أخرى بأسعار صرف حديثة.',
        en: 'Convert between Egyptian pound, US dollar, euro, riyal, dirham and other currencies using recent exchange rates.',
    }),
    note: Object.freeze({
        ar: 'الأسعار تقريبية من مصدر مجاني وتُحدَّث يوميًا تقريبًا. يلزم اتصال بالإنترنت لجلب الأسعار. ليست نصيحة مالية أو سعر بنك رسمي.',
        en: 'Rates are approximate from a free provider and update roughly daily. An internet connection is required. Not financial advice or an official bank rate.',
    }),
    inputs: Object.freeze([
        Object.freeze({
            id: 'amount',
            type: 'number',
            min: 0,
            max: 1_000_000_000_000,
            step: 'any',
            label: Object.freeze({ ar: 'المبلغ', en: 'Amount' }),
            unit: Object.freeze({ ar: '', en: '' }),
            placeholder: '100',
        }),
        Object.freeze({
            id: 'from',
            type: 'select',
            label: Object.freeze({ ar: 'من عملة', en: 'From currency' }),
            unit: Object.freeze({ ar: '', en: '' }),
            options: currencyOptions,
        }),
        Object.freeze({
            id: 'to',
            type: 'select',
            label: Object.freeze({ ar: 'إلى عملة', en: 'To currency' }),
            unit: Object.freeze({ ar: '', en: '' }),
            options: currencyOptions,
        }),
    ]),
    async process(values, language) {
        const amount = Number(values.amount);
        if (!Number.isFinite(amount) || amount < 0) {
            throw new Error(localized(
                language,
                'أدخل مبلغًا صحيحًا أكبر من أو يساوي صفر.',
                'Enter a valid amount greater than or equal to zero.',
            ));
        }

        const from = String(values.from || 'USD').toUpperCase();
        const to = String(values.to || 'EGP').toUpperCase();

        let ratesPayload;
        try {
            ratesPayload = await fetchUsdRates();
        } catch {
            throw new Error(localized(
                language,
                'تعذّر جلب أسعار الصرف. تحقق من الاتصال بالإنترنت وحاول مرة أخرى.',
                'Could not fetch exchange rates. Check your internet connection and try again.',
            ));
        }

        const converted = convertAmount(amount, from, to, ratesPayload.rates);
        if (converted == null) {
            throw new Error(localized(
                language,
                'عملة غير مدعومة في مصدر الأسعار الحالي.',
                'One of the selected currencies is not supported by the current rate source.',
            ));
        }

        const rate = convertAmount(1, from, to, ratesPayload.rates);
        const detailsParts = [
            `1 ${from} ≈ ${formatter.format(rate)} ${to}`,
        ];
        if (ratesPayload.updatedAt) {
            detailsParts.push(
                localized(
                    language,
                    `آخر تحديث للأسعار: ${ratesPayload.updatedAt}`,
                    `Rates last updated: ${ratesPayload.updatedAt}`,
                ),
            );
        }

        return {
            value: formatter.format(converted),
            label: to,
            details: detailsParts.join(' · '),
        };
    },
});

const currencyConverterToolDefinitions = Object.freeze({
    [currencyConverter.id]: currencyConverter,
});

export { currencyConverterToolDefinitions };

// END OF FILE
