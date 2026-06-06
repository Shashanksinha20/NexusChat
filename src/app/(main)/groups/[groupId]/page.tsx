import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ChatMessages } from '@/components/chat/chat-messages';
import { ChatHeader } from '@/components/chat/chat-header';
import { SendGroupMessage } from '@/components/chat/send-group-message';
import { MarkRead } from '@/components/layout/mark-read';
import type { GroupRole } from '@/types';

interface Props {
  params: { groupId: string };
}

async function getData(groupId: string, userId: string) {
  const currentUser = await db.user.findUnique({ where: { id: userId } });
  if (!currentUser) return null;

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: { user: { select: { id: true, displayName: true, username: true, imageUrl: true } } },
        orderBy: { role: 'asc' },
      },
      _count: { select: { members: true } },
    },
  });

  if (!group) return null;

  const myMembership = group.members.find((m) => m.userId === currentUser.id);
  if (!myMembership) return null;

  const messages = await db.message.findMany({
    where: { groupId },
    include: {
      sender: { select: { id: true, displayName: true, username: true, imageUrl: true } },
      reactions: { include: { user: { select: { id: true, displayName: true, imageUrl: true } } } },
    },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  const [conversations, groups] = await Promise.all([
    db.conversation.findMany({
      where: { members: { some: { userId: currentUser.id } } },
      include: { members: { include: { user: { select: { id: true, displayName: true, username: true, imageUrl: true } } } } },
      orderBy: { updatedAt: 'desc' },
    }),
    db.group.findMany({
      where: { members: { some: { userId: currentUser.id } } },
      include: { members: { include: { user: { select: { id: true, displayName: true, username: true, imageUrl: true } } } }, _count: { select: { members: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  return { currentUser, group, myMembership, messages, conversations, groups };
}

export default async function GroupPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/sign-in');

  const data = await getData(params.groupId, session.user.id);
  if (!data) notFound();

  const { currentUser, group, myMembership, messages, conversations, groups } = data;
  const roomId = `group:${group.id}`;

  return (
    <div className="flex h-full flex-col">
      <MarkRead id={group.id} type="group" />
      <ChatHeader
        currentUser={currentUser as any}
        conversations={conversations as any}
        groups={groups as any}
        chatType="group"
        group={group as any}
        currentUserRole={myMembership.role}
      />
      <ChatMessages
        initialMessages={messages as any}
        currentUserId={currentUser.id}
        roomId={roomId}
        currentUserRole={myMembership.role as GroupRole}
        chatType="group"
        groupId={group.id}
      />
      <SendGroupMessage groupId={group.id} roomId={roomId} displayName={currentUser.displayName} />
    </div>
  );
}
