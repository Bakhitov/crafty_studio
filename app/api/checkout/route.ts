import { currentUser, currentUserProfile } from '@/lib/auth';
import { env } from '@/lib/env';
import { parseError } from '@/lib/error/parse';
import { stripe } from '@/lib/stripe';
import { hasClaimedHobby, isManualBilling, markHobbyClaimed } from '@/lib/billing';
import { type NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';

const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
const successUrl = `${protocol}://${env.VERCEL_PROJECT_PRODUCTION_URL}`;

const getFrequencyPrice = async (
  productId: string,
  frequency: Stripe.Price.Recurring.Interval
) => {
  const prices = await stripe.prices.list({
    product: productId,
  });

  if (prices.data.length === 0) {
    throw new Error('Цены продукта не найдены');
  }

  const price = prices.data.find(
    (price) => price.recurring?.interval === frequency
  );

  if (!price) {
    throw new Error('Цена не найдена');
  }

  return price.id;
};

export const GET = async (request: NextRequest) => {
  if (isManualBilling()) {
    return new Response('Биллинг отключён (ручной режим)', { status: 404 });
  }
  const { searchParams } = new URL(request.url);
  const productName = searchParams.get('product');
  const frequency = searchParams.get('frequency');

  const user = await currentUser();

  if (!user) {
    return new Response('Вы должны войти в систему для подписки', { status: 401 });
  }

  if (typeof productName !== 'string') {
    return new Response('Отсутствует продукт', { status: 400 });
  }

  if (typeof frequency !== 'string') {
    return new Response('Отсутствует частота', { status: 400 });
  }

  if (frequency !== 'month' && frequency !== 'year') {
    return new Response('Неверная частота', { status: 400 });
  }

  const profile = await currentUserProfile();
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  if (!profile) {
    return new Response('Профиль не найден', { status: 404 });
  }

  if (!profile.customerId && !user.email) {
    return new Response('ID клиента или email не найден', { status: 400 });
  }

  // Блокируем повторное оформление подписки, если уже есть активная
  if (profile.subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(profile.subscriptionId);
      const activeStatuses = new Set<Stripe.Subscription.Status>([
        'active',
        'trialing',
        'past_due',
        'unpaid',
        'incomplete',
      ]);

      if (activeStatuses.has(subscription.status)) {
        return new Response(
          'У вас уже есть активная подписка. Для изменения используйте портал биллинга.',
          { status: 400 }
        );
      }
    } catch {
      // Если не удалось получить подписку — продолжаем, позволим создать новую
    }
  }

  if (productName === 'hobby') {
    // Проверка: Hobby только один раз на пользователя
    if (await hasClaimedHobby(profile.id)) {
      return new Response('Hobby доступен только один раз для каждого пользователя.', { status: 400 });
    }
    lineItems.push(
      {
        price: await getFrequencyPrice(env.STRIPE_HOBBY_PRODUCT_ID, 'month'),
        quantity: 1,
      },
      {
        price: await getFrequencyPrice(env.STRIPE_USAGE_PRODUCT_ID, 'month'),
      }
    );
  } else if (productName === 'pro') {
    lineItems.push(
      {
        price: await getFrequencyPrice(env.STRIPE_PRO_PRODUCT_ID, frequency),
        quantity: 1,
      },
      {
        price: await getFrequencyPrice(env.STRIPE_USAGE_PRODUCT_ID, frequency),
      }
    );
  }

  try {
    const checkoutLink = await stripe.checkout.sessions.create({
      customer: profile.customerId ?? undefined,
      customer_email: profile.customerId ? undefined : user.email,
      line_items: lineItems,
      success_url: successUrl,
      allow_promotion_codes: true,
      mode: 'subscription',
      payment_method_collection:
        productName === 'hobby' ? 'if_required' : 'always',
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
    });

    if (!checkoutLink.url) {
      throw new Error('Ссылка на оплату не найдена');
    }

    // Пометим, что Hobby уже оформлен, чтобы исключить повтор
    if (productName === 'hobby') {
      await markHobbyClaimed(profile.id);
    }
    return NextResponse.redirect(checkoutLink.url);
  } catch (error) {
    const message = parseError(error);

    return new Response(message, { status: 500 });
  }
};
