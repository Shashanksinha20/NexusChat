import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { Users, UserCheck, Clock, UserPlus } from 'lucide-react';
import { db } from '@/lib/db';
import { FriendsPageClient } from './friends-client';

async function getData(clerkId: string) {
  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) return null;

  const [friendships, pending] = await Promise.all([
    db.friendship.findMany({
      where: { OR: [{ requesterId: user.id }, { addresseeId: user.id }], status: 'ACCEPTED' },
      include: {
        requester: { select: { id: true, displayName: true, username: true, imageUrl: true } },
        addressee: { select: { id: true, displayName: true, username: true, imageUrl: true } },
      },
    }),
    db.friendship.findMany({
      where: { addresseeId: user.id, status: 'PENDING' },
      include: {
        requester: { select: { id: true, displayName: true, username: true, imageUrl: true } },
        addressee: { select: { id: true, displayName: true, username: true, imageUrl: true } },
      },
    }),
  ]);

  return { user, friendships, pending };
}

export default async function FriendsPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const data = await getData(userId);
  if (!data) redirect('/sign-in');

  return <FriendsPageClient currentUserId={data.user.id} friendships={data.friendships as any} pending={data.pending as any} />;
}
