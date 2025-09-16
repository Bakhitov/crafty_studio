'use server';

import { getSubscribedUser } from '@/lib/auth';
import { database } from '@/lib/database';
import { parseError } from '@/lib/error/parse';
import { trackCreditUsage } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { projects } from '@/schema';
import type { Edge, Node, Viewport } from '@xyflow/react';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

type FinalizeVideoTaskProps = {
  arkUrl: string;
  nodeId: string;
  projectId: string;
  modelId: string;
  completionTokens?: number;
};

export const finalizeVideoTask = async ({
  arkUrl,
  nodeId,
  projectId,
  modelId,
  completionTokens,
}: FinalizeVideoTaskProps): Promise<
  | { nodeData: object }
  | { error: string }
> => {
  try {
    const client = await createClient();
    await getSubscribedUser();

    const response = await fetch(arkUrl);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();

    // Compute Seedance cost (per 1K completion tokens); fallback 0 if unknown
    let costUsd = 0;
    if (modelId.startsWith('seedance-') && typeof completionTokens === 'number') {
      const ratePerK = modelId.includes('lite') ? 0.0009 : 0.00125;
      costUsd = ratePerK * (completionTokens / 1000);
    }

    {
      const credits = costUsd * 200;
      await trackCreditUsage({ action: 'generate_video', cost: credits });
    }

    const user = await getSubscribedUser();
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

    const updatedNodes = content.nodes.map((n) =>
      n.id === nodeId ? { ...n, data: newData } : n
    );

    await database
      .update(projects)
      .set({ content: { ...content, nodes: updatedNodes } })
      .where(eq(projects.id, projectId));

    return { nodeData: newData };
  } catch (error) {
    const message = parseError(error);
    return { error: message };
  }
};


