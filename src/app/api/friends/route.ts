import { NextResponse } from 'next/server';
import { currentUserOrThrow } from '@/lib/current-user';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await currentUserOrThrow();
    const friendships = await db.friendship.findMany({
      where: {
        OR: [{ requesterId: user.id }, { addresseeId: user.id }],
        status: 'ACCEPTED',
      },
      include: {
        requester: { select: { id: true, displayName: true, username: true, imageUrl: true } },
        addressee: { select: { id: true, displayName: true, username: true, imageUrl: true } },
      },
    });
    return NextResponse.json(friendships);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUserOrThrow();
    const { addresseeId } = await req.json();

    if (!addresseeId) return NextResponse.json({ error: 'addresseeId required' }, { status: 400 });
    if (addresseeId === user.id) return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 });

    // Check for existing friendship
    const existing = await db.friendship.findFirst({
      where: {
        OR: [
          { requesterId: user.id, addresseeId },
          { requesterId: addresseeId, addresseeId: user.id },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') return NextResponse.json({ error: 'Already friends' }, { status: 409 });
      if (existing.status === 'PENDING') return NextResponse.json({ error: 'Request already sent' }, { status: 409 });
      if (existing.status === 'BLOCKED') return NextResponse.json({ error: 'Cannot send request' }, { status: 403 });
    }

    const friendship = await db.friendship.create({
      data: { requesterId: user.id, addresseeId },
      include: {
        requester: { select: { id: true, displayName: true, username: true, imageUrl: true } },
        addressee: { select: { id: true, displayName: true, username: true, imageUrl: true } },
      },
    });

    return NextResponse.json(friendship, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
