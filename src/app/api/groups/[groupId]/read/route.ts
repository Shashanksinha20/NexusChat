import { NextResponse } from 'next/server';
import { currentUserOrThrow } from '@/lib/current-user';
import { db } from '@/lib/db';

export async function PATCH(_req: Request, { params }: { params: { groupId: string } }) {
  try {
    const user = await currentUserOrThrow();
    await db.groupMember.updateMany({
      where: { groupId: params.groupId, userId: user.id },
      data: { lastReadAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
