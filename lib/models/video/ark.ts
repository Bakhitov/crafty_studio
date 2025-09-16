import { env } from '@/lib/env';
import type { VideoModel } from './index';

type CreateTaskBody = {
  model: string;
  content: (
    | { type: 'text'; text: string }
    | {
        type: 'image_url';
        image_url: { url: string };
        role?: 'first_frame' | 'last_frame' | 'reference_image';
      }
  )[];
};

type CreateTaskResponse = {
  id?: string;
  task_id?: string;
  error?: { code?: string; message?: string };
};

type QueryTaskResponse = {
  id?: string;
  status?: 'pending' | 'running' | 'succeeded' | 'failed' | 'canceled';
  error?: { code?: string; message?: string };
  // The exact shape is not documented here; try common fields
  data?: {
    url?: string;
    video_url?: string;
    result?: { url?: string; video_url?: string };
  };
  result?: { url?: string; video_url?: string };
};

const BASE_URL = 'https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const createArkTask = async (modelId: string, body: CreateTaskBody) => {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.ARK_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as CreateTaskResponse;

  if (!res.ok || json.error) {
    const message = json.error?.message ?? `Ark create task failed (${res.status})`;
    throw new Error(message);
  }

  const taskId = json.id ?? json.task_id;
  if (!taskId) {
    throw new Error('Ark: no task id returned');
  }

  return taskId;
};

export const getArkTaskStatus = async (taskId: string) => {
  const res = await fetch(`${BASE_URL}/${taskId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.ARK_API_KEY}`,
    },
  });

  const json = (await res.json()) as QueryTaskResponse;

  if (!res.ok || json.error) {
    const message = json.error?.message ?? `Ark get task failed (${res.status})`;
    throw new Error(message);
  }

  const status = json.status ?? 'pending';
  const completionTokens =
    (json as unknown as { usage?: { completion_tokens?: number } }).usage
      ?.completion_tokens ?? undefined;

  // Try to extract video URL from multiple possible shapes
  const candidates: Array<string | undefined> = [];
  const anyJson = json as unknown as Record<string, unknown>;
  const dataField = anyJson['data'] as unknown;
  const resultField = anyJson['result'] as unknown;
  const contentField = anyJson['content'] as unknown;

  const pushUrl = (v: unknown) => {
    if (!v || typeof v !== 'object') return;
    const obj = v as Record<string, unknown>;
    if (typeof obj['video_url'] === 'string') candidates.push(obj['video_url'] as string);
    if (typeof obj['url'] === 'string') candidates.push(obj['url'] as string);
  };

  pushUrl(dataField);
  pushUrl(resultField);
  pushUrl(contentField);

  if (Array.isArray(dataField)) {
    for (const item of dataField) pushUrl(item);
  }
  if (resultField && typeof resultField === 'object') {
    const rf = resultField as Record<string, unknown>;
    if (Array.isArray(rf['data'])) {
      for (const item of rf['data'] as unknown[]) pushUrl(item);
    }
    if (Array.isArray(rf['results'])) {
      for (const item of rf['results'] as unknown[]) pushUrl(item);
    }
  }
  if (contentField && typeof contentField === 'object') {
    const cf = contentField as Record<string, unknown>;
    if (Array.isArray(cf['data'])) {
      for (const item of cf['data'] as unknown[]) pushUrl(item);
    }
  }

  const videoUrl = candidates.find((u) => typeof u === 'string' && u.startsWith('http'));

  // Some providers mark status succeeded before URL is attached; normalize to running until URL is present
  const normalizedStatus = status === 'succeeded' && !videoUrl ? 'running' : status;

  return { status: normalizedStatus, videoUrl, completionTokens } as const;
};

export const ark = (modelId: string): VideoModel => ({
  modelId,
  generate: async ({ prompt, imagePrompt, duration, aspectRatio }) => {
    // Build content array
    const content: CreateTaskBody['content'] = [
      { type: 'text', text: prompt },
    ];

    if (imagePrompt) {
      content.push({ type: 'image_url', image_url: { url: imagePrompt } });
    }

    const taskId = await createArkTask(modelId, { model: modelId, content });

    // Poll until completion (max ~10 minutes)
    const start = Date.now();
    const timeoutMs = 10 * 60 * 1000;
    let videoUrl: string | undefined;

    while (Date.now() - start < timeoutMs) {
      await delay(4000);
      const { status, videoUrl: url } = await getArkTaskStatus(taskId);
      if (status === 'succeeded') {
        videoUrl = url;
        break;
      }
      if (status === 'failed' || status === 'canceled') {
        throw new Error(`Ark task ${status}`);
      }
    }

    if (!videoUrl) {
      throw new Error('Ark: task timed out or no video URL found');
    }

    return videoUrl;
  },
});


