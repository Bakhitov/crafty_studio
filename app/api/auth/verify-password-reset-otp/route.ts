import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

// Hardcoded values as requested. Recommended: use env object from '@/lib/env.ts'
const UPSTASH_REDIS_REST_URL="https://oriented-herring-44347.upstash.io"
const UPSTASH_REDIS_REST_TOKEN="Aa07AAIncDE0NWYwM2Q3M2Q3NGM0NjMxYjg0NmI3ZTZkZDQ4MzUyMXAxNDQzNDc"

function normalizePhone(raw: string) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  return `7${digits}`;
}

// Helper to find a user by email using the Supabase Admin API
async function getUserByEmail(email: string): Promise<any | null> {
    const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
            },
        });
        if (!response.ok) {
            throw new Error(`Supabase API failed: ${response.statusText}`);
        }
        const data = await response.json();
        if (data && data.users) {
            return data.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase()) || null;
        }
    } catch (e) {
        console.error("Error fetching user by email:", e);
    }
    return null;
}

export async function POST(req: Request) {
  try {
    const { phone, otp, password } = await req.json();

    if (!phone || !otp || !password) {
      return NextResponse.json({ error: 'phone, otp, and password required' }, { status: 400 });
    }

    const normalized = normalizePhone(phone);
    const redisKey = `otp_reset:${normalized}`;

    // Get the reset code from Upstash Redis
    const getRes = await fetch(UPSTASH_REDIS_REST_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
      body: JSON.stringify(['GET', redisKey]),
    });

    const getJson = await getRes.json();
    const storedOtp = getJson?.result;

    if (!storedOtp || String(storedOtp) !== String(otp)) {
      return NextResponse.json({ error: 'invalid_otp' }, { status: 400 });
    }

    // OTP is correct, now find the user
    const email = `${normalized}@crafty.com`;
    const user = await getUserByEmail(email);

    if (!user) {
        return NextResponse.json({ error: 'user_not_found' }, { status: 404 });
    }

    // Update the user's password via Supabase Admin API
    const updateUserUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${user.id}`;
    const updateRes = await fetch(updateUserUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: password })
    });

    if (!updateRes.ok) {
        const errorBody = await updateRes.json();
        console.error('Supabase password update error:', errorBody);
        return NextResponse.json({ error: 'supabase_update_error' }, { status: 500 });
    }

    // Delete the OTP from Redis after successful use
    await fetch(UPSTASH_REDIS_REST_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
        body: JSON.stringify(['DEL', redisKey]),
    });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Internal server error in verify-password-reset-otp:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
