import { generateImageAction } from '@/app/actions/image/create';
import { editImageAction } from '@/app/actions/image/edit';
import { NodeLayout } from '@/components/nodes/layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAnalytics } from '@/hooks/use-analytics';
// Галерея доступна через тулбар; в ноде оставляем только предпросмотр
import { handleError } from '@/lib/error/handle';
import { imageModels } from '@/lib/models/image';
import { getImagesFromImageNodes, getTextFromTextNodes } from '@/lib/xyflow';
import { useProject } from '@/providers/project';
import { getIncomers, useReactFlow } from '@xyflow/react';
import {
  Loader2Icon,
  PlayIcon,
  RotateCcwIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';
import Image from 'next/image';
import { ImageZoom } from '@/components/ui/kibo-ui/image-zoom';
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

      // Notify: Seedream 3.x (Ark) supports only one input image
      const providerName = (selectedModel.providers?.[0]?.model as { provider?: string })?.provider;
      const isSeedream3Ark =
        providerName === 'ark' &&
        (modelId.startsWith('seedream-3') || modelId.startsWith('seededit-3'));

      if (isSeedream3Ark && imageNodes.length > 1) {
        toast.error('Seedream 3 supports only one input image. Please use only one.');
        setLoading(false);
        return;
      }

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

  const totalVersions = Array.isArray(data.versions) ? data.versions.length : 0;
  const currentIndex = Math.min(
    Math.max(data.versionIndex ?? (totalVersions ? totalVersions - 1 : 0), 0),
    Math.max(totalVersions - 1, 0)
  );

  const topCenter = (
    totalVersions > 0 ? (
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full"
          onClick={() => {
            const newIndex = Math.max(0, currentIndex - 1);
            const next = data.versions?.[newIndex];
            if (next) updateNodeData(id, { versionIndex: newIndex, generated: next });
          }}
          disabled={currentIndex <= 0}
          aria-label="Previous version"
        >
          <ChevronLeftIcon size={14} />
        </Button>
        <span className="text-xs text-muted-foreground">
          {currentIndex + 1}/{totalVersions}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full"
          onClick={() => {
            const newIndex = Math.min(totalVersions - 1, currentIndex + 1);
            const next = data.versions?.[newIndex];
            if (next) updateNodeData(id, { versionIndex: newIndex, generated: next });
          }}
          disabled={currentIndex >= totalVersions - 1}
          aria-label="Next version"
        >
          <ChevronRightIcon size={14} />
        </Button>
      </div>
    ) : null
  );

  return (
    <NodeLayout id={id} data={data} type={type} title={title} toolbar={toolbar} topCenter={topCenter}>
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
        <ImageZoom>
          <Image
            src={data.generated.url}
            alt="Generated image"
            width={1000}
            height={1000}
            className="w-full rounded-b-xl object-cover"
            sizes="(min-width:1024px) 800px, 100vw"
            quality={70}
            loading="lazy"
          />
        </ImageZoom>
      )}

      <Textarea
        value={data.instructions ?? ''}
        onChange={handleInstructionsChange}
        placeholder="Enter instructions"
        className="shrink-0 resize-none rounded-none border-none bg-transparent! shadow-none focus-visible:ring-0"
      />
      {/* Удалили кастомный полноэкранный просмотр — теперь работает ImageZoom */}
    </NodeLayout>
  );
}
