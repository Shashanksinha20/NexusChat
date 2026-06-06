import { NextResponse } from 'next/server';
import { currentUserOrThrow } from '@/lib/current-user';
import { db } from '@/lib/db';
import { canManageMessages } from '@/types';
import type { GroupRole } from '@/types';

export async function PATCH(req: Request, { params }: { params: { messageId: string } }) {
  try {
    const user = await currentUserOrThrow();
    const { content } = await req.json();

    const message = await db.message.findUnique({ where: { id: params.messageId } });
    if (!message) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (message.senderId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (message.deleted) return NextResponse.json({ error: 'Cannot edit deleted message' }, { status: 400 });
    if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 });

    const updated = await db.message.update({
      where: { id: params.messageId },
      data: { content: content.trim(), edited: true },
      include: {
        sender: { select: { id: true, displayName: true, username: true, imageUrl: true } },
        reactions: { include: { user: { select: { id: true, displayName: true, imageUrl: true } } } },
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { messageId: string } }) {
  try {
    const user = await currentUserOrThrow();
    const message = await db.message.findUnique({ where: { id: params.messageId } });
    if (!message) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let canDelete = message.senderId === user.id;

    if (!canDelete && message.groupId) {
      const member = await db.groupMember.findUnique({
        where: { groupId_userId: { groupId: message.groupId, userId: user.id } },
      });
      canDelete = member ? canManageMessages(member.role as GroupRole) : false;
    }

    if (!canDelete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await db.message.update({
      where: { id: params.messageId },
      data: { deleted: true, content: 'This message was deleted.' },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
