import { getSubscribedUser } from '@/lib/auth'
import { parseError } from '@/lib/error/parse'
import { gateway } from '@/lib/gateway'
import { createRateLimiter, slidingWindow } from '@/lib/rate-limit'
import { trackCreditUsage } from '@/lib/stripe'
import { streamText } from 'ai'

// Разрешаем стриминг до 30 секунд
export const maxDuration = 30

// Рейт-лимит для completion
const rateLimiter = createRateLimiter({
  limiter: slidingWindow(10, '1 m'),
  prefix: 'api-completion',
})

export const POST = async (req: Request) => {
  try {
    // Требуем авторизацию, чтобы списывать кредиты
    await getSubscribedUser()

    // Применяем рейт-лимит только в проде
    if (process.env.NODE_ENV === 'production') {
      const ip = req.headers.get('x-forwarded-for') || 'anonymous'
      const { success, limit, reset, remaining } = await rateLimiter.limit(ip)
      if (!success) {
        return new Response('Too many requests', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        })
      }
    }

    const body = await req.json()
    const prompt: unknown = body?.prompt
    const modelIdFromBody: unknown = body?.modelId
    const temperatureFromBody: unknown = body?.temperature

    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response('Prompt must be a non-empty string', { status: 400 })
    }

    const defaultModelId = 'stealth/sonoma-dusk-alpha'
    const modelId = typeof modelIdFromBody === 'string' ? modelIdFromBody : defaultModelId
    const temperature = typeof temperatureFromBody === 'number' ? temperatureFromBody : 0.3

    const result = streamText({
      model: gateway(modelId),
      temperature,
      system: [
        'You are an autocomplete engine.',
        'Continue the user\'s text naturally in the same language and style.',
        'Return ONLY the continuation. Do not repeat the user\'s input.',
        'Be concise and predictive (short to medium completion). If unsure, still suggest a plausible next few words.',
      ].join('\n'),
      prompt: `Input:\n${prompt}\n\nContinuation:`,
      onFinish: async ({ usage }) => {
        try {
          const { models } = await gateway.getAvailableModels()
          const model = models.find((m) => m.id === modelId)
          const inputPrice = model?.pricing?.input ? Number.parseFloat(model.pricing.input) : 0
          const outputPrice = model?.pricing?.output ? Number.parseFloat(model.pricing.output) : 0
          const inputTokens = usage.inputTokens ?? 0
          const outputTokens = usage.outputTokens ?? 0
          const costUsd = (inputTokens / 1_000_000) * inputPrice + (outputTokens / 1_000_000) * outputPrice
          const costCredits = costUsd * 200 // $1 = 200 кредитов
          await trackCreditUsage({ action: 'completion', cost: costCredits })
        } catch {}
      },
    })

    // Возвращаем чистый текстовый стрим для useCompletion
    return result.toTextStreamResponse()
  } catch (error) {
    const message = parseError(error)
    return new Response(message, { status: 400 })
  }
}


