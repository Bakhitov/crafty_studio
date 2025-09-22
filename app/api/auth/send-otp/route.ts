import { NextResponse } from 'next/server';

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

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone) return NextResponse.json({ error: 'phone required' }, { status: 400 });

    const normalized = normalizePhone(phone);
    const code = genCode();
    const redisKey = `otp:${normalized}`;
    const rateKey = `otp_rate:${normalized}`;
    const RATE_LIMIT = 3; // max sends
    const RATE_WINDOW = 10 * 60; // seconds

    // rate limit: INCR and set EX if new
    const incrRes = await fetch(UPSTASH_REDIS_REST_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['INCR', rateKey]),
    });
    const incrJson = await incrRes.json();
    const counter = Number(incrJson?.result ?? 0);
    console.log(`Rate limit counter for ${normalized}: ${counter}`);
    if (counter === 1) {
      // set expiry
      await fetch(UPSTASH_REDIS_REST_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['EXPIRE', rateKey, String(RATE_WINDOW)]),
      });
    }
    if (counter > RATE_LIMIT) {
      return NextResponse.json({ sent: false, error: 'rate_limited' }, { status: 429 });
    }

    // сохраняем код в Upstash Redis
    const redisRes = await fetch(UPSTASH_REDIS_REST_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['SET', redisKey, code, 'EX', String(OTP_TTL_SEC)]),
    });
    const redisJson = await redisRes.json();
    console.log('Redis SET response:', redisJson);

    // отправляем запрос на внешний WhatsApp сервис
    let whRes;
    try {
      const requestOptions = {
        method: 'POST',
        headers: { apikey: WHATSAPP_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: normalized, text: code }),
      };
      console.log('Sending request to WhatsApp API:', { url: WHATSAPP_API_URL, options: requestOptions });
      whRes = await fetch(WHATSAPP_API_URL, requestOptions);
      console.log('Received response from WhatsApp API:', { status: whRes.status, statusText: whRes.statusText });
    } catch (err) {
      console.error('Failed to send request to WhatsApp API:', err);
      // не удалось дозвониться до внешнего сервиса, но код сохранён — сообщим об ошибке
      return NextResponse.json({ sent: false, error: 'whatsapp_unreachable' }, { status: 502 });
    }

    let whJson: any = null;
    try {
      const text = await whRes.text();
      console.log('WhatsApp API response body:', text);
      try {
        whJson = JSON.parse(text);
      } catch {
        console.error('Failed to parse JSON from WhatsApp API:', text);
        return NextResponse.json({ sent: false, error: 'whatsapp_invalid_response' }, { status: 502 });
      }
    } catch (err) {
      console.error('Failed to read response from WhatsApp API:', err);
      return NextResponse.json({ sent: false, error: 'whatsapp_unreachable' }, { status: 502 });
    }

    const sent = !!(whJson && whJson.key?.remoteJid);

    return NextResponse.json({ sent, meta: whJson ?? null });
  } catch (err) {
    console.error('Internal server error in send-otp:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}