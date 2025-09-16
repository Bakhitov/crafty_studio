import { getSubscribedUser } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getArkTaskStatus } from '@/lib/models/video/ark';

export const GET = async (
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await getSubscribedUser();

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const status = await getArkTaskStatus(id);
    return NextResponse.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
};


