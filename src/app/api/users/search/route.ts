import { NextResponse } from 'next/server';
import { currentUserOrThrow } from '@/lib/current-user';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const user = await currentUserOrThrow();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 1) return NextResponse.json({ users: [] });

    const users = await db.user.findMany({
      where: {
        AND: [
          { id: { not: user.id } },
          {
            OR: [
              { username: { contains: q, mode: 'insensitive' } },
              { displayName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: { id: true, displayName: true, username: true, imageUrl: true },
      take: 10,
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
