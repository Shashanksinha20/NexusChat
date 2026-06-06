import { NextResponse } from 'next/server';
import { currentUserOrThrow } from '@/lib/current-user';
import { db } from '@/lib/db';

export async function POST(_: Request, { params }: { params: { groupId: string } }) {
  try {
    const user = await currentUserOrThrow();

    const member = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.groupId, userId: user.id } },
    });
    if (!member || !['OWNER', 'ADMIN', 'MODERATOR'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Expire in 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await db.invite.create({
      data: { groupId: params.groupId, createdById: user.id, expiresAt },
    });

    return NextResponse.json(invite, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(_: Request, { params }: { params: { groupId: string } }) {
  try {
    const user = await currentUserOrThrow();

    const member = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.groupId, userId: user.id } },
    });
    if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const invites = await db.invite.findMany({
      where: { groupId: params.groupId, usedAt: null, expiresAt: { gte: new Date() } },
      include: { createdBy: { select: { displayName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invites);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
