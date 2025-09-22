import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

// Hardcoded values as requested. Recommended: use env object from '@/lib/env.ts'
const UPSTASH_REDIS_REST_URL="https://oriented-herring-44347.upstash.io"
const UPSTASH_REDIS_REST_TOKEN="Aa07AAIncDE0NWYwM2Q3M2Q3NGM0NjMxYjg0NmI3ZTZkZDQ4MzUyMXAxNDQzNDc"
const WHATSAPP_API_URL="http://31.97.73.87:8080/message/sendText/auth"
const WHATSAPP_API_KEY="429683C4C977415CAAFCCE10F7D57E11"

const OTP_TTL_SEC = 5 * 60; // 5 минут

function genCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

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
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: 'phone required' }, { status: 400 });
    }

    const normalized = normalizePhone(phone);
    const email = `${normalized}@crafty.com`;

    // Check if user exists
    const user = await getUserByEmail(email);

    if (!user) {
        console.log(`Password reset attempt for non-existent user: ${email}`)
        // We send a success response anyway to prevent user enumeration attacks
        return NextResponse.json({ sent: true });
    }

    const code = genCode();
    const redisKey = `otp_reset:${normalized}`;

    // Save the reset code to Upstash Redis
    const redisRes = await fetch(UPSTASH_REDIS_REST_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['SET', redisKey, code, 'EX', String(OTP_TTL_SEC)]),
    });

    const redisJson = await redisRes.json();
    if (redisJson.result !== 'OK') {
      throw new Error('Failed to save reset code to Redis.');
    }

    // Send the code via WhatsApp
    const whRes = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: { apikey: WHATSAPP_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: normalized, text: `Ваш код для сброса пароля: ${code}` }),
    });

    if (!whRes.ok) {
        throw new Error('Failed to send WhatsApp message.');
    }
    
    const whJson = await whRes.json();
    const sent = !!(whJson && whJson.key?.remoteJid);

    return NextResponse.json({ sent });

  } catch (err: any) {
    console.error('Internal server error in send-password-reset-otp:', err);
    // Do not send a detailed error message to the client
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}