import Stripe from 'stripe';
import { currentUserProfile } from './auth';
import { env } from './env';
import { isManualBilling, trackCredits } from './billing';

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

  // $ → credits в Stripe считается на стороне Stripe через meter price
  await stripe.billing.meterEvents.create({
    event_name: env.STRIPE_CREDITS_METER_NAME,
    payload: {
      action,
      value: undefined, // используем default quantity=1, если нужен value — перенесите формулу в Stripe
      stripe_customer_id: profile.customerId,
    },
  });
};
