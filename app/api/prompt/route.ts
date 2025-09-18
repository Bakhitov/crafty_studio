import { parseError } from '@/lib/error/parse';
import { database } from '@/lib/database';
import { prompts } from '@/schema';

export const POST = async (req: Request) => {
  try {
    const body = await req.json();
    const modality = String(body?.modality || 'Text');
    const tags = Array.isArray(body?.tags) ? body.tags.filter((x: any) => typeof x === 'string') : [];
    const textRaw = typeof body?.text === 'string' ? String(body.text) : undefined;
    const prompt = textRaw && textRaw.trim().length > 0
      ? textRaw.trim()
      : `${tags.join(', ')}`;

    await database.insert(prompts).values({
      userId: 'anonymous', // replace with authed user when route is protected
      modality,
      textRaw: textRaw ?? null,
      tagsEn: tags,
      jsonPayload: { modality, tags },
    });

    return new Response(JSON.stringify({ json: { modality, tags }, prompt }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    const message = parseError(error);
    return new Response(message, { status: 400 });
  }
};


