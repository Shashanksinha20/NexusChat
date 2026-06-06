import { NextResponse } from 'next/server';
import { currentUserOrThrow } from '@/lib/current-user';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await currentUserOrThrow();
    const conversations = await db.conversation.findMany({
      where: { members: { some: { userId: user.id } } },
      include: {
        members: { include: { user: { select: { id: true, displayName: true, username: true, imageUrl: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: { select: { displayName: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(conversations);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUserOrThrow();
    const { memberId } = await req.json();

    if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 });

    // Check for existing DM conversation between these two users
    const existing = await db.conversation.findFirst({
      where: {
        AND: [
          { members: { some: { userId: user.id } } },
          { members: { some: { userId: memberId } } },
          // Ensure it's a 2-person conversation (DM)
          { members: { every: { userId: { in: [user.id, memberId] } } } },
        ],
      },
      include: {
        members: { include: { user: { select: { id: true, displayName: true, username: true, imageUrl: true } } } },
      },
    });

    if (existing) return NextResponse.json(existing);

    const conversation = await db.conversation.create({
      data: {
        members: {
          createMany: { data: [{ userId: user.id }, { userId: memberId }] },
        },
      },
      include: {
        members: { include: { user: { select: { id: true, displayName: true, username: true, imageUrl: true } } } },
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
