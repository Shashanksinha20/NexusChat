import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Sidebar } from '@/components/layout/sidebar';
import { SocketProvider } from '@/components/providers/socket-provider';
import { ModalProvider } from '@/components/providers/modal-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

async function getLayoutData(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const [conversations, groups, convMembers, groupMembers] = await Promise.all([
    db.conversation.findMany({
      where: { members: { some: { userId: user.id } } },
      include: {
        members: { include: { user: { select: { id: true, displayName: true, username: true, imageUrl: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    db.group.findMany({
      where: { members: { some: { userId: user.id } } },
      include: {
        members: { include: { user: { select: { id: true, displayName: true, username: true, imageUrl: true } } } },
        _count: { select: { members: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    db.conversationMember.findMany({
      where: { userId: user.id },
      select: { conversationId: true, lastReadAt: true },
    }),
    db.groupMember.findMany({
      where: { userId: user.id },
      select: { groupId: true, lastReadAt: true },
    }),
  ]);

  const [convUnreads, groupUnreads] = await Promise.all([
    Promise.all(
      convMembers.map((m) =>
        db.message
          .count({ where: { conversationId: m.conversationId, createdAt: { gt: m.lastReadAt } } })
          .then((count) => ({ id: m.conversationId, count }))
      )
    ),
    Promise.all(
      groupMembers.map((m) =>
        db.message
          .count({ where: { groupId: m.groupId, createdAt: { gt: m.lastReadAt } } })
          .then((count) => ({ id: m.groupId, count }))
      )
    ),
  ]);

  const initialUnread: Record<string, number> = {};
  for (const { id, count } of [...convUnreads, ...groupUnreads]) {
    if (count > 0) initialUnread[id] = count;
  }

  return { user, conversations, groups, initialUnread };
}

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/sign-in');

  const data = await getLayoutData(session.user.id);
  if (!data) redirect('/sign-in');

  const { user, conversations, groups, initialUnread } = data;

  return (
    <SocketProvider userId={user.id}>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          <aside className="hidden w-64 shrink-0 border-r md:block">
            <Sidebar
              currentUser={user}
              conversations={conversations as any}
              groups={groups as any}
              initialUnread={initialUnread}
            />
          </aside>
          <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
        </div>
        <ModalProvider />
      </TooltipProvider>
    </SocketProvider>
  );
}
