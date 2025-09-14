import { getCredits } from '@/app/actions/credits/get';
import { profile } from '@/schema';
import { eq } from 'drizzle-orm';
import { database } from './database';
import { env } from './env';
import { getManualCredits, getManualPlan, isManualBilling } from './billing';
import { createClient } from './supabase/server';

export const currentUser = async () => {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  return user;
};

type ProfileRow = typeof profile.$inferSelect;

export const currentUserProfile = async (): Promise<ProfileRow> => {
  const user = await currentUser();

  if (!user) {
    throw new Error('Пользователь не найден');
  }

  const userProfiles = await database
    .select()
    .from(profile)
    .where(eq(profile.id, user.id));
  let userProfile: ProfileRow | null | undefined = userProfiles.at(0);

  if (!userProfile && user.email) {
    try {
      const response = await database
        .insert(profile)
        .values({ id: user.id })
        .onConflictDoNothing({ target: profile.id })
        // If supported by your Drizzle version, uncomment the next line for DB-level safety
        // .onConflictDoNothing({ target: profile.id })
        .returning();

      // If another concurrent request created it first, response can be empty
      if (!response.length) {
        const fallback = await database
          .select()
          .from(profile)
          .where(eq(profile.id, user.id));
        userProfile = fallback.at(0) ?? undefined;
      } else {
        userProfile = response[0];
      }
    } catch (error: unknown) {
      // Handle duplicate key (race condition) gracefully
      const pgCode = (error as { code?: string })?.code;
      if (pgCode === '23505') {
        const fallback = await database
          .select()
          .from(profile)
          .where(eq(profile.id, user.id));
        userProfile = fallback.at(0) ?? undefined;
      } else {
        throw error;
      }
    }
  }

  if (!userProfile) {
    throw new Error('Не удалось создать профиль пользователя');
  }

  return userProfile;
};

export const getSubscribedUser = async () => {
  const user = await currentUser();

  if (!user) {
    throw new Error('Создайте аккаунт для использования AI функций.');
  }

  const userProfile = await currentUserProfile();

  if (isManualBilling()) {
    const plan = await getManualPlan(userProfile.id);
    const credits = await getManualCredits(userProfile.id);
    if (!plan) {
      throw new Error('Нет активной подписки.');
    }
    if (credits <= 0) {
      throw new Error('Кредиты закончились.');
    }
    return user;
  }

  if (!userProfile) {
    throw new Error('Профиль пользователя не найден');
  }

  if (!userProfile.subscriptionId) {
    throw new Error('Получите бесплатные AI кредиты для использования этой функции.');
  }

  const credits = await getCredits();

  if ('error' in credits) {
    throw new Error(credits.error);
  }

  if (userProfile.productId === env.STRIPE_HOBBY_PRODUCT_ID && credits.credits <= 0) {
    throw new Error(
      'Извините, у вас закончились кредиты! Пожалуйста, обновите план для получения дополнительных кредитов.'
    );
  }

  return user;
};
