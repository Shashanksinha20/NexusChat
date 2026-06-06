import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Users, UserCheck, Clock, UserPlus } from 'lucide-react';
import { db } from '@/lib/db';
import { FriendsPageClient } from './friends-client';

async function getData(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/sign-in');

  const data = await getData(session.user.id);
  if (!data) redirect('/sign-in');

  return <FriendsPageClient currentUserId={data.user.id} friendships={data.friendships as any} pending={data.pending as any} />;
}
