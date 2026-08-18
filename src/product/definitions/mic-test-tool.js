const micTest = Object.freeze({
    id: 'mic-test',
    category: 'audio',
    icon: 'MIC',
    interactive: true,
    action: Object.freeze({
        ar: 'افتح الاختبار',
        en: 'Open test',
    }),
    title: Object.freeze({
        ar: 'اختبار الميكروفون وعداد المستوى',
        en: 'Mic Test & Level Meter',
    }),
    description: Object.freeze({
        ar: 'اختبر ميكروفونك مباشرة وشاهد مستوى الصوت لحظيًا قبل مكالمة أو تسجيل، مع تنبيه فوري لو الصوت مشوَّه.',
        en: 'Test your microphone live and watch the real-time volume level before a call or recording, with an instant warning if your audio is clipping.',
    }),
    note: Object.freeze({
        ar: 'الصوت يُعالج داخل متصفحك فقط للحظات لعرض المستوى، ولا يُسجَّل أو يُرسَل لأي خادم.',
        en: 'Audio is processed in your browser only, moment to moment, just to show the level -- nothing is ever recorded or sent to any server.',
    }),
    inputs: Object.freeze([]),
});

const micTestToolDefinitions = Object.freeze({
    [micTest.id]: micTest,
});

export { micTestToolDefinitions };

// END OF FILE
