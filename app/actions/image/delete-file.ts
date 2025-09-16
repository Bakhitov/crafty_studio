'use server';

import { getSubscribedUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const deleteUserFile = async (name: string): Promise<{ ok: true } | { error: string }> => {
  try {
    const user = await getSubscribedUser();
    const client = await createClient();

    const { error } = await client.storage.from('files').remove([`${user.id}/${name}`]);
    if (error) throw new Error(error.message);

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { error: message };
  }
};


