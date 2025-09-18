import { parseError } from '@/lib/error/parse';
import { glimpse } from '@/components/ui/kibo-ui/glimpse/server';

export const dynamic = 'force-dynamic';

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    if (!url) {
      return new Response('Missing url parameter', { status: 400 });
    }

    // Простейшая валидация URL
    try {
      const parsed = new URL(url);
      if (!/^https?:$/.test(parsed.protocol)) {
        return new Response('Only http(s) URLs are allowed', { status: 400 });
      }
    } catch {
      return new Response('Invalid URL', { status: 400 });
    }

    const data = await glimpse(url);
    return new Response(JSON.stringify(data), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    const message = parseError(error);
    return new Response(message, { status: 400 });
  }
};


