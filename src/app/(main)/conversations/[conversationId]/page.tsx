import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ChatMessages } from '@/components/chat/chat-messages';
import { ChatInput } from '@/components/chat/chat-input';
import { ChatHeader } from '@/components/chat/chat-header';
import { SendDmMessage } from '@/components/chat/send-dm-message';
import { MarkRead } from '@/components/layout/mark-read';

interface Props {
  params: { conversationId: string };
}

async function getData(conversationId: string, userId: string) {
  const currentUser = await db.user.findUnique({ where: { id: userId } });
  if (!currentUser) return null;

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      members: {
        include: { user: { select: { id: true, displayName: true, username: true, imageUrl: true } } },
      },
    },
  });

  if (!conversation) return null;

  const isMember = conversation.members.some((m) => m.userId === currentUser.id);
  if (!isMember) return null;

  const messages = await db.message.findMany({
    where: { conversationId },
    include: {
      sender: { select: { id: true, displayName: true, username: true, imageUrl: true } },
      reactions: {
        include: { user: { select: { id: true, displayName: true, imageUrl: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  const [conv, grps] = await Promise.all([
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

  return { currentUser, conversation, messages, conversations: conv, groups: grps };
}

export default async function ConversationPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/sign-in');

  const data = await getData(params.conversationId, session.user.id);
  if (!data) notFound();

  const { currentUser, conversation, messages, conversations, groups } = data;
  const otherMember = conversation.members.find((m) => m.userId !== currentUser.id);
  const roomId = `conversation:${conversation.id}`;

  return (
    <div className="flex h-full flex-col">
      <MarkRead id={conversation.id} type="conversation" />
      <ChatHeader
        currentUser={currentUser as any}
        conversations={conversations as any}
        groups={groups as any}
        chatType="dm"
        otherUser={otherMember?.user as any}
      />
      <ChatMessages
        initialMessages={messages as any}
        currentUserId={currentUser.id}
        roomId={roomId}
        chatType="dm"
        conversationId={conversation.id}
      />
      <SendDmMessage conversationId={conversation.id} roomId={roomId} />
    </div>
  );
}
