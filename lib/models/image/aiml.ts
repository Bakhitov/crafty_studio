import { env } from '@/lib/env';

const BASE_URL = 'https://api.aimlapi.com/v1/images/generations/';

type AimlSuccessResponse = Record<string, unknown>;

const extractCandidateStrings = (json: AimlSuccessResponse): string[] => {
  const candidates: string[] = [];

  const pushString = (v: unknown) => {
    if (typeof v === 'string' && v.length > 0) candidates.push(v);
  };

  const pushFromObj = (obj: unknown) => {
    if (!obj || typeof obj !== 'object') return;
    const o = obj as Record<string, unknown>;
    pushString(o['b64_json']);
    pushString(o['url']);
    pushString(o['image']);
    pushString(o['image_url'] as unknown as string);
    if (typeof o['data'] === 'string') pushString(o['data']);
  };

  const tryArray = (v: unknown) => {
    if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === 'string') pushString(item);
        else pushFromObj(item);
      }
    }
  };

  // Common response patterns
  pushFromObj(json['data']);
  pushFromObj(json['result']);
  pushFromObj(json['output']);

  tryArray(json['data']);
  tryArray(json['images']);
  tryArray(json['output']);
  tryArray(json['results']);

  // Direct base64 fields sometimes present
  pushString(json['b64_json']);
  pushString(json['image_base64'] as unknown as string);
  pushString(json['image'] as unknown as string);

  return candidates.filter(Boolean);
};

const toUint8 = async (value: string): Promise<Uint8Array> => {
  // If looks like a URL, fetch it
  if (value.startsWith('http://') || value.startsWith('https://')) {
    const res = await fetch(value);
    const ab = await res.arrayBuffer();
    return new Uint8Array(ab);
  }

  // If looks like a data URL, parse the base64 part
  const commaIndex = value.indexOf(',');
  const maybeDataPrefix = value.slice(0, Math.max(0, commaIndex));
  const base64 = maybeDataPrefix.startsWith('data:') && commaIndex !== -1
    ? value.slice(commaIndex + 1)
    : value;

  // Decode base64 safely across runtimes (browser/node)
  if (typeof (globalThis as unknown as { atob?: (s: string) => string }).atob === 'function') {
    const binaryString = (globalThis as unknown as { atob: (s: string) => string }).atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  }

  const maybeBuffer = (globalThis as unknown as { Buffer?: { from: (s: string, enc: string) => Uint8Array } }).Buffer;
  if (maybeBuffer && typeof maybeBuffer.from === 'function') {
    return new Uint8Array(maybeBuffer.from(base64, 'base64'));
  }

  throw new Error('No base64 decoder available in this runtime');
};

export const aiml = {
  image: (modelId: string): any => ({
    modelId,
    provider: 'aiml',
    specificationVersion: 'v2',
    maxImagesPerCall: 1,
    doGenerate: async (
      args: {
        prompt: string;
        size?: string;
        seed?: number;
        providerOptions?: unknown;
        abortSignal?: AbortSignal;
        headers?: Record<string, string | undefined>;
      }
    ) => {
      const { prompt, size, seed, providerOptions, abortSignal, headers } = args;
      // Prepare payload with optional image_url(s) if provided via providerOptions
      let imageUrl: string | undefined;
      let imageUrls: string[] | undefined;
      if (
        providerOptions &&
        typeof providerOptions === 'object' &&
        'aiml' in (providerOptions as Record<string, unknown>)
      ) {
        const aimlOpts = (providerOptions as { aiml?: { image_url?: string; image_urls?: string[] } }).aiml;
        if (aimlOpts) {
          if (typeof aimlOpts.image_url === 'string') imageUrl = aimlOpts.image_url;
          if (Array.isArray(aimlOpts.image_urls)) imageUrls = aimlOpts.image_urls.filter((u) => typeof u === 'string');
        }
      }

      const body: Record<string, unknown> = { model: modelId, prompt };
      const isQwenEdit = modelId.startsWith('alibaba/qwen-image-edit');
      const isQwenBase = modelId.startsWith('alibaba/qwen-image') && !isQwenEdit;
      if (isQwenBase) {
        if (typeof size === 'string' && size.length > 0) body.size = size;
        if (typeof seed === 'number' && Number.isFinite(seed)) body.seed = seed;
      }
      if (imageUrl) body.image_url = imageUrl;
      if (isQwenEdit && imageUrl) body.image = imageUrl;
      if (imageUrls && imageUrls.length) body.image_urls = imageUrls;

      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.AIML_API_KEY}`,
          ...(headers ?? {}),
        },
        body: JSON.stringify(body),
        signal: abortSignal,
      });

      if (!res.ok) {
        let reason = '';
        try {
          reason = JSON.stringify(await res.json());
        } catch {
          reason = await res.text();
        }
        throw new Error(`AIML request failed (${res.status}): ${reason}`);
      }

      const json = (await res.json()) as AimlSuccessResponse;
      // Try to infer content type from structured responses
      let detectedContentType: string | undefined;
      const imagesMeta = (json as unknown as { images?: Array<{ content_type?: string }> }).images;
      if (Array.isArray(imagesMeta) && imagesMeta.length > 0) {
        const ct = imagesMeta[0]?.content_type;
        if (typeof ct === 'string' && ct.length > 0) detectedContentType = ct;
      }
      const candidates = extractCandidateStrings(json);

      if (!candidates.length) {
        throw new Error('AIML response did not include image data');
      }

      const images: Uint8Array[] = [];
      for (const c of candidates) {
        try {
          images.push(await toUint8(c));
        } catch {
          // skip unparsable entries
        }
      }

      if (!images.length) {
        throw new Error('AIML response contained no downloadable/decodable images');
      }

      return {
        images: [images[0]],
        warnings: [],
        response: {
          timestamp: new Date(),
          modelId,
          headers: detectedContentType ? { 'content-type': detectedContentType } : undefined,
        },
      };
    },
  }),
};