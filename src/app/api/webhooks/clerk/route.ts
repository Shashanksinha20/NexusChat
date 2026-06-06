import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) return new NextResponse('Missing webhook secret', { status: 500 });

  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse('Missing svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: any;

  try {
    evt = wh.verify(body, { 'svix-id': svix_id, 'svix-timestamp': svix_timestamp, 'svix-signature': svix_signature });
  } catch {
    return new NextResponse('Invalid signature', { status: 400 });
  }

  const { type, data } = evt;

  if (type === 'user.created' || type === 'user.updated') {
    const email = data.email_addresses?.[0]?.email_address;
    const username = data.username ?? email?.split('@')[0] ?? data.id;
    const displayName = [data.first_name, data.last_name].filter(Boolean).join(' ') || username;

    await db.user.upsert({
      where: { clerkId: data.id },
      update: { email: email ?? '', username, displayName, imageUrl: data.image_url },
      create: {
        clerkId: data.id,
        email: email ?? '',
        username,
        displayName,
        imageUrl: data.image_url,
      },
    });
  }

  if (type === 'user.deleted') {
    await db.user.deleteMany({ where: { clerkId: data.id } });
  }

  return NextResponse.json({ received: true });
}
