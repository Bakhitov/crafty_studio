"use client"

import { useChat, useCompletion } from "@ai-sdk/react"
import { useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { DefaultChatTransport } from "ai"
import { Sparkles, Copy as CopyIcon, RotateCcw, Pencil } from "lucide-react"
import { RiAiGenerateText, RiImageCircleAiLine, RiMicAiLine, RiFilmAiLine } from "react-icons/ri"
import { MdBookmarkBorder, MdOutlineBookmark } from "react-icons/md"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
import { Actions, Action } from "@/components/ui/kibo-ui/ai/actions"
import {
  AIBranch,
  AIBranchMessages,
  AIBranchNext,
  AIBranchPage,
  AIBranchPrevious,
  AIBranchSelector,
} from "@/components/ui/kibo-ui/ai/branch"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

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

  // Inline подсказки при наборе (автодополнение) через /api/completion
  const {
    completion: suggestion,
    isLoading: suggLoading,
    error: suggError,
    stop: stopSuggestion,
    complete: runSuggestion,
    setCompletion: setSuggestion,
  } = useCompletion({
    api: "/api/completion",
    streamProtocol: 'text',
    // Троттли м обновления, чтобы не рендерить каждый чанк
    experimental_throttle: 80,
    onError: () => {
      // игнорируем UI-ошибку подсказки, чат работает отдельно
    },
  })
  const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPromptRef = useRef<string>("")
  const [autocompleteEnabled, setAutocompleteEnabled] = useState(false)

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
  const disabled = (typeof credits === 'number' && credits <= 0)
  const trimmed = inputValue.trim()
  const suggestionTrimmed = (suggestion ?? "").trim()
  const showGhost = Boolean(autocompleteEnabled && suggestionTrimmed && trimmed.length >= 3 && !disabled)
  const remainder = showGhost
    ? (suggestionTrimmed.toLowerCase().startsWith(trimmed.toLowerCase())
        ? suggestionTrimmed.slice(trimmed.length)
        : suggestionTrimmed)
    : ""

  // Правило пробела: если последний символ ввода не пробел и заканчивается на букву/цифру,
  // а рекомендация не начинается с пробела/знака пунктуации — добавляем ведущий пробел
  const endsWithWordChar = /[\p{L}\p{N}]$/u.test(inputValue)
  const noTrailingSpace = inputValue.length > 0 && !/\s$/.test(inputValue)
  const remainderStartsWithPunctOrSpace = remainder ? /^[\s.,;:!?)/\]}]/.test(remainder) : false
  const needLeadingSpace = Boolean(remainder && endsWithWordChar && noTrailingSpace && !remainderStartsWithPunctOrSpace)
  const displayRemainder = needLeadingSpace ? ` ${remainder}` : remainder

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const overlayRef = useRef<HTMLPreElement | null>(null)
  const inputContainerRef = useRef<HTMLDivElement | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const completionTyping = Boolean(autocompleteEnabled && !disabled && suggLoading)
  const [editId, setEditId] = useState<string | null>(null)
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [editText, setEditText] = useState<string>("")
  const [isBranching, setIsBranching] = useState(false)
  const [savedPromptIds, setSavedPromptIds] = useState<Record<string, boolean>>({})

  // Hashtag suggestions state
  const [tagQuery, setTagQuery] = useState<string>("")
  const [tagSuggestions, setTagSuggestions] = useState<Array<{ label: string; value: string }>>([])
  const [tagOpen, setTagOpen] = useState(false)
  const [tagIdx, setTagIdx] = useState(0)
  const tagTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const getCurrentHashtagLabels = (text: string): Set<string> => {
    const set = new Set<string>()
    // Поддерживаем формат с опциональными скобками после лейбла: #label (тег1, тег2)
    const re = /(^|\s)#([\p{L}\p{N}_-]{1,64})(?:\s*\([^)]*\))?(?=\s|$)/gu
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      const lbl = m[2]
      if (lbl) set.add(lbl)
    }
    return set
  }

  const escapeForRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const insertOrRemoveTag = (optOrLabel: { label: string; value: string } | string) => {
    const label = typeof optOrLabel === 'string' ? optOrLabel : optOrLabel.label
    const pickValue = typeof optOrLabel === 'string'
      ? (tagSuggestions.find((o) => o.label === optOrLabel)?.value)
      : optOrLabel.value
    const exists = getCurrentHashtagLabels(inputValue).has(label)
    if (exists) {
      // remove one or more occurrences safely (с учётом скобок)
      const re = new RegExp(`(^|\\s)#${escapeForRegExp(label)}(?:\\s*\\([^)]*\\))?(?=\\s|$)`, 'gu')
      const next = inputValue.replace(re, (m, p1) => (p1 ? p1 : ''))
        .replace(/\s{2,}/g, ' ')
        .trimStart()
      setInputValue(next)
      return
    }
    const ht = findCurrentHashtag(inputValue)
    // Сформируем формат: #label (синоним1, синоним2, ...), используя варианты с тем же value
    const groupLabels = pickValue
      ? Array.from(new Set(tagSuggestions.filter((o) => o.value === pickValue).map((o) => o.label)))
      : []
    const synonyms = groupLabels.filter((l) => l !== label)
    const formatted = `#${label}${synonyms.length ? ` (${synonyms.join(', ')})` : ''}`
    if (ht) {
      const next = inputValue.slice(0, ht.start) + formatted + inputValue.slice(ht.end)
      setInputValue(next)
    } else {
      const needSpace = inputValue.length > 0 && !/\s$/.test(inputValue)
      setInputValue(inputValue + (needSpace ? ' ' : '') + formatted)
    }
  }

  const getUiLang = (): string => {
    if (typeof document !== 'undefined') {
      const htmlLang = document.documentElement.lang?.slice(0, 2)
      if (htmlLang) return htmlLang
    }
    if (typeof navigator !== 'undefined') {
      const nav = navigator.language?.slice(0, 2)
      if (nav) return nav
    }
    return 'en'
  }

  const findHashtagAt = (
    text: string,
    caret: number
  ): { start: number; end: number; token: string; query: string } | null => {
    // Ищем токен вида #label (опционально со скобками) под курсором
    const re = /(^|\s)#([\p{L}\p{N}_-]{0,64})(?:\s*\([^)]*\))?(?=\s|$)/gu
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      const leading = m[1] ?? ''
      const full = m[0]
      const tokenStart = m.index + leading.length
      const tokenText = full.slice(leading.length)
      const tokenEnd = tokenStart + tokenText.length
      if (caret >= tokenStart && caret <= tokenEnd) {
        const label = m[2] ?? ''
        return { start: tokenStart, end: tokenEnd, token: tokenText, query: label }
      }
    }
    return null
  }

  const findCurrentHashtag = (text: string): { start: number; end: number; token: string; query: string } | null => {
    // Найти последний #токен до курсора (без учёта курсора для простоты — по концу строки)
    const re = /(^|\s)#([\p{L}\p{N}_-]{0,64})$/u
    const m = text.match(re)
    if (!m) return null
    const token = `#${m[2] ?? ''}`
    const end = text.length
    const start = end - token.length
    return { start, end, token, query: m[2] ?? '' }
  }

  const getMessageText = (m: any): string => {
    if (Array.isArray(m?.parts)) {
      const t = m.parts.find((p: any) => p?.type === 'text')
      return t?.text ?? ''
    }
    return m?.content ?? ''
  }

  const handleCopy = async (m: any) => {
    try {
      await navigator.clipboard.writeText(getMessageText(m))
    } catch {}
  }

  const handleRegenerate = (idx: number) => {
    const arr = messages as any[]
    // Найти последнее пользовательское сообщение до текущего ассистентского
    let userIdx = -1
    for (let i = idx - 1; i >= 0; i -= 1) {
      if (arr[i]?.role === 'user') { userIdx = i; break }
    }
    if (userIdx === -1) return
    const ctx = arr.slice(0, userIdx + 1)

    setIsBranching(true)
    void (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/alternatives`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ messages: ctx, n: 1 }),
        })
        if (!res.ok) throw new Error('failed')
        const data = await res.json() as { variants: string[] }
        const nextText = (Array.isArray(data.variants) && data.variants[0]) ? data.variants[0] : ''
        setMessages((prev: any[]) => {
          const draft = [...prev]
          const msg = draft[idx]
          if (msg && Array.isArray((msg as any).parts)) {
            const parts = (msg as any).parts.filter((p: any) => p?.type === 'text')
            ;(msg as any).parts = parts.concat([{ type: 'text', text: nextText }])
          } else if (msg) {
            const existing = getMessageText(msg)
            ;(msg as any).parts = [{ type: 'text', text: existing }, { type: 'text', text: nextText }]
          }
          return draft
        })
      } catch {
        // no-op
      } finally {
        setIsBranching(false)
      }
    })()
  }

  const startEdit = (m: any, idx: number) => {
    setEditId(m.id)
    setEditIdx(idx)
    setEditText(getMessageText(m))
    setEditOpen(true)
  }

  const saveEdit = () => {
    const text = editText.trim()
    if (!text || editIdx == null) {
      setEditOpen(false)
      return
    }
    const arr = messages as any[]
    // Обновляем пользовательское сообщение, добавляя ветку
    const draft = [...arr]
    const userMsg = draft[editIdx]
    if (userMsg) {
      if (Array.isArray((userMsg as any).parts)) {
        const parts = (userMsg as any).parts.filter((p: any) => p?.type === 'text')
        ;(userMsg as any).parts = parts.concat([{ type: 'text', text }])
      } else {
        const existing = getMessageText(userMsg)
        ;(userMsg as any).parts = [{ type: 'text', text: existing }, { type: 'text', text }]
      }
    }
    // Формируем контекст с новым текстом пользователя
    const ctx = draft.slice(0, editIdx).concat([{ id: (userMsg as any)?.id, role: 'user', parts: [{ type: 'text', text }] }])

    setIsBranching(true)
    void (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/alternatives`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ messages: ctx, n: 1 }),
        })
        if (!res.ok) throw new Error('failed')
        const data = await res.json() as { variants: string[] }
        const nextText = (Array.isArray(data.variants) && data.variants[0]) ? data.variants[0] : ''

        setMessages(() => {
          // Обрежем историю после userMsg и добавим один новый ответ ассистента
          const base = draft.slice(0, editIdx + 1)
          return base.concat([{ id: `${Date.now()}`, role: 'assistant', parts: [{ type: 'text', text: nextText }] }])
        })
      } catch {
        // no-op
      } finally {
        setIsBranching(false)
        setEditOpen(false)
        setEditId(null)
        setEditIdx(null)
        setEditText("")
      }
    })()
  }

  // Синхронизируем типографику и отступы оверлея с textarea, чтобы всё совпадало пиксельно
  useEffect(() => {
    const ta = textareaRef.current
    const ov = overlayRef.current
    if (!ta || !ov) return
    const cs = getComputedStyle(ta)
    const s = ov.style
    s.fontFamily = cs.fontFamily
    s.fontSize = cs.fontSize
    s.fontWeight = cs.fontWeight as string
    s.lineHeight = cs.lineHeight
    s.letterSpacing = cs.letterSpacing
    s.whiteSpace = 'pre-wrap'
    s.color = cs.color
    s.paddingTop = cs.paddingTop
    s.paddingBottom = cs.paddingBottom
    s.paddingLeft = cs.paddingLeft
    s.paddingRight = cs.paddingRight
  }, [textareaRef.current, overlayRef.current])

  // Авто-ресайз textarea и контейнера под число строк
  useEffect(() => {
    const ta = textareaRef.current
    const cont = inputContainerRef.current
    const ov = overlayRef.current
    if (!ta) return
    const resize = () => {
      // вычисляем max высоту = 10 строк (+ вертикальные паддинги)
      const cs = getComputedStyle(ta)
      const parsePx = (v: string) => (v.endsWith('px') ? parseFloat(v) : Number.NaN)
      const lineH = parsePx(cs.lineHeight) || parsePx(cs.fontSize) * 1.2 || 20
      const padT = parsePx(cs.paddingTop) || 0
      const padB = parsePx(cs.paddingBottom) || 0
      const maxH = Math.round(lineH * 10 + padT + padB)

      // контентная высота = максимум из текста и оверлея
      ta.style.height = 'auto'
      const taH = ta.scrollHeight
      const ovH = ov ? ov.scrollHeight : 0
      const contentH = Math.max(taH, ovH)
      const clampedH = Math.min(contentH, maxH)

      ta.style.height = `${clampedH}px`
      ta.style.overflowY = contentH > maxH ? 'auto' : 'hidden'
      if (ov) {
        ov.style.height = `${clampedH}px`
      }
      if (cont) {
        cont.style.height = `${clampedH}px`
        // При открытой панели подсказок разрешаем overflow, чтобы дропдаун был виден
        cont.style.overflowY = tagOpen ? 'visible' as any : 'hidden'
      }
    }
    resize()
    const onWin = () => resize()
    window.addEventListener('resize', onWin)
    return () => window.removeEventListener('resize', onWin)
  }, [inputValue, displayRemainder, tagOpen])

  // На всякий случай дублируем установку overflow при смене состояния панели
  useEffect(() => {
    const cont = inputContainerRef.current
    if (!cont) return
    try {
      cont.style.overflow = tagOpen ? 'visible' : 'hidden'
      cont.style.overflowY = tagOpen ? 'visible' as any : 'hidden'
    } catch {}
  }, [tagOpen])

  // Синхронизируем прокрутку оверлея с textarea при скролле
  useEffect(() => {
    const ta = textareaRef.current
    const ov = overlayRef.current
    if (!ta || !ov) return
    const onScroll = () => {
      ov.scrollTop = ta.scrollTop
    }
    ta.addEventListener('scroll', onScroll)
    return () => ta.removeEventListener('scroll', onScroll)
  }, [])

  // Чистим debounce-таймер при размонтировании
  useEffect(() => {
    return () => {
      if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current)
    }
  }, [])

  return (
    <div className="flex h-full flex-col">
      <AIConversation>
        <AIConversationContent>
          {messages.map((m, idx) => {
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
                  (() => {
                    const isUser = m.role === 'user'
                    const textParts = parts.filter((p: any) => p?.type === 'text')
                    const otherParts = parts.filter((p: any) => p?.type !== 'text')

                      return (
                      <>
                        {textParts.length > 0 && (
                          <AIMessage from={isUser ? 'user' : 'assistant'}>
                            <div className="flex w-full flex-col gap-1 items-end group-[.is-assistant]:items-start">
                              {/* Контент сообщения */}
                              {textParts.length > 1 ? (
                                <AIBranch className="w-full">
                                  <AIBranchMessages>
                                    {textParts.map((tp: any, bi: number) => (
                                      <div key={`${m.id}-b-${bi}`}>
                                        <AIMessageContent>
                                          <AIResponse>{tp.text}</AIResponse>
                                        </AIMessageContent>
                                      </div>
                                    ))}
                                  </AIBranchMessages>
                                  <div className=" flex justify-end items-center gap-1.5 self-end group-[.is-assistant]:self-start group-[.is-assistant]:justify-start opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
                                    <Actions>
                                      <Action tooltip="Копировать" onClick={() => handleCopy(m)}>
                                        <CopyIcon className="size-4" />
                                      </Action>
                                      {!isUser && (
                                        <Action tooltip="Регенерировать" onClick={() => handleRegenerate(idx)}>
                                          <RotateCcw className="size-4" />
                                        </Action>
                                      )}
                                      {isUser && (
                                        <Action tooltip="Редактировать" onClick={() => startEdit(m, idx)}>
                                          <Pencil className="size-4" />
                                        </Action>
                                      )}
                                  <Action
                                    tooltip={savedPromptIds[m.id] ? 'Убрать из промптов' : 'Сохранить как промпт'}
                                    onClick={async () => {
                                      const text = getMessageText(m)
                                      const tags = (() => {
                                        const re = /(^|\s)#([\p{L}\p{N}_-]{1,64})/gu
                                        const set = new Set<string>()
                                        let mm: RegExpExecArray | null
                                        while ((mm = re.exec(text)) !== null) {
                                          const t = mm[2]
                                          if (t) set.add(t)
                                        }
                                        return Array.from(set)
                                      })()
                                      try {
                                        if (!savedPromptIds[m.id]) {
                                          await fetch('/api/prompt', {
                                            method: 'POST',
                                            headers: { 'content-type': 'application/json' },
                                            body: JSON.stringify({ modality: 'Text', text, tags }),
                                          })
                                        }
                                        setSavedPromptIds((prev) => ({ ...prev, [m.id]: !prev[m.id] }))
                                      } catch {}
                                    }}
                                  >
                                    {savedPromptIds[m.id]
                                      ? (<MdOutlineBookmark className="size-5" />)
                                      : (<MdBookmarkBorder className="size-5" />)}
                                  </Action>
                                    </Actions>
                                  <div className="flex items-center gap-1">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span>
                                            <AIBranchPrevious />
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="z-[10000]">
                                          <p>Предыдущий вариант</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <AIBranchPage />
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span>
                                            <AIBranchNext />
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="z-[10000]">
                                          <p>Следующий вариант</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                  </div>
                                </AIBranch>
                              ) : (
                          <AIMessageContent>
                                  <AIResponse>{textParts[0].text}</AIResponse>
                          </AIMessageContent>
                              )}
                              {/* Панель действий под баблом (для одиночной версии) */}
                              {textParts.length === 1 && (
                                <div className="mt-0.5 flex items-center gap-1.5 self-end group-[.is-assistant]:self-start opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
                                  <Actions>
                                    <Action tooltip="Копировать" onClick={() => handleCopy(m)}>
                                      <CopyIcon className="size-4" />
                                    </Action>
                                    {!isUser && (
                                      <Action tooltip="Регенерировать" onClick={() => handleRegenerate(idx)}>
                                        <RotateCcw className="size-4" />
                                      </Action>
                                    )}
                                    {isUser && (
                                      <Action tooltip="Редактировать" onClick={() => startEdit(m, idx)}>
                                        <Pencil className="size-4" />
                                      </Action>
                                    )}
                                  </Actions>
                                </div>
                              )}
                            </div>
                        </AIMessage>
                        )}

                        {otherParts.map((part: any, i: number) => {
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
                        })}
                      </>
                    )
                  })()
                ) : (
                  <AIMessage from={m.role === 'user' ? 'user' : 'assistant'}>
                    <div className="flex w-full flex-col gap-1 items-end group-[.is-assistant]:items-start">
                    <AIMessageContent>
                      <AIResponse>{(m as any).content}</AIResponse>
                    </AIMessageContent>
                      <div className="mt-1 flex items-center gap-2 self-end group-[.is-assistant]:self-start">
                        <Actions>
                          <Action tooltip="Копировать" onClick={() => handleCopy(m)}>
                            <CopyIcon className="size-4" />
                          </Action>
                          {m.role === 'assistant' && (
                            <Action tooltip="Регенерировать" onClick={() => handleRegenerate(idx)}>
                              <RotateCcw className="size-4" />
                            </Action>
                          )}
                          {m.role === 'user' && (
                            <Action tooltip="Редактировать" onClick={() => startEdit(m, idx)}>
                              <Pencil className="size-4" />
                            </Action>
                          )}
                        </Actions>
                      </div>
                    </div>
                  </AIMessage>
                )}
              </div>
            )
          })}
          {status === 'streaming' && (
            <div className="px-3 py-2 text-muted-foreground flex items-center gap-1">
              <span className="inline-flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:-200ms]"></span>
                <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:-100ms]"></span>
                <span className="size-1.5 rounded-full bg-current animate-bounce"></span>
              </span>
            </div>
          )}
          {error && (
            <div className="text-xs text-destructive">{String(error)}</div>
          )}
        </AIConversationContent>
        <AIConversationScrollButton />
      </AIConversation>

      {/* Диалог редактирования моего сообщения */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Редактировать сообщение</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-1">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="Измените текст и сохраните"
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setEditOpen(false)}>Отмена</Button>
            <Button size="sm" onClick={saveEdit}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AIInput
        onSubmit={async (e) => {
          e.preventDefault()
          const text = inputValue.trim()
          if (!text || disabled) return
          await sendMessage({ text }, { body: { webSearch: false } })
          setInputValue("")
          // Останавливаем текущую подсказку
          try { stopSuggestion() } catch {}
          setSuggestion("")
        }}
        className="mt-2 rounded-b-3xl rounded-t-none border shadow-sm"
      >
        <div className="relative" ref={inputContainerRef}>
        <AIInputTextarea
            ref={textareaRef as any}
          value={inputValue}
            onChange={(e) => {
              const val = e.target.value
              setInputValue(val)
            // Hashtag suggestions debounce (по позиции курсора)
            const caret = (e.target as HTMLTextAreaElement).selectionStart ?? val.length
            const ht = findHashtagAt(val, caret)
            const q = ht?.query ?? ''
            if (tagTimerRef.current) clearTimeout(tagTimerRef.current)
            if (ht && q.length >= 1 && !disabled) {
              tagTimerRef.current = setTimeout(async () => {
                try {
                  const lang = getUiLang()
                  const res = await fetch(`/api/tags?lang=${encodeURIComponent(lang)}&search=${encodeURIComponent(q)}`)
                  if (!res.ok) { setTagOpen(false); setTagSuggestions([]); return }
                  const data = await res.json() as { options?: Array<{ label: string; value: string }> }
                  const opts = Array.isArray(data?.options) ? data.options.slice(0, 8) : []
                  setTagSuggestions(opts)
                  setTagIdx(0)
                  setTagOpen(opts.length > 0)
                  setTagQuery(q)
                } catch {
                  setTagOpen(false)
                }
              }, 200)
            } else {
              setTagOpen(false)
              setTagSuggestions([])
              setTagIdx(0)
              setTagQuery('')
            }
              const t = val.trim()
              // Дебаунсим запрос к /api/completion и не дублируем одинаковый промпт
              if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current)
              const canSuggest = t.length >= 3 && !disabled && !loading && autocompleteEnabled
              if (canSuggest) {
                suggestTimerRef.current = setTimeout(async () => {
                  if (lastPromptRef.current === t) return
                  try {
                    // Останавливаем предыдущий стрим подсказки, если идёт
                    try { stopSuggestion() } catch {}
                    await runSuggestion(t, { body: { temperature: 0.3 } })
                    lastPromptRef.current = t
                  } catch {}
                }, 2000)
              } else {
                lastPromptRef.current = ""
                try { stopSuggestion() } catch {}
              }
            }}
            onKeyDown={(e) => {
              // Навигация по подсказкам хештегов
              if (tagOpen && tagSuggestions.length > 0) {
                if (e.key === 'ArrowDown') { e.preventDefault(); setTagIdx((i) => Math.min(i + 1, tagSuggestions.length - 1)); return }
                if (e.key === 'ArrowUp') { e.preventDefault(); setTagIdx((i) => Math.max(i - 1, 0)); return }
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const caret = (e.currentTarget as HTMLTextAreaElement).selectionStart ?? inputValue.length
                  const ht = findHashtagAt(inputValue, caret)
                  const pick = tagSuggestions[tagIdx]
                  if (ht && pick) {
                    // Вставляем отформатированный тег: #label (синонимы)
                    const groupLabels = Array.from(new Set(tagSuggestions.filter((o) => o.value === pick.value).map((o) => o.label)))
                    const synonyms = groupLabels.filter((l) => l !== pick.label)
                    const formatted = `#${pick.label}${synonyms.length ? ` (${synonyms.join(', ')})` : ''}`
                    const next = inputValue.slice(0, ht.start) + formatted + inputValue.slice(ht.end)
                    setInputValue(next)
                    setTagOpen(false)
                    setTagSuggestions([])
                    setTagIdx(0)
                    setTagQuery('')
                    // Переместим курсор в конец вставленного токена
                    setTimeout(() => {
                      const el = textareaRef.current
                      try { el?.setSelectionRange(ht.start + formatted.length, ht.start + formatted.length) } catch {}
                    }, 0)
                    return
                  }
                }
                if (e.key === 'Escape') { setTagOpen(false); return }
              }
              if (e.key === 'Tab') {
                if (autocompleteEnabled && suggestion && !disabled) {
                  e.preventDefault()
                  const suffix = displayRemainder
                  const accept = inputValue + suffix
                  setInputValue(accept)
                  try { stopSuggestion() } catch {}
                  lastPromptRef.current = accept.trim()
                  // Снимаем выделение и ставим курсор в конец
                  setTimeout(() => {
                    try {
                      const el = textareaRef.current
                      if (el) {
                        const pos = accept.length
                        el.setSelectionRange(pos, pos)
                        // Обновим высоту после вставки (учитываем оверлей)
                        const ov = overlayRef.current
                        const cs = getComputedStyle(el)
                        const parsePx = (v: string) => (v.endsWith('px') ? parseFloat(v) : Number.NaN)
                        const lineH = parsePx(cs.lineHeight) || parsePx(cs.fontSize) * 1.2 || 20
                        const padT = parsePx(cs.paddingTop) || 0
                        const padB = parsePx(cs.paddingBottom) || 0
                        const maxH = Math.round(lineH * 10 + padT + padB)
                        el.style.height = 'auto'
                        const taH = el.scrollHeight
                        const ovH = ov ? ov.scrollHeight : 0
                        const contentH = Math.max(taH, ovH)
                        const clampedH = Math.min(contentH, maxH)
                        el.style.height = `${clampedH}px`
                        el.style.overflowY = contentH > maxH ? 'auto' : 'hidden'
                        if (ov) ov.style.height = `${clampedH}px`
                        if (inputContainerRef.current) {
                          inputContainerRef.current.style.height = `${clampedH}px`
                          inputContainerRef.current.style.overflowY = 'hidden'
                        }
                      }
                    } catch {}
                  }, 0)
                  // Сбрасываем текущие рекомендации, чтобы не можно было добавить повторно
                  setSuggestion('')
                }
              }
              // Submit on Enter (без модификаторов). Shift+Enter — перенос строки
              else if (
                e.key === 'Enter' &&
                !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey &&
                !((e as any).isComposing || (e as any).nativeEvent?.isComposing)
              ) {
                e.preventDefault()
                const text = inputValue.trim()
                if (!text || disabled) return
                // Отправляем и сбрасываем состояние
                void sendMessage({ text }, { body: { webSearch: false } })
                setInputValue('')
                setSuggestion('')
                try { stopSuggestion() } catch {}
                // Обновим высоту после очистки
                setTimeout(() => {
                  try {
                    const el = textareaRef.current
                    if (el) {
                      el.style.height = 'auto'
                      const cs = getComputedStyle(el)
                      const parsePx = (v: string) => (v.endsWith('px') ? parseFloat(v) : Number.NaN)
                      const lineH = parsePx(cs.lineHeight) || parsePx(cs.fontSize) * 1.2 || 20
                      const padT = parsePx(cs.paddingTop) || 0
                      const padB = parsePx(cs.paddingBottom) || 0
                      const maxH = Math.round(lineH * 10 + padT + padB)
                      const ov = overlayRef.current
                      const taH = el.scrollHeight
                      const ovH = ov ? ov.scrollHeight : 0
                      const contentH = Math.max(taH, ovH)
                      const clampedH = Math.min(contentH, maxH)
                      el.style.height = `${clampedH}px`
                      el.style.overflowY = 'hidden'
                      if (ov) ov.style.height = `${clampedH}px`
                      if (inputContainerRef.current) {
                        inputContainerRef.current.style.height = `${clampedH}px`
                        inputContainerRef.current.style.overflowY = 'hidden'
                      }
                    }
                  } catch {}
                }, 0)
              }
            }}
          placeholder={disabled ? "Недостаточно кредитов" : "Введите сообщение..."}
          disabled={disabled}
            className={"rounded-b-3xl px-4"}
          />
            <pre
              ref={overlayRef}
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 m-0 whitespace-pre-wrap break-words rounded-b-3xl bg-transparent"
            >
            {/* Подсветка хэштегов поверх textarea: обычный текст прозрачный, #теги видимы */}
            {(() => {
              const parts: Array<{ t: string; isTag: boolean }> = []
              if (inputValue.length > 0) {
                // Подсвечиваем даже одинокую решётку (0..64 символов после #)
                const re = /(#[\p{L}\p{N}_-]{0,64})/gu
                let lastIndex = 0
                let m: RegExpExecArray | null
                while ((m = re.exec(inputValue)) !== null) {
                  if (m.index > lastIndex) {
                    parts.push({ t: inputValue.slice(lastIndex, m.index), isTag: false })
                  }
                  parts.push({ t: m[0], isTag: true })
                  lastIndex = re.lastIndex
                }
                if (lastIndex < inputValue.length) {
                  parts.push({ t: inputValue.slice(lastIndex), isTag: false })
                }
              } else {
                parts.push({ t: '', isTag: false })
              }
              return parts.map((p, i) => (
                <span key={i} className={p.isTag ? 'text-sky-500' : 'text-transparent'}>
                  {p.t}
                </span>
              ))
            })()}
            {showGhost && displayRemainder ? (
                <span className="text-muted-foreground/60">{displayRemainder}</span>
              ) : null}
            </pre>
        </div>
        {/* Под полем: подсказки #тегов */}
        {(tagOpen && tagSuggestions.length > 0) ? (
          <div className="px-2 pb-2 pt-1 flex flex-col gap-1">
            {tagOpen && tagSuggestions.length > 0 ? (
              <div className="px-2 py-2">
                {(() => {
                  const uniq = Array.from(new Set(tagSuggestions.map((o) => o.value)))
                  const title = uniq.length === 1 ? `#${uniq[0]}` : ''
                  return title ? (
                    <div className="px-1 mb-1.5 text-xs font-medium">{title}</div>
                  ) : null
                })()}
                <div className="flex flex-wrap gap-2 max-h-56 overflow-auto">
                  {tagSuggestions.map((opt, i) => (
                    <button
                      key={`${opt.value}-${i}`}
                      type="button"
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
                        getCurrentHashtagLabels(inputValue).has(opt.label)
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : (i === tagIdx
                              ? 'bg-accent text-accent-foreground shadow-sm'
                              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm')
                      }`}
                      onMouseEnter={() => setTagIdx(i)}
                      onClick={() => insertOrRemoveTag(opt)}
                    >
                      <span className="truncate font-medium text-sky-600">#{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        <AIInputToolbar className="border-none">
          <AIInputTools>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
            <AIInputButton
              onClick={() => {
                setAutocompleteEnabled((prev) => {
                  const next = !prev
                  if (!next) {
                    if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current)
                    try { stopSuggestion() } catch {}
                    setSuggestion('')
                  }
                  return next
                })
              }}
              aria-pressed={autocompleteEnabled}
              className={
                (autocompleteEnabled
                  ? 'text-primary bg-primary/10 hover:bg-primary/15'
                  : 'text-muted-foreground hover:bg-muted/50') + ' rounded-full h-8 w-8 p-0 inline-flex items-center justify-center'
              }
            >
                    <RiAiGenerateText className="size-4" />
            </AIInputButton>
                </TooltipTrigger>
                <TooltipContent className="z-[10000]">
                  <p>{autocompleteEnabled ? 'Отключить автодополнение' : 'Включить автодополнение'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </AIInputTools>
          <div className="flex items-center gap-2">
            {completionTyping && (
              <span className="text-muted-foreground inline-flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:-200ms]"></span>
                <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:-100ms]"></span>
                <span className="size-1.5 rounded-full bg-current animate-bounce"></span>
              </span>
            )}
            <AIInputSubmit disabled={disabled} status={status} className="rounded-3xl" />
          </div>
        </AIInputToolbar>
      </AIInput>
    </div>
  )
}


