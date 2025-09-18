import { getSubscribedUser } from '@/lib/auth';
import { parseError } from '@/lib/error/parse';
import { database } from '@/lib/database';
import { projects } from '@/schema';
import { eq } from 'drizzle-orm';
import { convertToModelMessages, generateText } from 'ai';
import { gateway } from '@/lib/gateway';
import { AGENT_GUIDE_MD, SYSTEM_BASE } from '@/lib/agent/instructions';
import { trackCreditUsage } from '@/lib/stripe';

export const maxDuration = 30;

export const POST = async (
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) => {
  try {
    const user = await getSubscribedUser();
    const { projectId } = await params;

    const project = await database.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project) return new Response('Проект не найден', { status: 404 });

    const isOwner = project.userId === user.id;
    const isMember = (project.members ?? []).includes(user.id);
    if (!isOwner && !isMember) return new Response('Доступ запрещён', { status: 403 });

    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const n = Math.min(Math.max(Number(body?.n ?? 2), 1), 5);

    // System prompt — как в основном чате (добавим гайд только при первом обращении)
    const hasHistory = messages.length > 0;
    const systemPrompt = hasHistory
      ? [SYSTEM_BASE, `Project ID: ${projectId}`].join('\n')
      : [SYSTEM_BASE, `Project ID: ${projectId}`, '', AGENT_GUIDE_MD].join('\n');

    const model = gateway('stealth/sonoma-sky-alpha');

    const temps = [0.6, 0.85, 0.95, 1.05, 1.2];
    const requests = Array.from({ length: n }).map(async (_v, i) => {
      const { text, usage } = await generateText({
        model,
        system: systemPrompt,
        messages: convertToModelMessages(messages),
        temperature: temps[i] ?? 0.85,
      });
      return { text: text ?? '', usage };
    });

    const results = await Promise.all(requests);

    // Подсчёт кредитов по суммарным usage
    try {
      const inputTokens = results.reduce((s, r) => s + (r.usage.inputTokens ?? 0), 0);
      const outputTokens = results.reduce((s, r) => s + (r.usage.outputTokens ?? 0), 0);
      const { models } = await gateway.getAvailableModels();
      const sky = models.find((m) => m.id === 'stealth/sonoma-sky-alpha');
      const inputPrice = sky?.pricing?.input ? Number.parseFloat(sky.pricing.input) : 0;
      const outputPrice = sky?.pricing?.output ? Number.parseFloat(sky.pricing.output) : 0;
      const usd = (inputTokens / 1_000_000) * inputPrice + (outputTokens / 1_000_000) * outputPrice;
      const credits = usd * 200;
      await trackCreditUsage({ action: 'project-chat-alternatives', cost: credits });
    } catch {}

    return new Response(
      JSON.stringify({ variants: results.map((r) => r.text) }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (error) {
    const message = parseError(error);
    return new Response(message, { status: 400 });
  }
};


