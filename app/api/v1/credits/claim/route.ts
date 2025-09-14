import { currentUserProfile } from '@/lib/auth';
import { isManualBilling, getManualCredits, setManualPlan, setManualCredits } from '@/lib/billing';
import { NextResponse } from 'next/server';

const HOBBY_INITIAL_CREDITS = 200;

export const POST = async () => {
  try {
    if (!isManualBilling()) {
      return new NextResponse('Биллинг через Stripe активен', { status: 400 });
    }

    const userProfile = await currentUserProfile();

    // Выдать стартовые кредиты, только если их ещё нет
    const existing = await getManualCredits(userProfile.id);
    if (existing <= 0) {
      await setManualPlan(userProfile.id, 'hobby');
      await setManualCredits(userProfile.id, HOBBY_INITIAL_CREDITS);
    }

    return NextResponse.json({ ok: true, plan: 'hobby', credits: Math.max(existing, HOBBY_INITIAL_CREDITS) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(message, { status: 500 });
  }
};


