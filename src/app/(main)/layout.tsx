import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { Sidebar } from '@/components/layout/sidebar';
import { SocketProvider } from '@/components/providers/socket-provider';
import { ModalProvider } from '@/components/providers/modal-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

async function getOrCreateDbUser(clerkId: string) {
  let user = await db.user.findUnique({ where: { clerkId } });
  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? '';
    const username = clerkUser.username ?? email.split('@')[0] ?? clerkId;
    const displayName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || username;
    user = await db.user.create({
      data: { clerkId, email, username, displayName, imageUrl: clerkUser.imageUrl },
    });
  }
  return user;
}

async function getLayoutData(clerkId: string) {
  const user = await getOrCreateDbUser(clerkId);
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

  // Compute initial unread counts in parallel
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
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const data = await getLayoutData(userId);
  if (!data) redirect('/sign-in');

  const { user, conversations, groups, initialUnread } = data;

  return (
    <SocketProvider userId={user.id}>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          {/* Desktop sidebar */}
          <aside className="hidden w-64 shrink-0 border-r md:block">
            <Sidebar
              currentUser={user}
              conversations={conversations as any}
              groups={groups as any}
              initialUnread={initialUnread}
            />
          </aside>

          {/* Main content */}
          <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
        </div>
        <ModalProvider />
      </TooltipProvider>
    </SocketProvider>
  );
}
