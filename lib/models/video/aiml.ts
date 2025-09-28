import { env } from '@/lib/env';
import type { VideoModel } from '@/lib/models/video';

type AimlGenerationCreateResponse = {
  generation_id?: string;
  id?: string;
  [key: string]: unknown;
};

type AimlGenerationGetResponse = {
  id?: string;
  status?: string; // e.g., 'completed', 'processing', 'queued', 'failed'
  video?: { url?: string } | null;
  [key: string]: unknown;
};

const BASE_URL = 'https://api.aimlapi.com/v2/generate/video/minimax/generation';

export const aimlVideo = (modelId: string): VideoModel => ({
  modelId,
  generate: async ({ prompt, imagePrompt }) => {
    const createPayload = {
      model: modelId,
      prompt,
      ...(imagePrompt ? { first_frame_image: imagePrompt } : {}),
    } as const;

    const createRes = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.AIML_API_KEY}`,
      },
      body: JSON.stringify(createPayload),
    });

    if (!createRes.ok) {
      let reason = '';
      try {
        reason = JSON.stringify(await createRes.json());
      } catch {
        reason = await createRes.text();
      }
      throw new Error(`AIML video create failed (${createRes.status}): ${reason}`);
    }

    const createJson = (await createRes.json()) as AimlGenerationCreateResponse;
    const generationId = String(createJson.generation_id ?? createJson.id ?? '');
    if (!generationId) {
      throw new Error('AIML response did not include generation_id');
    }

    const startedAt = Date.now();
    const maxWaitMs = 5 * 60 * 1000; // 5 minutes

    // Poll until completed
    // Note: tokens are consumed on the generation (POST) step only per docs
    // The GET step retrieves result without extra token usage
    for (;;) {
      await new Promise((r) => setTimeout(r, 2000));

      const url = new URL(BASE_URL);
      url.searchParams.set('generation_id', generationId);

      const getRes = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.AIML_API_KEY}`,
        },
      });

      if (!getRes.ok) {
        let reason = '';
        try {
          reason = JSON.stringify(await getRes.json());
        } catch {
          reason = await getRes.text();
        }
        throw new Error(`AIML video get failed (${getRes.status}): ${reason}`);
      }

      const getJson = (await getRes.json()) as AimlGenerationGetResponse;
      const status = String(getJson.status ?? '').toLowerCase();

      if (status === 'completed' || status === 'success' || status === 'succeeded') {
        const maybeUrl = getJson.video?.url;
        if (!maybeUrl) {
          throw new Error('AIML completed but no video.url present');
        }
        return maybeUrl;
      }

      if (status === 'failed' || status === 'error') {
        throw new Error('AIML video generation failed');
      }

      if (Date.now() - startedAt > maxWaitMs) {
        throw new Error('AIML video generation timed out');
      }
    }
  },
});

