import { NextResponse } from 'next/server';
import { currentUserOrThrow } from '@/lib/current-user';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await currentUserOrThrow();
    const groups = await db.group.findMany({
      where: { members: { some: { userId: user.id } } },
      include: {
        members: { include: { user: { select: { id: true, displayName: true, username: true, imageUrl: true } } } },
        _count: { select: { members: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(groups);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUserOrThrow();
    const { name, description } = await req.json();

    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const group = await db.group.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        createdById: user.id,
        members: {
          create: { userId: user.id, role: 'OWNER' },
        },
      },
      include: {
        members: { include: { user: { select: { id: true, displayName: true, username: true, imageUrl: true } } } },
        _count: { select: { members: true } },
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
