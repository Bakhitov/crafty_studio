import { env } from '@/lib/env';
import type { ImageModel } from 'ai';

const baseUrl = 'https://ark.ap-southeast.bytepluses.com/api/v3/images/generations';

type ArkRequestBody = {
  model: string;
  prompt: string;
  image?: string | string[];
  size?: string;
  sequential_image_generation?: 'auto' | 'disabled';
  sequential_image_generation_options?: {
    max_images?: number;
  };
  stream?: boolean;
  response_format?: 'url' | 'b64_json';
  seed?: number;
  guidance_scale?: number;
  watermark?: boolean;
};

type ArkSuccessData = {
  url?: string;
  b64_json?: string;
  size?: string;
};

type ArkSuccessResponse = {
  model: string;
  created: number;
  data: ArkSuccessData[];
  usage?: {
    generated_images?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
};

type ArkErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

const isArkError = (v: unknown): v is ArkErrorResponse =>
  !!v && typeof v === 'object' && 'error' in v;

export const ark = {
  image: (modelId: string): ImageModel => ({
    modelId,
    provider: 'ark',
    specificationVersion: 'v2',
    maxImagesPerCall: 15,
    doGenerate: async ({
      prompt,
      size,
      seed,
      providerOptions,
      abortSignal,
      headers,
    }) => {
      const arkOptions = (providerOptions as
        | {
            ark?: {
              image?: string | string[];
              sequential_image_generation?: 'auto' | 'disabled';
              max_images?: number;
              response_format?: 'url' | 'b64_json';
              stream?: boolean;
              watermark?: boolean;
              guidance_scale?: number;
            };
          }
        | undefined)?.ark;

      const isSeedream4 = modelId.startsWith('seedream-4-0');
      const isSeedream = modelId.startsWith('seedream-');

      const body: ArkRequestBody = {
        model: modelId,
        prompt,
        size,
        response_format: arkOptions?.response_format ?? 'url',
        seed: typeof seed === 'number' ? seed : undefined,
        // Disable watermarks for Seedream models regardless of incoming options
        watermark: isSeedream ? false : (arkOptions?.watermark ?? true),
      } as ArkRequestBody;

      // guidance_scale поддерживается для seedream-3.0/seededit-3.0, но не для 4.0
      if (!isSeedream4 && typeof arkOptions?.guidance_scale === 'number') {
        body.guidance_scale = arkOptions.guidance_scale;
      }

      // batch/stream доступны только для seedream-4.0; для других моделей не отправляем поля вовсе
      if (isSeedream4) {
        body.sequential_image_generation =
          arkOptions?.sequential_image_generation ?? 'disabled';
        if (arkOptions?.max_images) {
          body.sequential_image_generation_options = {
            max_images: arkOptions.max_images,
          };
        }
        if (typeof arkOptions?.stream === 'boolean') {
          body.stream = arkOptions.stream;
        }
      }

      // Optional i2i support: providerOptions.ark.image may contain base64 or URL
      const arkImageOption = arkOptions?.image;

      if (arkImageOption) {
        body.image = arkImageOption;
      }

      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.ARK_API_KEY}`,
          ...(headers ?? {}),
        },
        body: JSON.stringify(body),
        signal: abortSignal,
      });

      const json = (await res.json()) as ArkSuccessResponse | ArkErrorResponse;

      if (!res.ok || isArkError(json)) {
        const message = isArkError(json)
          ? `${json.error.code}: ${json.error.message}`
          : `Ark request failed with status ${res.status}`;
        throw new Error(message);
      }

      const dataArray = json.data ?? [];

      if (!Array.isArray(dataArray) || dataArray.length === 0) {
        throw new Error('Ark response did not include data');
      }

      const images: Uint8Array[] = [];

      for (const item of dataArray) {
        if (item.url) {
          const imgRes = await fetch(item.url);
          const ab = await imgRes.arrayBuffer();
          images.push(new Uint8Array(ab));
        } else if (item.b64_json) {
          const b = Buffer.from(item.b64_json, 'base64');
          images.push(new Uint8Array(b));
        }
      }

      if (images.length === 0) {
        throw new Error('Ark response did not include downloadable images');
      }

      return {
        images,
        warnings: [],
        response: {
          timestamp: new Date(),
          modelId,
          headers: undefined,
        },
      };
    },
  }),
};


