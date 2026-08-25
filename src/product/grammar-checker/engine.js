/**
 * Client-side grammar/spelling correction via WebLLM, using the shared
 * engine loader in webllm-shared.js (see that file for the full
 * model/hosting reasoning -- shared with text-summarizer so both tools
 * reuse one loaded model rather than each downloading/compiling it
 * separately).
 */

import { getSharedEngine, isWebGPUSupported } from '../webllm-shared.js';

/**
 * Corrects grammar and spelling in `text` using a fixed, non-editable
 * system prompt (so this stays a genuine single-purpose "Grammar
 * Checker" tool, not a general chat interface wearing a corrector's
 * clothes). Returns the corrected text only -- no explanation of what
 * changed, matching the small model's realistic output reliability
 * (asking it to also produce a structured diff/explanation would add
 * a second thing it could get wrong, for marginal benefit over the
 * user visually comparing the corrected text against what they typed).
 */
async function correctGrammar(text, language, onProgress) {
    const engine = await getSharedEngine(onProgress);
    const systemPrompt = language === 'ar'
        ? 'أنت مساعد يصحح الأخطاء النحوية والإملائية في النص المُدخل، وترد بالنص المُصحح فقط بنفس لغة النص الأصلي، دون أي شرح أو تعليقات أو مقدمات إضافية. حافظ على أسلوب الكاتب ومعناه المقصود، وصحح فقط الأخطاء الفعلية.'
        : 'You are an assistant that corrects grammar and spelling errors in the input text, responding only with the corrected text in the same language as the original, with no explanation, commentary, or preamble. Preserve the writer\'s style and intended meaning, and correct only genuine errors.';

    const response = await engine.chat.completions.create({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text },
        ],
        temperature: 0.2,
        max_tokens: 800,
    });

    return response.choices[0]?.message?.content?.trim() ?? '';
}

export { correctGrammar, isWebGPUSupported };

// END OF FILE
