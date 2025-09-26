'use client';

import { deleteProjectAction } from '@/app/actions/project/delete';
import { updateProjectAction } from '@/app/actions/project/update';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { handleError } from '@/lib/error/handle';
import { transcriptionModels } from '@/lib/models/transcription';
import { visionModels } from '@/lib/models/vision';
import { useSubscription } from '@/providers/subscription';
import type { projects } from '@/schema';
import { SettingsIcon, TrashIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEventHandler, useState } from 'react';
import { toast } from 'sonner';
import { ModelSelector } from './nodes/model-selector';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useEffect } from 'react';

type ProjectSettingsProps = {
  data: typeof projects.$inferSelect;
};

export const ProjectSettings = ({ data }: ProjectSettingsProps) => {
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [name, setName] = useState(data.name);
  const [transcriptionModel, setTranscriptionModel] = useState(
    data.transcriptionModel
  );
  const [visionModel, setVisionModel] = useState(data.visionModel);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const router = useRouter();
  const { isSubscribed, plan } = useSubscription();

  const handleUpdateProject: FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    event.preventDefault();

    if (isUpdating) {
      return;
    }

    try {
      setIsUpdating(true);

      const response = await updateProjectAction(data.id, {
        name,
        transcriptionModel,
        visionModel,
      });

      if ('error' in response) {
        throw new Error(response.error);
      }

      toast.success('Project updated successfully');
      setOpen(false);
      router.refresh();
    } catch (error) {
      handleError('Error updating project', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      const response = await deleteProjectAction(data.id);

      if ('error' in response) {
        throw new Error(response.error);
      }

      toast.success('Project deleted successfully');
      setOpen(false);
      router.push('/');
    } catch (error) {
      handleError('Error deleting project', error);
    }
  };
  return (
    <>
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <SettingsIcon size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Настройки проекта</DialogTitle>
          <DialogDescription>Обновите данные вашего проекта.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleUpdateProject}
          className="mt-2 grid gap-4"
          aria-disabled={isUpdating}
        >
          <div className="grid gap-2">
            <Label htmlFor="name">Название</Label>
            <Input
              id="name"
              placeholder="Мой новый проект"
              value={name}
              onChange={({ target }) => setName(target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="transcriptionModel">Модель транскрипции</Label>
            <ModelSelector
              id="transcriptionModel"
              value={transcriptionModel}
              options={transcriptionModels}
              width={462}
              onChange={setTranscriptionModel}
              disabled={!isSubscribed || plan === 'hobby'}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="visionModel">Модель распознования изображений</Label>
            <ModelSelector
              id="visionModel"
              value={visionModel}
              options={visionModels}
              onChange={setVisionModel}
              width={462}
              disabled={!isSubscribed || plan === 'hobby'}
            />
          </div>
          <Button type="submit" disabled={isUpdating || !name.trim()}>
            Update
          </Button>
        </form>
        <DialogFooter className="-mx-6 mt-4 border-t px-6 pt-4 sm:justify-center">
          <Button
            variant="link"
            onClick={handleDeleteProject}
            className="flex items-center gap-2 text-destructive"
          >
            <TrashIcon size={16} />
            <span>Удалить</span>
          </Button>
          <Button
            variant="link"
            onClick={() => setTagManagerOpen(true)}
            className="ml-auto"
          >
            Управление тегами
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    {tagManagerOpen && (
      <TagsManager onClose={() => setTagManagerOpen(false)} />
    )}
    </>
  );
};

// Простая UI-форма для управления вложенными тегами
const TagsManager = ({ onClose }: { onClose: () => void }) => {
  const [stack, setStack] = useState<string[]>([]);
  const [items, setItems] = useState<Array<{ label: string; value: string; expandable?: boolean; hasChildren?: boolean; isLeaf?: boolean }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const parent = stack.join('/');

  const load = async (p: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/tags?lang=en&parent=${encodeURIComponent(p)}`);
      if (!res.ok) throw new Error(String(await res.text()));
      const json = await res.json() as { options: Array<{ label: string; value: string; expandable?: boolean; hasChildren?: boolean; isLeaf?: boolean }> };
      setItems(json.options || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(parent); }, [parent]);

  const create = async () => {
    const slug = newSlug.trim();
    const label = newLabel.trim();
    if (!slug) return;
    setCreating(true);
    try {
      const body = { parent, slug, labels: label ? { en: label } : undefined };
      const res = await fetch('/api/tags', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(String(await res.text()));
      setNewSlug(''); setNewLabel('');
      await load(parent);
    } catch (e: any) {
      alert(e?.message || 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const rename = async (keyEn: string) => {
    const next = prompt('Новое имя (последний сегмент или полный путь):', keyEn);
    if (!next) return;
    const currentParent = keyEn.split('/').slice(0, -1).join('/');
    const isFull = next.includes('/');
    const newKeyEn = isFull ? next : (currentParent ? `${currentParent}/${next}` : next);
    const cascade = confirm('Переименовать с потомками?');
    const res = await fetch('/api/tags', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ keyEn, set: { newKeyEn, cascade } }) });
    if (!res.ok) alert(await res.text()); else await load(parent);
  };

  const remove = async (keyEn: string) => {
    const cascade = confirm('Удалить вместе с потомками?');
    const ok = confirm(`Удалить тег ${keyEn}?`);
    if (!ok) return;
    const res = await fetch('/api/tags', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ keyEn, cascade }) });
    if (!res.ok) alert(await res.text()); else await load(parent);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-[min(92vw,820px)] max-h-[88vh] overflow-auto rounded-xl border bg-background p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="text-lg font-semibold">Теги</div>
          <button className="inline-flex h-8 items-center justify-center rounded-full bg-secondary px-3 text-xs" onClick={onClose}>Закрыть</button>
        </div>
        <div className="mb-2 text-sm text-muted-foreground">Путь: /{parent}</div>
        <div className="mb-3 flex items-center gap-2">
          {stack.length > 0 && (
            <button className="inline-flex h-8 items-center justify-center rounded-full bg-secondary px-3 text-xs" onClick={() => setStack((s) => s.slice(0, -1))}>Назад</button>
          )}
        </div>
        <div className="mb-4 grid grid-cols-1 gap-2">
          {loading ? (<div className="text-sm">Загрузка…</div>) : null}
          {error ? (<div className="text-sm text-destructive">{error}</div>) : null}
          {items.map((it) => {
            const lastSeg = it.value.split('/').slice(-1)[0];
            const canExpand = Boolean(it.expandable || it.hasChildren) && !it.isLeaf;
            return (
              <div key={it.value} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate font-medium">{lastSeg} <span className="ml-2 text-xs text-muted-foreground">{it.value}</span></div>
                  <div className="text-xs text-muted-foreground">{it.label}</div>
                </div>
                <div className="ml-3 shrink-0 flex items-center gap-2">
                  {canExpand && (
                    <button className="inline-flex h-7 items-center justify-center rounded-full bg-secondary px-3 text-xs" onClick={() => setStack((s) => s.concat(lastSeg))}>Внутрь</button>
                  )}
                  <button className="inline-flex h-7 items-center justify-center rounded-full bg-secondary px-3 text-xs" onClick={() => rename(it.value)}>Переименовать</button>
                  <button className="inline-flex h-7 items-center justify-center rounded-full bg-destructive px-3 text-xs text-destructive-foreground" onClick={() => remove(it.value)}>Удалить</button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-2 rounded-md border p-3">
          <div className="mb-2 text-sm font-medium">Создать подкатегорию</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Input placeholder="slug (a-z0-9-/_ )" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} />
            <Input placeholder="label (необязательно)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
            <Button disabled={creating || !newSlug.trim()} onClick={create}>Создать</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
