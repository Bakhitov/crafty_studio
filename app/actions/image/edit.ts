'use server';

import { getSubscribedUser } from '@/lib/auth';
import { database } from '@/lib/database';
import { parseError } from '@/lib/error/parse';
import { imageModels } from '@/lib/models/image';
import { trackCreditUsage } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { projects } from '@/schema';
import type { Edge, Node, Viewport } from '@xyflow/react';
import {
  type Experimental_GenerateImageResult,
  experimental_generateImage as generateImage,
} from 'ai';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import OpenAI, { toFile } from 'openai';
import { translateToEnglish } from '@/lib/translate';

type EditImageActionProps = {
  images: {
    url: string;
    type: string;
  }[];
  modelId: string;
  instructions?: string;
  nodeId: string;
  projectId: string;
  size?: string;
};

const generateGptImage1Image = async ({
  prompt,
  size,
  images,
}: {
  prompt: string;
  size?: string;
  images: {
    url: string;
    type: string;
  }[];
}) => {
  const openai = new OpenAI();
  const promptImages = await Promise.all(
    images.map(async (image) => {
      const response = await fetch(image.url);
      const blob = await response.blob();

      return toFile(blob, nanoid(), {
        type: image.type,
      });
    })
  );

  const response = await openai.images.edit({
    model: 'gpt-image-1',
    image: promptImages,
    prompt,
    size: size as never | undefined,
    quality: 'high',
  });

  const json = response.data?.at(0)?.b64_json;

  if (!json) {
    throw new Error('No response JSON found');
  }

  const image: Experimental_GenerateImageResult['image'] = {
    base64: json,
    uint8Array: Buffer.from(json, 'base64'),
    mediaType: 'image/png',
  };

  return {
    image,
    usage: {
      textInput: response.usage?.input_tokens_details.text_tokens,
      imageInput: response.usage?.input_tokens_details.image_tokens,
      output: response.usage?.output_tokens,
    },
  };
};

export const editImageAction = async ({
  images,
  instructions,
  modelId,
  nodeId,
  projectId,
  size,
}: EditImageActionProps): Promise<
  | {
      nodeData: object;
    }
  | {
      error: string;
    }
> => {
  try {
    const client = await createClient();
    const user = await getSubscribedUser();

    const model = imageModels[modelId] ?? (modelId.startsWith('aiml:')
      ? {
          label: `AIML (${modelId.split(':').slice(-1)[0]})`,
          chef: { id: 'aiml', name: 'AIML', icon: (await import('@/lib/icons')).UnknownIcon } as any,
          providers: [
            {
              ...( { id: 'aiml', name: 'AIML', icon: (await import('@/lib/icons')).UnknownIcon } as any),
              model: (await import('@/lib/models/image/aiml')).aiml.image(modelId.split(':').slice(-1)[0]),
              getCost: () => 0.02,
            },
          ],
          supportsEdit: true,
        } as any
      : undefined);

    if (!model) {
      throw new Error('Model not found');
    }

    if (!model.supportsEdit) {
      throw new Error('Model does not support editing');
    }

    const provider = model.providers[0];

    let image: Experimental_GenerateImageResult['image'] | undefined;

    const defaultPrompt =
      images.length > 1
        ? 'Create a variant of the image.'
        : 'Create a single variant of the images.';

    const rawPrompt =
      !instructions || instructions === '' ? defaultPrompt : instructions;
    const prompt = (await translateToEnglish(rawPrompt)) ?? rawPrompt;

    if (provider.model.modelId === 'gpt-image-1') {
      const generatedImageResponse = await generateGptImage1Image({
        prompt,
        images,
        size,
      });

      {
        const usd = provider.getCost({
          ...generatedImageResponse.usage,
          size,
        });
        const credits = usd * 200;
        await trackCreditUsage({ action: 'generate_image', cost: credits });
      }

      image = generatedImageResponse.image;
    } else {
      // Prepare provider-specific image payloads
      let providerOptions: unknown;

      const providerName = (provider.model as { provider?: string }).provider;

      if (providerName === 'ark') {
        // Ark supports one or many images; send data URLs for each image
        const dataUrls = await Promise.all(
          images.map(async (img) => {
            const base64 = await fetch(img.url)
              .then((res) => res.arrayBuffer())
              .then((buffer) => Buffer.from(buffer).toString('base64'));
            return `data:${img.type.toLowerCase()};base64,${base64}`;
          })
        );

        const arkModelId = (provider.model as { modelId?: string }).modelId ?? '';
        const isSeedream4 = arkModelId.startsWith('seedream-4-0');

        providerOptions = {
          ark: {
            // Seedream 4.0: поддерживает массив; Seedream/Seededit 3.x: только одно изображение
            image: isSeedream4
              ? (dataUrls.length === 1 ? dataUrls[0] : dataUrls)
              : dataUrls[0],
          },
        } as const;
      } else if (providerName === 'black-forest-labs') {
        // BFL (Flux) accepts single base64 image prompt for i2i
        const base64First = await fetch(images[0].url)
          .then((res) => res.arrayBuffer())
          .then((buffer) => Buffer.from(buffer).toString('base64'));

        providerOptions = { bfl: { image: base64First } } as const;
      } else if (providerName === 'aiml') {
        const aimlModelId = (provider.model as { modelId?: string }).modelId ?? '';
        const isEdit = aimlModelId.includes('edit');
        if (isEdit) {
          // Edit variants expect a single image
          if (images.length >= 1) {
            providerOptions = { aiml: { image_url: images[0].url } } as const;
          }
        } else {
          // Non-edit AIML models: keep support for multiple images if provided
          if (images.length === 1) {
            providerOptions = { aiml: { image_url: images[0].url } } as const;
          } else if (images.length > 1) {
            providerOptions = { aiml: { image_urls: images.map((img) => img.url) } } as const;
          }
        }
      }

      const arkModelId = (provider.model as { modelId?: string }).modelId ?? '';
      const isArk3 = (provider.model as { provider?: string }).provider === 'ark' &&
        (arkModelId.startsWith('seedream-3') || arkModelId.startsWith('seededit-3'));

      const generatedImageResponse = await generateImage({
        model: provider.model,
        prompt,
        size: (isArk3 ? undefined : (size as never)) as never,
        providerOptions: providerOptions as never,
      });

      {
        const usd = provider.getCost({ size });
        const credits = usd * 200;
        await trackCreditUsage({ action: 'generate_image', cost: credits });
      }

      image = generatedImageResponse.image;
    }

    const contentType = image.mediaType ?? 'image/png';
    const bytes = Buffer.from(image.uint8Array ?? Buffer.from(image.base64, 'base64'));

    const blob = await client.storage
      .from('files')
      .upload(`${user.id}/${nanoid()}`, bytes, {
        contentType,
      });

    if (blob.error) {
      throw new Error(blob.error.message);
    }

    const { data: downloadUrl } = client.storage
      .from('files')
      .getPublicUrl(blob.data.path);

    const project = await database.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const content = project.content as {
      nodes: Node[];
      edges: Edge[];
      viewport: Viewport;
    };

    const existingNode = content.nodes.find((n) => n.id === nodeId);

    if (!existingNode) {
      throw new Error('Node not found');
    }

    const prevVersions = Array.isArray((existingNode.data as any)?.versions)
      ? ((existingNode.data as any).versions as { url: string; type: string; createdAt?: string; meta?: Record<string, unknown> }[])
      : ((existingNode.data as any)?.generated
          ? [((existingNode.data as any).generated as { url: string; type: string })]
          : []);

    const newVersion = {
      url: downloadUrl.publicUrl,
      type: contentType,
      createdAt: new Date().toISOString(),
      meta: { modelId, size },
    };

    const versions = [...prevVersions, newVersion];
    const versionIndex = versions.length - 1;

    const newData = {
      ...(existingNode.data ?? {}),
      updatedAt: new Date().toISOString(),
      generated: newVersion,
      versions,
      versionIndex,
      description: instructions ?? defaultPrompt,
    };

    const updatedNodes = content.nodes.map((existingNode) => {
      if (existingNode.id === nodeId) {
        return {
          ...existingNode,
          data: newData,
        };
      }

      return existingNode;
    });

    await database
      .update(projects)
      .set({ content: { ...content, nodes: updatedNodes } })
      .where(eq(projects.id, projectId));

    return {
      nodeData: newData,
    };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};