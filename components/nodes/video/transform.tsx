import { generateVideoAction } from '@/app/actions/video/create';
import { NodeLayout } from '@/components/nodes/layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAnalytics } from '@/hooks/use-analytics';
import { download } from '@/lib/download';
import { handleError } from '@/lib/error/handle';
import { videoModels } from '@/lib/models/video';
import { getImagesFromImageNodes, getTextFromTextNodes } from '@/lib/xyflow';
import { useProject } from '@/providers/project';
import { getIncomers, useReactFlow } from '@xyflow/react';
import {
  ClockIcon,
  DownloadIcon,
  Loader2Icon,
  PlayIcon,
  RotateCcwIcon,
} from 'lucide-react';
import { type ChangeEventHandler, type ComponentProps, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { mutate } from 'swr';
import type { VideoNodeProps } from '.';
import { ModelSelector } from '../model-selector';
import { finalizeVideoTask } from '@/app/actions/video/finalize';

type VideoTransformProps = VideoNodeProps & {
  title: string;
};

const getDefaultModel = (models: typeof videoModels) => {
  // Предпочитаем Seedance, если доступен
  const seedance = Object.keys(models).find((id) => id.startsWith('seedance-'));
  if (seedance) return seedance;

  const fallback = Object.entries(models).find(([_, model]) => model.default);
  if (!fallback) throw new Error('No default model found');
  return fallback[0];
};

export const VideoTransform = ({
  data,
  id,
  type,
  title,
}: VideoTransformProps) => {
  const { updateNodeData, getNodes, getEdges } = useReactFlow();
  const [loading, setLoading] = useState(false);
  const project = useProject();
  const modelId = data.model ?? getDefaultModel(videoModels);
  const analytics = useAnalytics();
  const [aimlVideoModels, setAimlVideoModels] = useState<
    { id: string; name: string; developer: string }[]
  >([]);
  const duration = data.duration ?? 5;
  const aspectRatio = data.aspectRatio ?? '16:9';

  const handleGenerate = async () => {
    if (loading || !project?.id) {
      return;
    }

    try {
      const incomers = getIncomers({ id }, getNodes(), getEdges());
      const textPrompts = getTextFromTextNodes(incomers);
      const images = getImagesFromImageNodes(incomers);

      if (!textPrompts.length && !images.length) {
        throw new Error('No prompts found');
      }

      setLoading(true);

      analytics.track('canvas', 'node', 'generate', {
        type,
        promptLength: textPrompts.join('\n').length,
        model: modelId,
        instructionsLength: data.instructions?.length ?? 0,
        imageCount: images.length,
      });

      const prompt = [data.instructions ?? '', ...textPrompts].join('\n');

      if (modelId.startsWith('seedance-')) {
        // Async flow for Seedance
        // Build images array with optional roles in the future; for now pass first image as first_frame
        const seedanceImages = images.length
          ? [{ url: images[0].url, role: 'first_frame' as const }]
          : undefined;
        const createRes = await fetch('/api/v1/video/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modelId, prompt, images: seedanceImages }),
        });

        const { taskId, error } = (await createRes.json()) as {
          taskId?: string;
          error?: string;
        };

        if (!createRes.ok || !taskId) {
          throw new Error(error ?? 'Failed to create video task');
        }

        // Poll client-side until done
        let arkUrl: string | undefined;
        let completionTokens: number | undefined;
        const start = Date.now();
        const timeoutMs = 10 * 60 * 1000; // 10 minutes
        while (Date.now() - start < timeoutMs) {
          await new Promise((r) => setTimeout(r, 4000));
          const statusRes = await fetch(`/api/v1/video/tasks/${taskId}`);
          const { status, videoUrl, completionTokens: ct, error: statusError } = (await statusRes.json()) as {
            status?: string;
            videoUrl?: string;
            completionTokens?: number;
            error?: string;
          };
          if (statusError) throw new Error(statusError);
          if (status === 'succeeded' && videoUrl) {
            arkUrl = videoUrl;
            completionTokens = ct;
            break;
          }
          if (status === 'failed' || status === 'canceled') {
            throw new Error(`Task ${status}`);
          }
        }

        if (!arkUrl) {
          throw new Error('Video task timed out');
        }

        const finalize = await finalizeVideoTask({
          arkUrl,
          nodeId: id,
          projectId: project.id,
          modelId,
          completionTokens,
        });

        if ('error' in finalize) {
          throw new Error(finalize.error);
        }

        updateNodeData(id, finalize.nodeData);
      } else {
        // Sync flow for other providers
        const response = await generateVideoAction({
          modelId,
          prompt,
          images: images.slice(0, 1),
          nodeId: id,
          projectId: project.id,
          duration,
          aspectRatio,
        });

        if ('error' in response) {
          throw new Error(response.error);
        }

        updateNodeData(id, response.nodeData);
      }

      toast.success('Video generated successfully');

      setTimeout(() => mutate('credits'), 5000);
      // Сообщаем галерее, что список файлов изменился
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('user-files:changed'));
      }
    } catch (error) {
      handleError('Error generating video', error);
    } finally {
      setLoading(false);
    }
  };

  const toolbar: ComponentProps<typeof NodeLayout>['toolbar'] = [
    {
      children: (
        <ModelSelector
          value={modelId}
          options={useMemo(() => {
            const baseEntries = Object.entries(videoModels).map(([key, model]) => {
              const isArk = model.chef.id === 'ark';
              const isAiml = model.chef.id === 'aiml';
              const disabled = !isArk && !isAiml;
              return [
                key,
                {
                  ...model,
                  disabled,
                  label: disabled ? `${model.label} (недоступно)` : model.label,
                },
              ] as const;
            });

            const dynamicAiml = aimlVideoModels.map((m) => {
              const key = `aiml:${m.developer}:${m.id}`;
              const base = videoModels['aiml-minimax-video-01'];
              return [
                key,
                {
                  ...(base ?? { label: m.name, chef: { id: 'aiml', name: 'AIML', icon: () => null }, providers: [] as any }),
                  label: m.name,
                },
              ] as const;
            });

            return Object.fromEntries([...baseEntries, ...dynamicAiml]);
          }, [aimlVideoModels])}
          className="w-[200px] rounded-full"
          onChange={(value) => updateNodeData(id, { model: value })}
        />
      ),
    },
    {
      children: (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-full px-3"
            onClick={() => updateNodeData(id, { duration: Math.max(2, Math.min(10, duration - 1)) })}
          >
            -
          </Button>
          <span className="text-xs text-muted-foreground">{duration}s</span>
          <Button
            variant="outline"
            className="rounded-full px-3"
            onClick={() => updateNodeData(id, { duration: Math.max(2, Math.min(10, duration + 1)) })}
          >
            +
          </Button>
        </div>
      ),
    },
    {
      children: (
        <div className="flex items-center gap-1">
          {['16:9', '9:16', '1:1'].map((ratio) => (
            <Button
              key={ratio}
              variant={aspectRatio === ratio ? 'default' : 'outline'}
              className="rounded-full px-3"
              onClick={() => updateNodeData(id, { aspectRatio: ratio })}
            >
              {ratio}
            </Button>
          ))}
        </div>
      ),
    },
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
        },
  ];

  if (data.generated?.url) {
    toolbar.push({
      tooltip: 'Download',
      children: (
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => download(data.generated, id, 'mp4')}
        >
          <DownloadIcon size={12} />
        </Button>
      ),
    });
  }

  // Убрали индикатор обновления из тулбара — теперь дата в правой части заголовка

  const handleInstructionsChange: ChangeEventHandler<HTMLTextAreaElement> = (
    event
  ) => updateNodeData(id, { instructions: event.target.value });

  // Fetch AIML video models
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch('/api/aiml/video-models', { cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as {
          data?: Array<{ id: string; type: string; info?: { developer?: string; name?: string } }>;
        };
        const list = (json.data ?? [])
          .filter((m) => m.type === 'video')
          .map((m) => ({
            id: m.id,
            name: m.info?.name ?? m.id,
            developer: m.info?.developer ?? 'aiml',
          }));
        if (!cancelled) setAimlVideoModels(list);
      } catch {}
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <NodeLayout id={id} data={data} type={type} title={title} toolbar={toolbar}>
      {loading && (
        <Skeleton className="flex aspect-video w-full animate-pulse items-center justify-center rounded-b-xl">
          <Loader2Icon
            size={16}
            className="size-4 animate-spin text-muted-foreground"
          />
        </Skeleton>
      )}
      {!loading && !data.generated?.url && (
        <div className="flex aspect-video w-full items-center justify-center rounded-b-xl bg-secondary">
          <p className="text-muted-foreground text-sm">
            Нажми на <PlayIcon size={12} className="-translate-y-px inline" /> чтобы
            создать видео
          </p>
        </div>
      )}
      {data.generated?.url && !loading && (
        <video
          src={data.generated.url}
          width={data.width ?? 800}
          height={data.height ?? 450}
          autoPlay
          muted
          loop
          playsInline
          className="w-full rounded-b-xl object-cover"
        />
      )}
      <Textarea
        value={data.instructions ?? ''}
        onChange={handleInstructionsChange}
        placeholder="Введите инструкции (необязательно)"
        className="shrink-0 resize-none rounded-none border-none bg-transparent! shadow-none focus-visible:ring-0"
      />
    </NodeLayout>
  );
};
