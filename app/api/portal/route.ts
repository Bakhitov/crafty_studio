import { currentUserProfile } from '@/lib/auth';
import { env } from '@/lib/env';
import { parseError } from '@/lib/error/parse';
import { stripe } from '@/lib/stripe';
import { isManualBilling } from '@/lib/billing';
import { NextResponse } from 'next/server';

const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
const returnUrl = `${protocol}://${env.VERCEL_PROJECT_PRODUCTION_URL}`;

export const GET = async () => {
  if (isManualBilling()) {
    return new Response('Биллинг отключён (ручной режим)', { status: 404 });
  }
  try {
    const profile = await currentUserProfile();

    if (!profile) {
      throw new Error('Профиль пользователя не найден');
    }

    if (!profile.customerId) {
      throw new Error('ID клиента пользователя не найден');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.customerId,
      return_url: returnUrl,
    });

    return NextResponse.redirect(session.url);
  } catch (error) {
    const message = parseError(error);

    return new Response(message, { status: 500 });
  }
};
