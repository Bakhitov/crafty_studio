import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

// Hardcoded values as requested. Recommended: use env object from '@/lib/env.ts'
const UPSTASH_REDIS_REST_URL="https://oriented-herring-44347.upstash.io"
const UPSTASH_REDIS_REST_TOKEN="Aa07AAIncDE0NWYwM2Q3M2Q3NGM0NjMxYjg0NmI3ZTZkZDQ4MzUyMXAxNDQzNDc"

function normalizePhone(raw: string) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  return `7${digits}`;
}

export async function POST(req: Request) {
  try {
    const { phone, code, password } = await req.json();
    if (!phone || !code || !password) {
      return NextResponse.json({ error: 'phone, code and password required' }, { status: 400 });
    }

    const normalized = normalizePhone(phone);
    const redisKey = `otp:${normalized}`;
    const attemptsKey = `otp_attempts:${normalized}`;
    const MAX_ATTEMPTS = 5;
    const ATTEMPT_WINDOW = 60 * 60; // 1 hour

    // увеличиваем счётчик попыток проверки
    const attRes = await fetch(UPSTASH_REDIS_REST_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['INCR', attemptsKey]),
    });
    const attJson = await attRes.json();
    const attempts = Number(attJson?.result ?? 0);
    if (attempts === 1) {
      await fetch(UPSTASH_REDIS_REST_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['EXPIRE', attemptsKey, String(ATTEMPT_WINDOW)]),
      });
    }
    if (attempts > MAX_ATTEMPTS) {
      return NextResponse.json({ verified: false, error: 'too_many_attempts' }, { status: 429 });
    }

    // получить код из Upstash
    console.log(`Searching for code in Redis with key: ${redisKey}`);
    const getRes = await fetch(UPSTASH_REDIS_REST_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['GET', redisKey]),
    });
    const getJson = await getRes.json();
    const stored = getJson?.result ?? null;
    console.log(`Found code in Redis: ${stored}`);

    if (!stored) {
      return NextResponse.json({ verified: false, error: 'no_code_or_expired' }, { status: 400 });
    }

    if (String(stored) !== String(code)) {
      return NextResponse.json({ verified: false, error: 'invalid_code' }, { status: 400 });
    }

    // удалить ключ
    await fetch(UPSTASH_REDIS_REST_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['DEL', redisKey]),
    });

    const email = `${normalized}@crafty.com`;
    const body = { email, password, email_confirm: true };

    const supRes = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const supJson = await supRes.json();
    if (!supRes.ok) {
      return NextResponse.json({ verified: false, error: 'supabase_error', meta: supJson }, { status: 500 });
    }

    return NextResponse.json({ verified: true, user: supJson });
  } catch (err) {
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}