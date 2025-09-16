import { NextResponse } from 'next/server';
import {
  isManualBilling,
  setManualCredits,
  addManualCredits,
  setManualPlan,
  getManualCredits,
  getManualPlan,
  hasClaimedHobby,
  markHobbyClaimed,
} from '@/lib/billing';
import { env } from '@/lib/env';

export const POST = async (req: Request) => {
  if (!isManualBilling()) {
    return new Response('Доступно только в режиме ручного биллинга', { status: 400 });
  }

  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : auth;
  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
    return new Response('Не авторизован', { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { userId, plan, credits, addCredits } = body as {
    userId?: string;
    plan?: string;
    credits?: number;
    addCredits?: number;
  };

  if (!userId) {
    return new Response('Отсутствует userId', { status: 400 });
  }

  const prevPlan = await getManualPlan(userId);
  const prevCredits = await getManualCredits(userId);

  if (typeof plan === 'string') {
    if (plan === 'hobby' && (await hasClaimedHobby(userId))) {
      return new Response('Hobby можно выдать только один раз для пользователя', { status: 400 });
    }
    await setManualPlan(userId, plan);
    if (plan === 'hobby') {
      await markHobbyClaimed(userId);
    }
  }

  if (typeof credits === 'number') {
    await setManualCredits(userId, credits);
  }

  if (typeof addCredits === 'number') {
    await addManualCredits(userId, addCredits);
  }

  const currentPlan = await getManualPlan(userId);
  const currentCredits = await getManualCredits(userId);

  return NextResponse.json({
    ok: true,
    userId,
    plan: { previous: prevPlan, current: currentPlan },
    credits: { previous: prevCredits, current: currentCredits },
    applied: {
      plan: typeof plan === 'string' ? plan : undefined,
      credits,
      addCredits,
    },
  });
};


