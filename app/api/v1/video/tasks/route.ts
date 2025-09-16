import { getSubscribedUser } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { createArkTask } from '@/lib/models/video/ark';
import { translateToEnglish } from '@/lib/translate';

export const POST = async (req: Request) => {
  try {
    await getSubscribedUser();

    const { modelId, prompt, images } = (await req.json()) as {
      modelId: string;
      prompt: string;
      images?: { url: string; role?: 'reference_image' | 'first_frame' | 'last_frame' }[];
    };

    if (!modelId || !prompt) {
      return NextResponse.json({ error: 'Missing modelId or prompt' }, { status: 400 });
    }

    if (!modelId.startsWith('seedance-')) {
      return NextResponse.json({ error: 'Only Seedance models are supported here' }, { status: 400 });
    }

    const promptEn = (await translateToEnglish(prompt)) ?? prompt;
    const content: (
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string }; role?: 'reference_image' | 'first_frame' | 'last_frame' }
    )[] = [{ type: 'text', text: promptEn }];

    if (Array.isArray(images) && images.length) {
      for (const img of images.slice(0, 4)) {
        if (!img?.url) continue;
        content.push({
          type: 'image_url',
          image_url: { url: img.url },
          role: img.role,
        });
      }
    }

    const taskId = await createArkTask(modelId, { model: modelId, content });

    return NextResponse.json({ taskId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
};


