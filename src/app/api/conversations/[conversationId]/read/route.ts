import { NextResponse } from 'next/server';
import { currentUserOrThrow } from '@/lib/current-user';
import { db } from '@/lib/db';

export async function PATCH(_req: Request, { params }: { params: { conversationId: string } }) {
  try {
    const user = await currentUserOrThrow();
    await db.conversationMember.updateMany({
      where: { conversationId: params.conversationId, userId: user.id },
      data: { lastReadAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
