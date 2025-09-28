'use server';

import { getSubscribedUser } from '@/lib/auth';
import { database } from '@/lib/database';
import { parseError } from '@/lib/error/parse';
import { videoModels } from '@/lib/models/video';
import { trackCreditUsage } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { projects } from '@/schema';
import type { Edge, Node, Viewport } from '@xyflow/react';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { translateToEnglish } from '@/lib/translate';

type GenerateVideoActionProps = {
  modelId: string;
  prompt: string;
  images: {
    url: string;
    type: string;
  }[];
  nodeId: string;
  projectId: string;
  duration?: number;
  aspectRatio?: string;
};

export const generateVideoAction = async ({
  modelId,
  prompt,
  images,
  nodeId,
  projectId,
  duration = 5,
  aspectRatio = '16:9',
}: GenerateVideoActionProps): Promise<
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
    // Support dynamic AIML model ids: "aiml:<vendor>:<modelId>"
    const model = videoModels[modelId] ?? (modelId.startsWith('aiml:')
      ? {
          label: `AIML (${modelId.split(':').slice(-1)[0]})`,
          chef: { id: 'aiml', name: 'AIML', icon: (await import('@/lib/icons')).UnknownIcon } as any,
          providers: [
            {
              ...( { id: 'aiml', name: 'AIML', icon: (await import('@/lib/icons')).UnknownIcon } as any),
              model: (await import('@/lib/models/video/aiml')).aimlVideo(
                modelId.split(':')[2] ?? 'video-01',
                modelId.split(':')[1] ?? 'minimax'
              ),
              getCost: () => 0,
            },
          ],
        } as any
      : undefined);

    if (!model) {
      throw new Error('Model not found');
    }

    const provider = model.providers[0];

    let firstFrameImage = images.at(0)?.url;

    if (firstFrameImage && process.env.NODE_ENV !== 'production') {
      const response = await fetch(firstFrameImage);
      const blob = await response.blob();
      const uint8Array = new Uint8Array(await blob.arrayBuffer());
      const base64 = Buffer.from(uint8Array).toString('base64');

      firstFrameImage = `data:${images.at(0)?.type};base64,${base64}`;
    }

    const promptEn = (await translateToEnglish(prompt)) ?? prompt;
    const url = await provider.model.generate({
      prompt: promptEn,
      imagePrompt: firstFrameImage,
      duration,
      aspectRatio,
    });

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    {
      const usd = provider.getCost({ duration })
      const credits = usd * 200
      await trackCreditUsage({ action: 'generate_video', cost: credits })
    }

    const blob = await client.storage
      .from('files')
      .upload(`${user.id}/${nanoid()}.mp4`, arrayBuffer, {
        contentType: 'video/mp4',
      });

    if (blob.error) {
      throw new Error(blob.error.message);
    }

    const { data: supabaseDownloadUrl } = client.storage
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

    const newData = {
      ...(existingNode.data ?? {}),
      updatedAt: new Date().toISOString(),
      generated: {
        url: supabaseDownloadUrl.publicUrl,
        type: 'video/mp4',
      },
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