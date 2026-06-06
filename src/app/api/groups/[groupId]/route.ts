import { NextResponse } from 'next/server';
import { currentUserOrThrow } from '@/lib/current-user';
import { db } from '@/lib/db';

export async function GET(_: Request, { params }: { params: { groupId: string } }) {
  try {
    const user = await currentUserOrThrow();

    const member = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.groupId, userId: user.id } },
    });
    if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const group = await db.group.findUnique({
      where: { id: params.groupId },
      include: {
        members: { include: { user: { select: { id: true, displayName: true, username: true, imageUrl: true } } } },
        _count: { select: { members: true } },
      },
    });

    return NextResponse.json(group);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { groupId: string } }) {
  try {
    const user = await currentUserOrThrow();
    const { name, description } = await req.json();

    const member = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.groupId, userId: user.id } },
    });
    if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const group = await db.group.update({
      where: { id: params.groupId },
      data: { name: name?.trim(), description: description?.trim() ?? null },
    });

    return NextResponse.json(group);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { groupId: string } }) {
  try {
    const user = await currentUserOrThrow();

    const member = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.groupId, userId: user.id } },
    });
    if (!member || member.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden – only owner can delete' }, { status: 403 });
    }

    await db.group.delete({ where: { id: params.groupId } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
