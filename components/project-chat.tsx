"use client"

import { useChat } from "@ai-sdk/react"
import { useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { DefaultChatTransport } from "ai"
import {
  AIConversation,
  AIConversationContent,
  AIConversationScrollButton,
} from "@/components/ui/kibo-ui/ai/conversation"
import {
  AIMessage,
  AIMessageContent,
} from "@/components/ui/kibo-ui/ai/message"
import { AIResponse } from "@/components/ui/kibo-ui/ai/response"
import {
  AIReasoning,
  AIReasoningTrigger,
  AIReasoningContent,
} from "@/components/ui/kibo-ui/ai/reasoning"
import {
  AISources,
  AISourcesTrigger,
  AISourcesContent,
  AISource,
} from "@/components/ui/kibo-ui/ai/source"
import {
  AIInput,
  AIInputTextarea,
  AIInputToolbar,
  AIInputTools,
  AIInputButton,
  AIInputSubmit,
} from "@/components/ui/kibo-ui/ai/input"

type ProjectChatProps = {
  projectId: string
}

export const ProjectChat = ({ projectId }: ProjectChatProps) => {
  const { data: creditsData } = useSWR<{ credits?: number; error?: string }>(
    "/api/credits",
    () => fetch("/api/credits").then((r) => r.json())
  )

  const {
    messages,
    sendMessage,
    error,
    setMessages,
    status,
  } = useChat({
    id: projectId,
    transport: new DefaultChatTransport({ api: `/api/projects/${projectId}/chat` }),
  })

  const [inputValue, setInputValue] = useState("")

  // Persist/rehydrate messages in localStorage to avoid refetch on every open
  const storageKey = `project-chat:messages:${projectId}`
  const hydratedRef = useRef(false)

  // Rehydrate from storage on mount
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
      if (raw) {
        const parsed = JSON.parse(raw) as { id: string; role: 'user' | 'assistant' | 'system'; content?: string; parts?: any[] }[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(
            parsed.map((r) => (
              r.parts
                ? { id: r.id, role: r.role, parts: r.parts }
                : { id: r.id, role: r.role, parts: [{ type: 'text', text: r.content ?? '' }] }
            ))
          )
          hydratedRef.current = true
        }
      }
    } catch {}
  }, [projectId, setMessages])

  // Persist on messages change
  useEffect(() => {
    try {
      const serializable = messages.map((m: any) => {
        const parts = Array.isArray(m.parts) ? m.parts : [{ type: 'text', text: m.content ?? '' }]
        return { id: m.id, role: m.role, parts }
      })
      localStorage.setItem(storageKey, JSON.stringify(serializable))
    } catch {}
  }, [projectId, messages])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        // Если уже восстановили из storage или есть сообщения — не запрашиваем снова
        if (hydratedRef.current || (Array.isArray(messages) && messages.length > 0)) return
        const res = await fetch(`/api/projects/${projectId}/chat`, { method: 'GET' })
        if (!res.ok) return
        const rows: { id: string; role: 'user' | 'assistant' | 'system'; content: string }[] = await res.json()
        if (cancelled) return
        setMessages(
          rows.map((r) => ({ id: r.id, role: r.role, parts: [{ type: 'text', text: r.content }] }))
        )
      } catch {}
    }
    load()
    return () => {
      cancelled = true
    }
  }, [projectId, setMessages, messages])

  // Listen for external clear events to reset without page reload
  useEffect(() => {
    const onCleared = (e: Event) => {
      const detail = (e as CustomEvent).detail as { projectId?: string } | undefined
      if (!detail || detail.projectId !== projectId) return
      setMessages([])
      try { localStorage.removeItem(storageKey) } catch {}
    }
    window.addEventListener('project-chat:cleared' as any, onCleared)
    return () => window.removeEventListener('project-chat:cleared' as any, onCleared)
  }, [projectId, setMessages])

  const credits = typeof creditsData?.credits === 'number' ? creditsData.credits : undefined
  const loading = status === 'submitted' || status === 'streaming'
  const disabled = loading || (typeof credits === 'number' && credits <= 0)

  return (
    <div className="flex h-full flex-col">
      <AIConversation>
        <AIConversationContent>
          {messages.map((m) => {
            const anyMsg = m as any
            const parts = Array.isArray(anyMsg.parts) ? anyMsg.parts : null
            const sources = parts?.filter((p: any) => p?.type === 'source-url') ?? []

            return (
              <div key={m.id}>
                {m.role === 'assistant' && sources.length > 0 && (
                  <AISources>
                    <AISourcesTrigger count={sources.length} />
                    <AISourcesContent>
                      {sources.map((p: any, i: number) => (
                        <AISource key={`${m.id}-src-${i}`} href={p.url} title={p.url} />
                      ))}
                    </AISourcesContent>
                  </AISources>
                )}

                {parts ? (
                  parts.map((part: any, i: number) => {
                    if (part?.type === 'text') {
                      return (
                        <AIMessage key={`${m.id}-${i}`} from={m.role === 'user' ? 'user' : 'assistant'}>
                          <AIMessageContent>
                            <AIResponse>{part.text}</AIResponse>
                          </AIMessageContent>
                        </AIMessage>
                      )
                    }
                    if (part?.type === 'reasoning') {
                      const isLastStreaming =
                        status === 'streaming' && i === parts.length - 1 && m.id === messages.at(-1)?.id
                      return (
                        <AIReasoning key={`${m.id}-rsn-${i}`} isStreaming={isLastStreaming}>
                          <AIReasoningTrigger />
                          <AIReasoningContent>{part.text}</AIReasoningContent>
                        </AIReasoning>
                      )
                    }
                    return null
                  })
                ) : (
                  <AIMessage from={m.role === 'user' ? 'user' : 'assistant'}>
                    <AIMessageContent>
                      <AIResponse>{(m as any).content}</AIResponse>
                    </AIMessageContent>
                  </AIMessage>
                )}
              </div>
            )
          })}
          {error && (
            <div className="text-xs text-destructive">{String(error)}</div>
          )}
        </AIConversationContent>
        <AIConversationScrollButton />
      </AIConversation>

      <AIInput
        onSubmit={async (e) => {
          e.preventDefault()
          const text = inputValue.trim()
          if (!text || disabled) return
          await sendMessage({ text }, { body: { webSearch: false } })
          setInputValue("")
        }}
        className="mt-2 rounded-b-3xl rounded-t-none border shadow-sm"
      >
        <AIInputTextarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={disabled ? "Недостаточно кредитов" : "Введите сообщение..."}
          disabled={disabled}
          className="rounded-b-3xl px-4"
        />
        <AIInputToolbar>
          <AIInputTools>
            {/* Зарезервировано под кнопки вложений/поиска */}
          </AIInputTools>
          <AIInputSubmit disabled={disabled} status={status} className="rounded-3xl" />
        </AIInputToolbar>
      </AIInput>
    </div>
  )
}


