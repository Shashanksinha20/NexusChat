import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email, username, displayName, password } = await req.json();

    if (!email || !username || !displayName || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const existing = await db.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      const field = existing.email === email ? 'Email' : 'Username';
      return NextResponse.json({ error: `${field} is already taken` }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    await db.user.create({
      data: { email, username, displayName, password: hashed },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
