import { gateway } from '@/lib/gateway';
import { generateText } from 'ai';

/**
 * Translate arbitrary user text to English.
 * Keeps semantics, removes meta-instructions, returns plain translation only.
 */
export const translateToEnglish = async (input: string | undefined | null): Promise<string | undefined> => {
	if (!input) return input ?? undefined;

	const text = String(input).trim();
	if (text.length === 0) return undefined;

	// Heuristic: if likely already English, skip to save tokens
	// Very light check: presence of many ASCII words and no Cyrillic/Arabic/CJK chars
	// Not perfect, but avoids double-translation for common cases.
	const hasCyrillic = /[\u0400-\u04FF]/.test(text);
	const hasCJK = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/.test(text);
	const hasArabic = /[\u0600-\u06FF]/.test(text);
	const shouldTranslate = hasCyrillic || hasCJK || hasArabic;
	if (!shouldTranslate) return text;

	const modelId = 'stealth/sonoma-dusk-alpha';
	const system = [
		'You are a translation engine.',
		'Task: translate the user input to English.',
		'Keep meaning, tone, and crucial details.',
		'Return English text only. No comments, no preface.',
	].join('\n');

	const { text: translated } = await generateText({
		model: gateway(modelId),
		system,
		prompt: text,
	});

	return translated?.trim() || text;
};
