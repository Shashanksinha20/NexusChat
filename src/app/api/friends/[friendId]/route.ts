import { NextResponse } from 'next/server';
import { currentUserOrThrow } from '@/lib/current-user';
import { db } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: { friendId: string } }) {
  try {
    const user = await currentUserOrThrow();
    const { status } = await req.json();

    if (!['ACCEPTED', 'DECLINED', 'BLOCKED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const friendship = await db.friendship.findUnique({ where: { id: params.friendId } });
    if (!friendship) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (friendship.addresseeId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updated = await db.friendship.update({
      where: { id: params.friendId },
      data: { status },
      include: {
        requester: { select: { id: true, displayName: true, username: true, imageUrl: true } },
        addressee: { select: { id: true, displayName: true, username: true, imageUrl: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { friendId: string } }) {
  try {
    const user = await currentUserOrThrow();
    const friendship = await db.friendship.findUnique({ where: { id: params.friendId } });
    if (!friendship) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (friendship.requesterId !== user.id && friendship.addresseeId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await db.friendship.delete({ where: { id: params.friendId } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
