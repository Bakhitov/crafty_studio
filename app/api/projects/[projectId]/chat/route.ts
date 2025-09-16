import { getSubscribedUser } from '@/lib/auth'
import { parseError } from '@/lib/error/parse'
import { createRateLimiter, slidingWindow } from '@/lib/rate-limit'
import { trackCreditUsage } from '@/lib/stripe'
import { database } from '@/lib/database'
import { projectMessages, projects } from '@/schema'
import { eq } from 'drizzle-orm'
import { convertToModelMessages, streamText } from 'ai'
import { gateway } from '@/lib/gateway'
import { AGENT_GUIDE_MD, SYSTEM_BASE } from '@/lib/agent/instructions'

export const maxDuration = 30

const rateLimiter = createRateLimiter({
  limiter: slidingWindow(10, '1 m'),
  prefix: 'api-project-chat',
})

export const POST = async (
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) => {
  try {
    const user = await getSubscribedUser()
    const { projectId } = await params

    // Авторизация: владелец или участник проекта
    const project = await database.query.projects.findFirst({
      where: eq(projects.id, projectId),
    })

    if (!project) {
      return new Response('Проект не найден', { status: 404 })
    }

    const isOwner = project.userId === user.id
    const isMember = (project.members ?? []).includes(user.id)
    if (!isOwner && !isMember) {
      return new Response('Доступ запрещён', { status: 403 })
    }

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
    const messages = body?.messages
    const webSearch: boolean = Boolean(body?.webSearch)

    // История: сохраняем входящие сообщения пользователя
    // Берём последнее пользовательское сообщение (если есть)
    const lastUserMessage = Array.isArray(messages)
      ? [...messages].reverse().find((m: any) => m.role === 'user')
      : undefined
    if (lastUserMessage?.parts?.length) {
      const userTextPart = lastUserMessage.parts.find((p: any) => p?.type === 'text')
      const userText = userTextPart?.text as string | undefined
      if (userText) {
        await database.insert(projectMessages).values({
          projectId,
          userId: user.id,
          role: 'user',
          content: userText,
        })
      }
    }

    // Показываем длинный агент-гайд ТОЛЬКО при первом обращении в чат проекта,
    // чтобы не надувать input токены на каждом запросе
    const hasHistory = await database
      .select({ id: projectMessages.id })
      .from(projectMessages)
      .where(eq(projectMessages.projectId, projectId))
      .limit(1)

    const systemPrompt = hasHistory.length
      ? [SYSTEM_BASE, `Project ID: ${projectId}`].join('\n')
      : [SYSTEM_BASE, `Project ID: ${projectId}`, '', AGENT_GUIDE_MD].join('\n')

    // Ограничиваем длину контекста: берём только последние 12 сообщений
    const trimmedMessages = Array.isArray(messages)
      ? messages.slice(-12)
      : []

    const result = streamText({
      model: gateway('stealth/sonoma-sky-alpha'),
      system: systemPrompt,
      messages: convertToModelMessages(trimmedMessages),
      onFinish: async ({ usage, text }) => {
        try {
          await database.insert(projectMessages).values({
            projectId,
            role: 'assistant',
            content: text ?? '',
          })

          const inputTokens = usage.inputTokens ?? 0
          const outputTokens = usage.outputTokens ?? 0

          // Получаем тарифы модели из Gateway (USD за 1M токенов)
          const { models } = await gateway.getAvailableModels()
          const sky = models.find((m) => m.id === 'stealth/sonoma-sky-alpha')
          const inputPrice = sky?.pricing?.input ? Number.parseFloat(sky.pricing.input) : 0
          const outputPrice = sky?.pricing?.output ? Number.parseFloat(sky.pricing.output) : 0
          const costUsd = (inputTokens / 1_000_000) * inputPrice + (outputTokens / 1_000_000) * outputPrice
          // Конверсия $ -> кредиты: $1 = 200 кредитов
          const costCredits = costUsd * 200

          await trackCreditUsage({
            action: 'project-chat',
            cost: costCredits,
          })
        } catch {}
      },
    })

    return result.toUIMessageStreamResponse({
      sendReasoning: true,
      sendSources: true,
    })
  } catch (error) {
    const message = parseError(error)
    return new Response(message, { status: 400 })
  }
}

export const GET = async (
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) => {
  try {
    const user = await getSubscribedUser()
    const { projectId } = await params
    const project = await database.query.projects.findFirst({
      where: eq(projects.id, projectId),
    })
    if (!project) return new Response('Проект не найден', { status: 404 })
    const isOwner = project.userId === user.id
    const isMember = (project.members ?? []).includes(user.id)
    if (!isOwner && !isMember) return new Response('Доступ запрещён', { status: 403 })

    const rows = await database
      .select()
      .from(projectMessages)
      .where(eq(projectMessages.projectId, projectId))
      .orderBy(projectMessages.createdAt)

    return new Response(JSON.stringify(rows), {
      headers: { 'content-type': 'application/json' },
    })
  } catch (error) {
    const message = parseError(error)
    return new Response(message, { status: 400 })
  }
}

export const DELETE = async (
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) => {
  try {
    const user = await getSubscribedUser()
    const { projectId } = await params
    const project = await database.query.projects.findFirst({
      where: eq(projects.id, projectId),
    })
    if (!project) return new Response('Проект не найден', { status: 404 })
    const isOwner = project.userId === user.id
    const isMember = (project.members ?? []).includes(user.id)
    if (!isOwner && !isMember) return new Response('Доступ запрещён', { status: 403 })

    await database.delete(projectMessages).where(eq(projectMessages.projectId, projectId))
    return new Response(null, { status: 204 })
  } catch (error) {
    const message = parseError(error)
    return new Response(message, { status: 400 })
  }
}


