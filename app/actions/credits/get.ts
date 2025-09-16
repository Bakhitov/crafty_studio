'use server';

import { currentUserProfile } from '@/lib/auth';
import { env } from '@/lib/env';
import { parseError } from '@/lib/error/parse';
import { stripe } from '@/lib/stripe';
import { getManualCredits, isManualBilling } from '@/lib/billing';

const HOBBY_CREDITS = 50;

export const getCredits = async (): Promise<
  | {
      credits: number;
    }
  | {
      error: string;
    }
> => {
  try {
    if (isManualBilling()) {
      const profile = await currentUserProfile();
      if (!profile) throw new Error('User profile not found');
      const credits = await getManualCredits(profile.id);
      return { credits };
    }

    const profile = await currentUserProfile();

    if (!profile) {
      throw new Error('Профиль пользователя не найден');
    }

    if (!profile.customerId) {
      throw new Error('ID клиента не найден');
    }

    if (!profile.subscriptionId) {
      throw new Error('ID подписки не найден');
    }

    const upcomingInvoice = await stripe.invoices.createPreview({
      subscription: profile.subscriptionId,
    });

    const usageProductLineItem = upcomingInvoice.lines.data.find(
      (line) =>
        line.pricing?.price_details?.product === env.STRIPE_USAGE_PRODUCT_ID
    );

    if (!usageProductLineItem) {
      throw new Error('Позиция продукта использования не найдена');
    }

    if (!usageProductLineItem.pricing?.price_details?.price) {
      throw new Error('Цена позиции продукта использования не найдена');
    }

    // Hobby plan fallback
    let credits = HOBBY_CREDITS;

    if (profile.productId !== env.STRIPE_HOBBY_PRODUCT_ID) {
      const usagePrice = await stripe.prices.retrieve(
        usageProductLineItem.pricing.price_details.price,
        { expand: ['tiers'] }
      );

      if (!usagePrice.tiers?.length) {
        throw new Error('Уровни цены использования не найдены');
      }

      if (!usagePrice.tiers[0].up_to) {
        throw new Error('Лимит уровня цены использования не найден');
      }

      credits = usagePrice.tiers[0].up_to;
    }

    const usage = usageProductLineItem?.quantity ?? 0;

    return {
      credits: credits - usage,
    };
  } catch (error) {
    const message = parseError(error);

    return { error: message };
  }
};
