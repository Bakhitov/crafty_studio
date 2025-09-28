'use server';

import { env } from '@/lib/env';

export async function GET() {
  try {
    const res = await fetch('https://api.aimlapi.com/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.AIML_API_KEY}`,
      },
      // Avoid Next caching for dynamic model list
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(
        JSON.stringify({ error: `AIML models fetch failed (${res.status}): ${text}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const json = (await res.json()) as {
      object?: string;
      data?: Array<{
        id: string;
        type: string;
        info?: { developer?: string; name?: string };
        endpoints?: string[];
        features?: unknown[];
      }>;
    };

    const data = Array.isArray(json.data) ? json.data : [];
    const imageModels = data.filter((m) => m.type === 'image');

    return new Response(
      JSON.stringify({ data: imageModels }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

