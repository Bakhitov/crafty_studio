'use server';

import { getSubscribedUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export type UserFile = {
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt?: string;
};

export const listUserFiles = async (): Promise<
  | { files: UserFile[] }
  | { error: string }
> => {
  try {
    const user = await getSubscribedUser();
    const client = await createClient();

    const { data, error } = await client.storage
      .from('files')
      .list(user.id, { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });

    if (error) {
      throw new Error(error.message);
    }

    const files = (data ?? [])
      .map((f) => {
        const { data: pub } = client.storage
          .from('files')
          .getPublicUrl(`${user.id}/${f.name}`);
        const mime = (f.metadata?.mimetype as string | undefined) ??
          (f.name.toLowerCase().endsWith('.jpg') || f.name.toLowerCase().endsWith('.jpeg')
            ? 'image/jpeg'
            : f.name.toLowerCase().endsWith('.png')
              ? 'image/png'
              : f.name.toLowerCase().endsWith('.gif')
                ? 'image/gif'
                : f.name.toLowerCase().endsWith('.mp4')
                  ? 'video/mp4'
                  : f.name.toLowerCase().endsWith('.mp3')
                    ? 'audio/mpeg'
                    : 'application/octet-stream');
        return {
          name: f.name,
          url: pub.publicUrl,
          type: mime,
          size: f.metadata?.size ?? 0,
          createdAt: f.created_at ?? undefined,
        } satisfies UserFile;
      })
      .filter((f) =>
        f.type.startsWith('image/') ||
        f.type.startsWith('audio/') ||
        f.type.startsWith('video/') ||
        true
      );

    return { files };
  } catch (error) {
    return { error: (error as Error).message };
  }
};


