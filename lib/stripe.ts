import Stripe from 'stripe';
import { currentUserProfile } from './auth';
import { env } from './env';
import { isManualBilling, trackCredits } from './billing';
import { redis } from './rate-limit';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

export const trackCreditUsage = async ({
  action,
  cost,
}: {
  action: string;
  cost: number;
}) => {
  if (isManualBilling()) {
    await trackCredits(cost);
    return;
  }

  const profile = await currentUserProfile();

  if (!profile) {
    throw new Error('Профиль пользователя не найден');
  }

  if (!profile.customerId) {
    throw new Error('ID клиента пользователя не найден');
  }

  // Локально копим сырые значения кредитов (без округления)
  try {
    await redis.incrbyfloat(`credits:usage:${profile.id}`, cost);
  } catch {}

  // $ → credits в Stripe считается на стороне Stripe через meter price
  await stripe.billing.meterEvents.create({
    event_name: env.STRIPE_CREDITS_METER_NAME,
    payload: {
      action,
      // Для Stripe: округление до 0.1 и минимум 0.1
      value: (Math.max(0.1, Math.round(cost * 10) / 10)).toFixed(1),
      stripe_customer_id: profile.customerId,
    },
  });
};
