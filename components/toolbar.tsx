'use client';

import { nodeButtons } from '@/lib/node-buttons';
import { useNodeOperations } from '@/providers/node-operations';
import { Panel, useReactFlow } from '@xyflow/react';
import { memo, useCallback, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { XIcon, AudioWaveformIcon, VideoIcon, FileIcon } from 'lucide-react';
import Image from 'next/image';
import { listUserFiles, type UserFile } from '@/app/actions/image/list-files';
import { createPortal } from 'react-dom';
import { TbFolders } from "react-icons/tb";
import { download } from '@/lib/download';
import { Separator } from './ui/separator';


export const ToolbarInner = () => {
  const { getViewport } = useReactFlow();
  const { addNode } = useNodeOperations();

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
      position="bottom-center"
      className="m-4 flex items-center rounded-full border bg-card/90 p-1 drop-shadow-xs backdrop-blur-sm"
    >
      {nodeButtons.map((button) => (
        <Tooltip key={button.id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => handleAddNode(button.id, (button as unknown as { data?: Record<string, unknown> }).data)}
            >
              <button.icon size={12} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{button.label}</TooltipContent>
        </Tooltip>
      ))}
      <Separator orientation="vertical" className="mx-2 h-6 w-[2px] bg-foreground/20" />
      <GalleryButton
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
    </Panel>
  );
};

export const Toolbar = memo(ToolbarInner);

const GalleryButton = ({ onSelect }: { onSelect: (file: UserFile) => void }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<UserFile[] | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const openGallery = useCallback(async () => {
    setOpen(true);
    if (files || loading) return;
    setLoading(true);
    try {
      const res = await listUserFiles();
      if ('files' in res) setFiles(res.files);
    } finally {
      setLoading(false);
    }
  }, [files, loading]);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={openGallery}
          >
            <TbFolders size={14} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Gallery</TooltipContent>
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
                  <h3 className="text-lg font-semibold">My files</h3>
                  <button
                    type="button"
                    aria-label="Close gallery"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary hover:bg-secondary/80"
                    onClick={() => setOpen(false)}
                  >
                    <XIcon size={16} />
                  </button>
                </div>
                <div className="grid h-[calc(100%-3rem)] grid-cols-2 items-start gap-4 overflow-auto p-2 md:grid-cols-3 lg:grid-cols-4">
                  {loading && (
                    <div className="col-span-full text-sm text-muted-foreground">Loading...</div>
                  )}
                  {files && files.length === 0 && (
                    <div className="col-span-full text-sm text-muted-foreground">No files yet</div>
                  )}
                  {files?.map((file) => (
                    <div key={file.url} className="group relative overflow-hidden rounded-lg border bg-card">
                      <div className="relative aspect-square bg-secondary">
                        <Image src={file.url} alt={file.name} fill className="object-cover" sizes="25vw" />
                        {/* overlay actions to ensure visibility */}
                        <div className="pointer-events-none absolute right-2 top-2 z-10 flex gap-2 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            className="pointer-events-auto inline-flex items-center rounded-md bg-background/80 px-2 py-1 text-[11px] shadow hover:bg-background"
                            onClick={() => download({ url: file.url, type: file.type }, file.name, 'bin')}
                          >
                            Скачать
                          </button>
                          <button
                            type="button"
                            className="pointer-events-auto inline-flex items-center rounded-md bg-primary px-2 py-1 text-[11px] text-primary-foreground shadow hover:opacity-90"
                            onClick={() => {
                              onSelect(file);
                              setOpen(false);
                            }}
                          >
                            Выбрать
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t p-2">
                        <div className="min-w-0 flex-1 truncate text-xs" title={file.name}>{file.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
};
