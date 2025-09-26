"use client"

import { useEffect, useRef, useState } from "react"
import { Trash2Icon, XIcon } from "lucide-react"
import { ProjectChat } from "@/components/project-chat"
import { Button } from "@/components/ui/button"
import { RiChatAiLine } from "react-icons/ri"
import { MdOutlineBookmarks } from "react-icons/md"
import { createPortal } from "react-dom"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ProjectFloatingChatProps = {
  projectId: string
}

export const ProjectFloatingChat = ({ projectId }: ProjectFloatingChatProps) => {
    const [open, setOpen] = useState(true)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Load saved size on mount
  useEffect(() => {
    const key = `project-chat-size:${projectId}`
    const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null
    const computeHeight = (h: number) => {
      const top = 8 // top-2
      const bottom = 8 // небольшой нижний отступ
      const maxH = Math.max(300, window.innerHeight - top - bottom)
      const minH = Math.max(300, Math.round(maxH * 0.9)) // по умолчанию ~90% экрана
      // гарантируем не меньше 90% окна, но не больше maxH
      return Math.min(maxH, Math.max(h, minH))
    }
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { w: number; h: number }
        setSize({ w: parsed.w, h: computeHeight(parsed.h) })
        return
      } catch {}
    }
    if (typeof window !== 'undefined') {
      setSize({ w: 360, h: computeHeight(Math.round(window.innerHeight - 16)) })
    }
  }, [projectId])

  // Persist on resize
  useEffect(() => {
    if (!containerRef.current) return
    const key = `project-chat-size:${projectId}`
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect
        const next = { w: Math.round(cr.width), h: Math.round(cr.height) }
        try {
          localStorage.setItem(key, JSON.stringify(next))
        } catch {}
      }
    })
    ro.observe(containerRef.current)
    const handleWinResize = () => {
      setSize((prev) => {
        if (!prev) return prev
        const top = 8, bottom = 8
        const maxH = Math.max(300, window.innerHeight - top - bottom)
        const minH = Math.max(300, Math.round(maxH * 0.9))
        return { w: prev.w, h: Math.min(maxH, Math.max(prev.h, minH)) }
      })
    }
    window.addEventListener('resize', handleWinResize)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', handleWinResize)
    }
  }, [projectId, containerRef.current])

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={() => setOpen(true)}
      >
        <RiChatAiLine className="size-4" />
      </Button>
      {open && size &&
        createPortal(
          <div
            ref={containerRef}
            className="pointer-events-auto fixed left-2 top-2 z-[9999] flex resize flex-col overflow-hidden rounded-3xl border bg-background shadow-2xl"
            style={{
              width: size.w,
              height: size.h,
              minWidth: 320,
              minHeight: 300,
              maxHeight: `calc(100dvh - 16px)`,
            }}
          >
            <div className="flex items-center justify-between border-b px-2 py-1">
              <div className="flex items-center gap-2 pl-2">
                <RiChatAiLine className="size-4 text-foreground" />
                <span className="font-medium text-sm tracking-tight">
                  Crafty <span className="italic font-serif text-lg">studio</span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  title="Закладки"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    // TODO: открыть список сохранённых промптов/закладок
                  }}
                >
                  <MdOutlineBookmarks className="size-4" />
                </Button>
                <Button
                  title="Очистить чат"
                  variant="ghost"
                  size="icon"
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2Icon className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                  <XIcon className="size-4" />
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <ProjectChat projectId={projectId} />
            </div>
          </div>,
          document.body
        )}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить все сообщения?</DialogTitle>
            <DialogDescription>
              Это действие нельзя отменить. Все сообщения этого проекта будут удалены.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Отмена</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await fetch(`/api/projects/${projectId}/chat`, { method: 'DELETE' })
                } finally {
                  setConfirmOpen(false)
                  // Сообщим вложенному чату очиститься без перезагрузки страницы
                  try {
                    const ev = new CustomEvent('project-chat:cleared', { detail: { projectId } })
                    window.dispatchEvent(ev)
                  } catch {}
                }
              }}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}