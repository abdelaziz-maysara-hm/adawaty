/**
 * Client-side text summarization via WebLLM, using the shared engine
 * loader in webllm-shared.js (see that file for the full model/hosting
 * reasoning -- shared with grammar-checker so both tools reuse one
 * loaded model rather than each downloading/compiling it separately).
 */

import { getSharedEngine, isWebGPUSupported } from '../webllm-shared.js';

/**
 * Summarizes `text` using a fixed, non-editable system prompt (so this
 * stays a genuine single-purpose "Text Summarizer" tool, not a general
 * chat interface wearing a summarizer's clothes).
 */
async function summarizeText(text, language, onProgress) {
    const engine = await getSharedEngine(onProgress);
    const systemPrompt = language === 'ar'
        ? 'أنت مساعد يلخّص النصوص باختصار ودقة، وترد بنفس لغة النص المُدخل فقط، دون أي مقدمات أو تعليقات إضافية.'
        : 'You are an assistant that summarizes text concisely and accurately, responding only in the same language as the input text, with no preamble or extra commentary.';

    const response = await engine.chat.completions.create({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text },
        ],
        temperature: 0.3,
        max_tokens: 400,
    });

    return response.choices[0]?.message?.content?.trim() ?? '';
}

export { summarizeText, isWebGPUSupported };

// END OF FILE
