import { generateImageAction } from '@/app/actions/image/create';
import { editImageAction } from '@/app/actions/image/edit';
import { NodeLayout } from '@/components/nodes/layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAnalytics } from '@/hooks/use-analytics';
import { download } from '@/lib/download';
import { handleError } from '@/lib/error/handle';
import { imageModels } from '@/lib/models/image';
import { getImagesFromImageNodes, getTextFromTextNodes } from '@/lib/xyflow';
import { useProject } from '@/providers/project';
import { getIncomers, useReactFlow } from '@xyflow/react';
import {
  ClockIcon,
  DownloadIcon,
  Loader2Icon,
  PlayIcon,
  RotateCcwIcon,
  XIcon,
} from 'lucide-react';
import Image from 'next/image';
import {
  type ChangeEventHandler,
  type ComponentProps,
  useCallback,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { mutate } from 'swr';
import type { ImageNodeProps } from '.';
import { ModelSelector } from '../model-selector';
import { ImageSizeSelector } from './image-size-selector';
import { listUserFiles, type UserFile } from '@/app/actions/image/list-files';

type ImageTransformProps = ImageNodeProps & {
  title: string;
};

const getDefaultModel = (models: typeof imageModels) => {
  const defaultModel = Object.entries(models).find(
    ([_, model]) => model.default
  );

  if (!defaultModel) {
    throw new Error('No default model found');
  }

  return defaultModel[0];
};

export const ImageTransform = ({
  data,
  id,
  type,
  title,
}: ImageTransformProps) => {
  const { updateNodeData, getNodes, getEdges } = useReactFlow();
  const [loading, setLoading] = useState(false);
  const project = useProject();
  const hasIncomingImageNodes =
    getImagesFromImageNodes(getIncomers({ id }, getNodes(), getEdges()))
      .length > 0;
  const modelId = data.model ?? getDefaultModel(imageModels);
  const analytics = useAnalytics();
  const selectedModel = imageModels[modelId];
  const size = data.size ?? selectedModel?.sizes?.at(0);

  const handleGenerate = useCallback(async () => {
    if (loading || !project?.id) {
      return;
    }

    const incomers = getIncomers({ id }, getNodes(), getEdges());
    const textNodes = getTextFromTextNodes(incomers);
    const imageNodes = getImagesFromImageNodes(incomers);

    try {
      if (!textNodes.length && !imageNodes.length) {
        throw new Error('No input provided');
      }

      setLoading(true);

      analytics.track('canvas', 'node', 'generate', {
        type,
        textPromptsLength: textNodes.length,
        imagePromptsLength: imageNodes.length,
        model: modelId,
        instructionsLength: data.instructions?.length ?? 0,
      });

      // Combine Instructions + Prompt (text nodes) for I2I
      const combinedInstructions = [
        data.instructions?.trim(),
        textNodes.length ? ['--- Context ---', ...textNodes].join('\n') : undefined,
      ]
        .filter(Boolean)
        .join('\n');

      const response = imageNodes.length
        ? await editImageAction({
            images: imageNodes,
            instructions: combinedInstructions,
            nodeId: id,
            projectId: project.id,
            modelId,
            size,
          })
        : await generateImageAction({
            prompt: textNodes.join('\n'),
            modelId,
            instructions: data.instructions,
            projectId: project.id,
            nodeId: id,
            size,
          });

      if ('error' in response) {
        throw new Error(response.error);
      }

      updateNodeData(id, response.nodeData);

      toast.success('Image generated successfully');

      setTimeout(() => mutate('credits'), 5000);
    } catch (error) {
      handleError('Error generating image', error);
    } finally {
      setLoading(false);
    }
  }, [
    loading,
    project?.id,
    size,
    id,
    analytics,
    type,
    data.instructions,
    getEdges,
    modelId,
    getNodes,
    updateNodeData,
  ]);

  const handleInstructionsChange: ChangeEventHandler<HTMLTextAreaElement> = (
    event
  ) => updateNodeData(id, { instructions: event.target.value });

  const toolbar = useMemo<ComponentProps<typeof NodeLayout>['toolbar']>(() => {
    const availableModels = Object.fromEntries(
      Object.entries(imageModels).map(([key, model]) => [
        key,
        {
          ...model,
          disabled: hasIncomingImageNodes
            ? !model.supportsEdit
            : model.disabled,
        },
      ])
    );

    const items: ComponentProps<typeof NodeLayout>['toolbar'] = [
      {
        children: (
          <ModelSelector
            value={modelId}
            options={availableModels}
            id={id}
            className="w-[200px] rounded-full"
            onChange={(value) => updateNodeData(id, { model: value })}
          />
        ),
      },
    ];

    if (selectedModel?.sizes?.length) {
      items.push({
        children: (
          <ImageSizeSelector
            value={size ?? ''}
            options={selectedModel?.sizes ?? []}
            id={id}
            className="w-[200px] rounded-full"
            onChange={(value) => updateNodeData(id, { size: value })}
          />
        ),
      });
    }

    items.push(
      loading
        ? {
            tooltip: 'Generating...',
            children: (
              <Button size="icon" className="rounded-full" disabled>
                <Loader2Icon className="animate-spin" size={12} />
              </Button>
            ),
          }
        : {
            tooltip: data.generated?.url ? 'Regenerate' : 'Generate',
            children: (
              <Button
                size="icon"
                className="rounded-full"
                onClick={handleGenerate}
                disabled={loading || !project?.id}
              >
                {data.generated?.url ? (
                  <RotateCcwIcon size={12} />
                ) : (
                  <PlayIcon size={12} />
                )}
              </Button>
            ),
          }
    );

    // (removed) Gallery button — теперь в нижнем глобальном тулбаре

    if (data.generated) {
      items.push({
        tooltip: 'Download',
        children: (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => download(data.generated, id, 'png')}
          >
            <DownloadIcon size={12} />
          </Button>
        ),
      });
    }

    if (data.updatedAt) {
      items.push({
        tooltip: `Last updated: ${new Intl.DateTimeFormat('en-US', {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(new Date(data.updatedAt))}`,
        children: (
          <Button size="icon" variant="ghost" className="rounded-full">
            <ClockIcon size={12} />
          </Button>
        ),
      });
    }

    return items;
  }, [
    modelId,
    hasIncomingImageNodes,
    id,
    updateNodeData,
    selectedModel?.sizes,
    size,
    loading,
    data.generated,
    data.updatedAt,
    handleGenerate,
    project?.id,
  ]);

  const aspectRatio = useMemo(() => {
    if (!data.size) {
      return '1/1';
    }

    const [width, height] = data.size.split('x').map(Number);
    return `${width}/${height}`;
  }, [data.size]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [gallery, setGallery] = useState<UserFile[] | null>(null);
  const [galleryLoading, setGalleryLoading] = useState(false);

  const openGallery = useCallback(async () => {
    if (galleryLoading) return;
    setIsGalleryOpen(true);
    if (gallery) return;
    setGalleryLoading(true);
    try {
      const result = await listUserFiles();
      if ('files' in result) setGallery(result.files);
    } finally {
      setGalleryLoading(false);
    }
  }, [gallery, galleryLoading]);

  return (
    <NodeLayout id={id} data={data} type={type} title={title} toolbar={toolbar}>
      {loading && (
        <Skeleton
          className="flex w-full animate-pulse items-center justify-center rounded-b-xl"
          style={{ aspectRatio }}
        >
          <Loader2Icon
            size={16}
            className="size-4 animate-spin text-muted-foreground"
          />
        </Skeleton>
      )}
      {!loading && !data.generated?.url && (
        <div
          className="flex w-full items-center justify-center rounded-b-xl bg-secondary p-4"
          style={{ aspectRatio }}
        >
          <p className="text-muted-foreground text-sm">
            Press <PlayIcon size={12} className="-translate-y-px inline" /> to
            create an image
          </p>
        </div>
      )}
      {!loading && data.generated?.url && (
        <Image
          src={data.generated.url}
          alt="Generated image"
          width={1000}
          height={1000}
          className="w-full rounded-b-xl object-cover cursor-zoom-in"
          onClick={() => setIsPreviewOpen(true)}
        />
      )}
      <Textarea
        value={data.instructions ?? ''}
        onChange={handleInstructionsChange}
        placeholder="Enter instructions"
        className="shrink-0 resize-none rounded-none border-none bg-transparent! shadow-none focus-visible:ring-0"
      />
      {mounted && isPreviewOpen && data.generated?.url
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
              role="dialog"
              aria-modal="true"
              onClick={() => setIsPreviewOpen(false)}
            >
              <button
                type="button"
                aria-label="Close image preview"
                className="absolute right-4 top-4 z-[102] inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={() => setIsPreviewOpen(false)}
              >
                <XIcon size={18} />
              </button>
              <div className="relative z-[101] h-full w-full" onClick={(e) => e.stopPropagation()}>
                <Image
                  src={data.generated.url}
                  alt="Image preview"
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>
            </div>,
            document.body
          )
        : null}

      {isGalleryOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setIsGalleryOpen(false)}
          role="dialog"
          aria-modal="true"
          onLoad={() => {
            // lazy load content
            void openGallery();
          }}
        >
          <div
            className="relative m-4 w-[min(1200px,100vw-2rem)] max-h-[90vh] rounded-xl bg-background p-4 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold">My files</h3>
              <button
                type="button"
                aria-label="Close gallery"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary hover:bg-secondary/80"
                onClick={() => setIsGalleryOpen(false)}
              >
                <XIcon size={16} />
              </button>
            </div>
            <div className="grid max-h-[75vh] grid-cols-2 gap-3 overflow-auto md:grid-cols-3 lg:grid-cols-4">
              {galleryLoading && <div className="col-span-full text-sm text-muted-foreground">Loading...</div>}
              {gallery && gallery.length === 0 && (
                <div className="col-span-full text-sm text-muted-foreground">No files yet</div>
              )}
              {gallery?.map((file) => (
                <div key={file.url} className="group relative overflow-hidden rounded-lg border">
                  <div className="relative aspect-square bg-secondary">
                    <Image src={file.url} alt={file.name} fill className="object-cover" sizes="25vw" />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2">
                    <div className="min-w-0 flex-1 truncate text-xs">{file.name}</div>
                    <div className="flex items-center gap-1">
                      <a
                        href={file.url}
                        download
                        className="inline-flex items-center rounded-md border px-2 py-1 text-xs hover:bg-secondary"
                      >
                        Download
                      </a>
                      <button
                        type="button"
                        className="inline-flex items-center rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground hover:opacity-90"
                        onClick={() => {
                          // вставляем файл в текущий проект (центр экрана)
                          const center = project?.viewport?.x !== undefined
                            ? { x: project.viewport.x + (project.viewport.width ?? 0) / 2, y: project.viewport.y + (project.viewport.height ?? 0) / 2 }
                            : { x: 0, y: 0 };
                          updateNodeData(id, {
                            generated: { url: file.url, type: file.type },
                            updatedAt: new Date().toISOString(),
                          });
                          setIsGalleryOpen(false);
                        }}
                      >
                        Select
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </NodeLayout>
  );
};
