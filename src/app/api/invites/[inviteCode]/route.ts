import { NextResponse } from 'next/server';
import { currentUserOrThrow } from '@/lib/current-user';
import { db } from '@/lib/db';

export async function GET(_: Request, { params }: { params: { inviteCode: string } }) {
  try {
    const invite = await db.invite.findUnique({
      where: { code: params.inviteCode },
      include: {
        group: { include: { _count: { select: { members: true } } } },
        createdBy: { select: { displayName: true } },
      },
    });

    if (!invite) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    if (invite.usedAt) return NextResponse.json({ error: 'Invite already used' }, { status: 410 });
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 });
    }

    return NextResponse.json(invite);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(_: Request, { params }: { params: { inviteCode: string } }) {
  try {
    const user = await currentUserOrThrow();

    const invite = await db.invite.findUnique({
      where: { code: params.inviteCode },
    });

    if (!invite) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    if (invite.usedAt) return NextResponse.json({ error: 'Invite already used' }, { status: 410 });
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 });
    }

    // Check if already a member
    const existing = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId: invite.groupId, userId: user.id } },
    });
    if (existing) {
      return NextResponse.json({ groupId: invite.groupId, alreadyMember: true });
    }

    // Add member & mark invite used
    await db.$transaction([
      db.groupMember.create({ data: { groupId: invite.groupId, userId: user.id, role: 'MEMBER' } }),
      db.invite.update({ where: { id: invite.id }, data: { usedAt: new Date() } }),
    ]);

    return NextResponse.json({ groupId: invite.groupId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
