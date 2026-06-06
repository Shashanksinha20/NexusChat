import { NextResponse } from 'next/server';
import { currentUserOrThrow } from '@/lib/current-user';
import { db } from '@/lib/db';

// Add member to group (admin/owner only, or joining via invite handled separately)
export async function POST(req: Request, { params }: { params: { groupId: string } }) {
  try {
    const user = await currentUserOrThrow();
    const { userId, role = 'MEMBER' } = await req.json();

    const actor = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.groupId, userId: user.id } },
    });
    if (!actor || !['OWNER', 'ADMIN'].includes(actor.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const member = await db.groupMember.create({
      data: { groupId: params.groupId, userId, role },
      include: { user: { select: { id: true, displayName: true, username: true, imageUrl: true } } },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Leave group (self)
export async function DELETE(_: Request, { params }: { params: { groupId: string } }) {
  try {
    const user = await currentUserOrThrow();

    const member = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.groupId, userId: user.id } },
    });
    if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 404 });
    if (member.role === 'OWNER') return NextResponse.json({ error: 'Owner cannot leave – transfer ownership first' }, { status: 400 });

    await db.groupMember.delete({
      where: { groupId_userId: { groupId: params.groupId, userId: user.id } },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
