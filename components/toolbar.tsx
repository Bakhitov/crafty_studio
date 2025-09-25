'use client';

import { useNodeOperations } from '@/providers/node-operations';
import { Panel, useReactFlow } from '@xyflow/react';
import { memo, useCallback, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { XIcon, FileIcon, DownloadIcon, Trash2Icon, CheckIcon } from 'lucide-react';
import { deleteUserFile } from '@/app/actions/image/delete-file';
import Image from 'next/image';
import { listUserFiles, type UserFile } from '@/app/actions/image/list-files';
import { createPortal } from 'react-dom';
import { TbFolders } from "react-icons/tb";
import { download } from '@/lib/download';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from './ui/kibo-ui/dropzone';
import { uploadFile } from '@/lib/upload';
import { ImageZoom } from './ui/kibo-ui/image-zoom';
import { ProjectFloatingChat } from '@/components/project-floating-chat';
import { ProjectSettings } from '@/components/project-settings';
import { ProjectSelector } from '@/components/project-selector';
import type { projects as projectsTable } from '@/schema';
import {
  VideoPlayer,
  VideoPlayerContent,
  VideoPlayerControlBar,
  VideoPlayerPlayButton,
  VideoPlayerSeekBackwardButton,
  VideoPlayerSeekForwardButton,
  VideoPlayerTimeRange,
  VideoPlayerTimeDisplay,
  VideoPlayerMuteButton,
  VideoPlayerVolumeRange,
} from './ui/kibo-ui/video-player';


type ToolbarProps = {
  projectId?: string;
  currentProject?: typeof projectsTable.$inferSelect;
  projects?: (typeof projectsTable.$inferSelect)[];
};

export const ToolbarInner = ({ projectId, currentProject, projects }: ToolbarProps) => {
  const { getViewport } = useReactFlow();
  const { addNode } = useNodeOperations();
  const [galleryOpenTab, setGalleryOpenTab] = useState<'images' | 'videos' | 'audios' | 'files' | null>(null);

  const handleAddNode = (type: string, options?: Record<string, unknown>) => {
    // Get the current viewport
    const viewport = getViewport();

    // Calculate the center of the current viewport
    const centerX =
      -viewport.x / viewport.zoom + window.innerWidth / 2 / viewport.zoom;
    const centerY =
      -viewport.y / viewport.zoom + window.innerHeight / 2 / viewport.zoom;

    const position = { x: centerX, y: centerY };
    const { data: nodeData, ...rest } = options ?? {};

    addNode(type, {
      position,
      data: {
        ...(nodeData ? nodeData : {}),
      },
      ...rest,
    });
  };

  return (
    <Panel
      position="top-center"
      className="m-4 flex items-center gap-2 rounded-full border bg-card/90 p-1 drop-shadow-xs backdrop-blur-sm"
    >
      <div className="flex shrink-0 items-center gap-1">
        <GalleryButton
          openWithTab={galleryOpenTab}
          onIntentConsumed={() => setGalleryOpenTab(null)}
          onSelect={(file) => {
            const mime = file.type || '';
            const nodeType = mime.startsWith('image/')
              ? 'image'
              : mime.startsWith('audio/')
                ? 'audio'
                : mime.startsWith('video/')
                  ? 'video'
                  : 'file';
            const data =
              nodeType === 'file'
                ? { content: { url: file.url, type: file.type, name: file.name }, updatedAt: new Date().toISOString() }
                : { content: { url: file.url, type: file.type }, updatedAt: new Date().toISOString() };
            handleAddNode(nodeType, { data });
          }}
        />
        {projectId && <ProjectFloatingChat projectId={projectId} />}
        {currentProject && <ProjectSettings data={currentProject} />}
      </div>
      {projects && currentProject && (
        <div className="flex items-center rounded-full bg-card/90 p-1">
          <ProjectSelector projects={projects} currentProject={currentProject.id} />
        </div>
      )}
    </Panel>
  );
};

export const Toolbar = memo(ToolbarInner);

const GalleryButton = ({
  onSelect,
  openWithTab,
  onIntentConsumed,
}: {
  onSelect: (file: UserFile) => void;
  openWithTab?: 'images' | 'videos' | 'audios' | 'files' | null;
  onIntentConsumed?: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<UserFile[] | null>(null);
  const [mounted, setMounted] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Image zoom handled via ImageZoom component
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'audios' | 'files'>('images');

  useEffect(() => setMounted(true), []);

  const openGallery = useCallback(async (tab?: typeof activeTab) => {
    setOpen(true);
    if (tab) setActiveTab(tab);
    // Всегда рефетчим при открытии, чтобы видеть новые файлы сразу
    setLoading(true);
    try {
      const res = await listUserFiles();
      if ('files' in res) setFiles(res.files);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (openWithTab) {
      openGallery(openWithTab);
      onIntentConsumed?.();
    }
  }, [openWithTab, openGallery, onIntentConsumed]);

  // Авто-обновление, если галерея открыта и пришло событие изменения файлов
  useEffect(() => {
    const handler = () => {
      if (!open) return;
      (async () => {
        setLoading(true);
        try {
          const res = await listUserFiles();
          if ('files' in res) setFiles(res.files);
        } finally {
          setLoading(false);
        }
      })();
    };
    window.addEventListener('user-files:changed', handler as EventListener);
    return () => window.removeEventListener('user-files:changed', handler as EventListener);
  }, [open]);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => openGallery()}
          >
            <TbFolders size={14} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Галерея</TooltipContent>
      </Tooltip>

      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
              role="dialog"
              aria-modal="true"
              onClick={() => setOpen(false)}
            >
              <div
                className="relative m-0 h-[100vh] w-[100vw] rounded-none bg-background p-4 sm:m-4 sm:h-[calc(100vh-2rem)] sm:w-[calc(100vw-2rem)] sm:rounded-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold">Мои файлы</h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-8 items-center justify-center rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                      onClick={() => setUploadOpen(true)}
                    >
                      Загрузить
                    </button>
                    <button
                      type="button"
                      aria-label="Close gallery"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary hover:bg-secondary/80"
                      onClick={() => setOpen(false)}
                    >
                      <XIcon size={16} />
                    </button>
                  </div>
                </div>
                {uploadOpen && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-lg border bg-background p-4 shadow-lg">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-medium">Загрузка файлов</h4>
                        <button
                          type="button"
                          aria-label="Close upload"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary hover:bg-secondary/80"
                          onClick={() => setUploadOpen(false)}
                        >
                          <XIcon size={16} />
                        </button>
                      </div>
                      <Dropzone
                        multiple
                        maxFiles={100}
                        maxSize={1024 * 1024 * 10}
                        minSize={1024}
                        disabled={uploading}
                        accept={{
                          'image/*': [],
                          'video/*': [],
                          'audio/*': [],
                          'application/pdf': [],
                          'text/plain': [],
                        }}
                        onDrop={async (accepted) => {
                          if (!accepted?.length) return;
                          setUploading(true);
                          try {
                            for (const file of accepted) {
                              await uploadFile(file, 'files');
                            }
                            const res = await listUserFiles();
                            if ('files' in res) setFiles(res.files);
                            setUploadOpen(false);
                          } finally {
                            setUploading(false);
                          }
                        }}
                        className="w-full"
                      >
                        <DropzoneEmptyState />
                        <DropzoneContent />
                        <p className="mt-2 max-w-full truncate text-center text-xs text-muted-foreground">
                          {uploading ? 'Загружаем…' : 'Поддерживаются изображения, видео, аудио и PDF. До 10MB на файл.'}
                        </p>
                      </Dropzone>
                    </div>
                  </div>
                )}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="h-[calc(100%-3rem)] flex flex-col">
                  <TabsList>
                    <TabsTrigger value="images">Изображения</TabsTrigger>
                    <TabsTrigger value="videos">Видео</TabsTrigger>
                    <TabsTrigger value="audios">Аудио</TabsTrigger>
                    <TabsTrigger value="files">Файлы</TabsTrigger>
                  </TabsList>
                  {(['images','videos','audios','files'] as const).map((tab) => (
                    <TabsContent key={tab} value={tab} className="flex-1 overflow-auto">
                      {(() => {
                        const filtered = (files ?? []).filter((file) => {
                          if (tab === 'images') return file.type.startsWith('image/');
                          if (tab === 'videos') return file.type.startsWith('video/');
                          if (tab === 'audios') return file.type.startsWith('audio/');
                          return !file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/');
                        });

                        if (!loading && filtered.length === 0) {
                          const accept =
                            tab === 'images'
                              ? ({ 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] } as Record<string, string[]>)
                              : tab === 'videos'
                              ? ({ 'video/*': ['.mp4', '.webm', '.mov'] } as Record<string, string[]>)
                              : tab === 'audios'
                              ? ({ 'audio/*': ['.mp3', '.wav', '.m4a'] } as Record<string, string[]>)
                              : undefined;
                          return (
                            <div className="flex h-full min-h-[320px] items-center justify-center p-4">
                              <Dropzone
                                multiple
                                maxFiles={100}
                                maxSize={1024 * 1024 * 10}
                                minSize={1024}
                                disabled={uploading}
                                accept={accept}
                                onDrop={async (accepted) => {
                                  if (!accepted?.length) return;
                                  setUploading(true);
                                  try {
                                    for (const file of accepted) {
                                      await uploadFile(file, 'files');
                                    }
                                    const res = await listUserFiles();
                                    if ('files' in res) setFiles(res.files);
                                  } finally {
                                    setUploading(false);
                                  }
                                }}
                                className="w-full max-w-lg"
                              >
                                <DropzoneEmptyState />
                                <DropzoneContent />
                                <p className="mt-2 max-w-full truncate text-center text-xs text-muted-foreground">
                                  {uploading
                                    ? 'Загружаем…'
                                    : tab === 'images'
                                    ? 'Загрузите изображения'
                                    : tab === 'videos'
                                    ? 'Загрузите видео'
                                    : tab === 'audios'
                                    ? 'Загрузите аудио'
                                    : 'Загрузите файлы'}
                                </p>
                              </Dropzone>
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] grid-flow-dense items-start gap-3 p-2">
                            {loading && (
                              <div className="col-span-full text-sm text-muted-foreground">Загрузка...</div>
                            )}
                            {filtered.map((file) => {
                              const isImage = file.type.startsWith('image/');
                              const isVideo = file.type.startsWith('video/');
                              const isAudio = file.type.startsWith('audio/');

                              return (
                                <div
                                  key={`${tab}-${file.url}`}
                                  className={`group relative overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md ${(isVideo || isAudio) ? 'col-span-2' : ''}`}
                                >
                                  <div
                                    className={`relative ${isVideo ? 'aspect-[3/2]' : isAudio ? 'aspect-[3/1]' : 'aspect-square'} bg-secondary`}
                                    onClick={() => {
                                      if (isVideo) setVideoPreviewUrl(file.url);
                                    }}
                                  >
                                    {isImage && (
                                      <ImageZoom className="absolute inset-0">
                                        <Image
                                          src={file.url}
                                          alt={file.name}
                                          fill
                                          unoptimized
                                          className="object-cover"
                                          sizes={isVideo ? '280px' : '140px'}
                                          quality={60}
                                          loading="lazy"
                                        />
                                      </ImageZoom>
                                    )}
                                    {isVideo && (
                                      <video
                                        src={file.url}
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        className="absolute inset-0 h-full w-full object-cover"
                                      />
                                    )}
                                    {isAudio && (
                                      <div className="absolute inset-0 flex items-center justify-center p-2">
                                        <audio
                                          src={file.url}
                                          controls
                                          autoPlay
                                          muted
                                          loop
                                          className="w-full"
                                        />
                                      </div>
                                    )}
                                    {!isImage && !isVideo && !isAudio && (
                                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                        <FileIcon className="size-8" />
                                      </div>
                                    )}

                                    {/* overlay actions to ensure visibility */}
                                    <div className="pointer-events-none absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
                                      <button
                                        type="button"
                                        title="Скачать"
                                        className="pointer-events-auto inline-flex items-center justify-center rounded-md bg-background/80 p-1.5 text-[11px] shadow hover:bg-background"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          download({ url: file.url, type: file.type }, file.name, 'bin');
                                        }}
                                      >
                                        <DownloadIcon className="size-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        title="Выбрать"
                                        className="pointer-events-auto inline-flex items-center justify-center rounded-md bg-background/80 p-1.5 text-[11px] shadow hover:bg-background"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onSelect(file);
                                          setOpen(false);
                                        }}
                                      >
                                        <CheckIcon className="size-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        title="Удалить"
                                        className="pointer-events-auto inline-flex items-center justify-center rounded-md bg-background/80 p-1.5 text-[11px] text-destructive ring-1 ring-destructive/30 shadow hover:bg-background"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          const ok = confirm(`Удалить файл “${file.name}”?`)
                                          if (!ok) return
                                          const res = await deleteUserFile(file.name)
                                          if ('error' in res) return
                                          setFiles((prev) => prev ? prev.filter((f) => f.name !== file.name) : prev)
                                        }}
                                      >
                                        <Trash2Icon className="size-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </div>,
            document.body
          )
        : null}

      {/* Image zoom is handled inline via ImageZoom component */}

      {/* Fullscreen video preview */}
      {mounted && videoPreviewUrl
        ? createPortal(
            <div
              className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90"
              role="dialog"
              aria-modal="true"
              onClick={() => setVideoPreviewUrl(null)}
            >
              <button
                type="button"
                aria-label="Close video preview"
                className="absolute right-4 top-4 z-[112] inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={() => setVideoPreviewUrl(null)}
              >
                <XIcon size={18} />
              </button>
              <div className="relative z-[111] h-full w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
                <VideoPlayer style={{ width: '100%', height: 'auto' }}>
                  <VideoPlayerContent src={videoPreviewUrl} playsInline controls autoPlay muted />
                  <VideoPlayerControlBar>
                    <VideoPlayerPlayButton />
                    <VideoPlayerSeekBackwardButton />
                    <VideoPlayerSeekForwardButton />
                    <VideoPlayerTimeRange />
                    <VideoPlayerTimeDisplay />
                    <VideoPlayerMuteButton />
                    <VideoPlayerVolumeRange />
                  </VideoPlayerControlBar>
                </VideoPlayer>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
};