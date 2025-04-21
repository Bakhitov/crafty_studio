'use server';

import { openai } from '@ai-sdk/openai';
import { experimental_generateSpeech as generateSpeech } from 'ai';

export const generateSpeechAction = async (text: string) => {
  const { audio } = await generateSpeech({
    model: openai.speech('gpt-4o-mini-tts'),
    text,
  });

  return audio.uint8Array;
};
