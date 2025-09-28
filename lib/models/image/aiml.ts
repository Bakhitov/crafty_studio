import { env } from '@/lib/env';

const BASE_URL = 'https://api.aimlapi.com/v1/images/generations';

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
      // Model families
      const isQwenEdit = modelId.startsWith('alibaba/qwen-image-edit');
      const isQwenBase = modelId.startsWith('alibaba/qwen-image') && !isQwenEdit;
      const isSeedream3 = modelId.startsWith('bytedance/seedream-3.0');
      const isSeededit30 = modelId.startsWith('bytedance/seededit-3.0-i2i');
      const isSeedreamV4T2I = modelId.startsWith('bytedance/seedream-v4-text-to-image');
      const isSeedreamV4Edit = modelId.startsWith('bytedance/seedream-v4-edit');
      const isUSO = modelId.startsWith('bytedance/uso');

      // Qwen base supports size; edit expects single image
      if (isQwenBase) {
        if (typeof size === 'string' && size.length > 0) body.size = size;
        if (typeof seed === 'number' && Number.isFinite(seed)) body.seed = seed;
      }

      // Do not set generic image_url/image_urls; map per model below
      if (isQwenEdit && imageUrl) body.image = imageUrl;

      // Bytedance: Seedream 3.0 uses aspect_ratio (size deprecated)
      if (isSeedream3) {
        const choices = ['1:1', '16:9', '9:16', '3:4', '4:3'] as const;
        const ratioMap: Record<(typeof choices)[number], number> = {
          '1:1': 1,
          '16:9': 16 / 9,
          '9:16': 9 / 16,
          '3:4': 3 / 4,
          '4:3': 4 / 3,
        };
        let aspect: (typeof choices)[number] = '1:1';
        if (typeof size === 'string' && size.includes('x')) {
          const [w, h] = size.split('x').map(Number);
          if (w > 0 && h > 0) {
            const r = w / h;
            let best = '1:1' as (typeof choices)[number];
            let bestDiff = Infinity;
            for (const k of choices) {
              const d = Math.abs(r - ratioMap[k]);
              if (d < bestDiff) {
                best = k;
                bestDiff = d;
              }
            }
            aspect = best;
          }
        }
        body.aspect_ratio = aspect;
        if (typeof seed === 'number' && Number.isFinite(seed)) body.seed = seed;
        body.watermark = false;
      }

      // Bytedance: Seededit 3.0 i2i expects a single 'image'
      if (isSeededit30 && imageUrl) {
        body.image = imageUrl;
        if (typeof seed === 'number' && Number.isFinite(seed)) body.seed = seed;
        body.watermark = false;
      }

      // Bytedance: v4 t2i/edit and USO use image_size and image_urls
      const applyImageSize = () => {
        if (typeof size === 'string' && size.includes('x')) {
          const [w, h] = size.split('x').map(Number);
          if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
            body.image_size = { width: w, height: h };
          }
        }
      };

      if (isSeedreamV4T2I) {
        applyImageSize();
        if (typeof seed === 'number' && Number.isFinite(seed)) body.seed = seed;
      }
      if (isSeedreamV4Edit) {
        applyImageSize();
        const urls = (imageUrls && imageUrls.length ? imageUrls : (imageUrl ? [imageUrl] : [])).slice(0, 10);
        if (urls.length) body.image_urls = urls;
        if (typeof seed === 'number' && Number.isFinite(seed)) body.seed = seed;
      }
      if (isUSO) {
        applyImageSize();
        const urls = (imageUrls && imageUrls.length ? imageUrls : (imageUrl ? [imageUrl] : [])).slice(0, 3);
        if (urls.length) body.image_urls = urls;
        if (typeof seed === 'number' && Number.isFinite(seed)) body.seed = seed;
      }

      // Qwen edit: explicitly disable watermark if supported
      if (isQwenEdit) {
        (body as Record<string, unknown>).watermark = false;
      }

      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
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