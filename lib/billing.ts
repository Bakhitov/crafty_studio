import { env } from '@/lib/env';
import { currentUserProfile } from '@/lib/auth';
import { redis } from '@/lib/rate-limit';

export const isManualBilling = () => env.BILLING_MODE === 'manual';

const creditsKey = (userId: string) => `credits:${userId}`;
const planKey = (userId: string) => `plan:${userId}`;

export async function getManualCredits(userId: string): Promise<number> {
  const val = await redis.get<number>(creditsKey(userId));
  return typeof val === 'number' ? val : 0;
}

export async function addManualCredits(userId: string, delta: number) {
  await redis.incrby(creditsKey(userId), delta);
}

export async function setManualCredits(userId: string, value: number) {
  await redis.set(creditsKey(userId), value);
}

export async function decManualCredits(userId: string, value: number) {
  await redis.decrby(creditsKey(userId), value);
}

export async function getManualPlan(userId: string): Promise<string | null> {
  const plan = await redis.get<string>(planKey(userId));
  return plan ?? null;
}

export async function setManualPlan(userId: string, plan: string) {
  await redis.set(planKey(userId), plan);
}

// $ → credits и списание в manual-режиме
export async function trackCredits(costInDollars: number) {
  const profile = await currentUserProfile();
  const creditValue = 0.005;
  const creditsToCharge = Math.ceil(costInDollars / creditValue);
  await decManualCredits(profile.id, creditsToCharge);
}


