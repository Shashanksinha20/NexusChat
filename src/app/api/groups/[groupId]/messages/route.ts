import { NextResponse } from 'next/server';
import { currentUserOrThrow } from '@/lib/current-user';
import { db } from '@/lib/db';

export async function GET(req: Request, { params }: { params: { groupId: string } }) {
  try {
    const user = await currentUserOrThrow();
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const take = 50;

    const member = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.groupId, userId: user.id } },
    });
    if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const messages = await db.message.findMany({
      where: { groupId: params.groupId },
      include: {
        sender: { select: { id: true, displayName: true, username: true, imageUrl: true } },
        reactions: { include: { user: { select: { id: true, displayName: true, imageUrl: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = messages.length > take;
    if (hasMore) messages.pop();

    return NextResponse.json({ messages: messages.reverse(), hasMore, nextCursor: hasMore ? messages[0]?.id : null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
