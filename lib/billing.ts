import { env } from '@/lib/env';
import { currentUserProfile } from '@/lib/auth';
import { redis } from '@/lib/rate-limit';

export const isManualBilling = () => env.BILLING_MODE === 'manual';

const creditsKey = (userId: string) => `credits:${userId}`;
const planKey = (userId: string) => `plan:${userId}`;
const hobbyClaimedKey = (userId: string) => `hobby-claimed:${userId}`;

export async function getManualCredits(userId: string): Promise<number> {
  const raw = await redis.get(creditsKey(userId));
  const parsed = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function addManualCredits(userId: string, delta: number) {
  await redis.incrby(creditsKey(userId), delta);
}

export async function setManualCredits(userId: string, value: number) {
  await redis.set(creditsKey(userId), value);
}

export async function decManualCredits(userId: string, value: number) {
  // Поддержка десятичных кредитов: используем incrbyfloat с отрицательным значением
  await redis.incrbyfloat(creditsKey(userId), -value);
}

export async function getManualPlan(userId: string): Promise<string | null> {
  const plan = await redis.get<string>(planKey(userId));
  return plan ?? null;
}

export async function setManualPlan(userId: string, plan: string) {
  await redis.set(planKey(userId), plan);
}

// Списание кредитов в manual-режиме: на вход уже кредиты (может быть десятичное)
export async function trackCredits(credits: number) {
  const profile = await currentUserProfile();
  // В manual-режиме списываем сырые значения без округления
  await decManualCredits(profile.id, credits);
}

// One-time Hobby flag
export async function hasClaimedHobby(userId: string): Promise<boolean> {
  return Boolean(await redis.get<number>(hobbyClaimedKey(userId)));
}

export async function markHobbyClaimed(userId: string) {
  await redis.set(hobbyClaimedKey(userId), 1);
}


