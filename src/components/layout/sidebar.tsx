'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Users } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from './theme-toggle';
import { useModal } from '@/store/modal-store';
import { useSocket } from '@/components/providers/socket-provider';
import { useUnreadStore } from '@/store/unread-store';
import { getInitials } from '@/lib/utils';
import type { ConversationWithMembers, GroupWithMembers, User } from '@/types';

interface SidebarProps {
  currentUser: User;
  conversations: ConversationWithMembers[];
  groups: GroupWithMembers[];
  initialUnread: Record<string, number>;
}

export function Sidebar({ currentUser, conversations, groups, initialUnread }: SidebarProps) {
  const pathname = usePathname();
  const { onOpen } = useModal();
  const { socket, onlineUsers, isConnected } = useSocket();
  const { counts, setInitial, increment, reset } = useUnreadStore();

  // Seed store with server-computed counts once on mount
  useEffect(() => {
    setInitial(initialUnread);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for incoming messages and bump the unread count for inactive rooms
  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (msg: {
      conversationId?: string;
      groupId?: string;
      senderId?: string;
      createdAt?: string;
    }) => {
      const roomId = msg.conversationId ?? msg.groupId;
      if (!roomId) return;

      // Don't count own messages as unread
      if (msg.senderId === currentUser.id) return;

      // Don't count if the user is currently viewing this room
      const activeConv = pathname.match(/\/conversations\/([^/]+)/)?.[1];
      const activeGroup = pathname.match(/\/groups\/([^/]+)/)?.[1];
      if (roomId === activeConv || roomId === activeGroup) return;

      // Pass createdAt so the store can ignore messages already captured
      // by the DB-computed initial count (prevents double-counting on reconnect)
      increment(roomId, msg.createdAt ?? new Date().toISOString());
    };

    socket.on('new-message', onNewMessage);
    return () => { socket.off('new-message', onNewMessage); };
  }, [socket, pathname, increment]);

  // Reset unread count for whatever room the user navigates into
  useEffect(() => {
    const convMatch = pathname.match(/\/conversations\/([^/]+)/);
    const groupMatch = pathname.match(/\/groups\/([^/]+)/);
    const activeId = convMatch?.[1] ?? groupMatch?.[1];
    if (activeId) reset(activeId);
  }, [pathname, reset]);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
        {/* App header */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <Link href="/conversations" className="flex items-center gap-2 font-bold">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">N</span>
            </div>
            <span className="text-sidebar-foreground">NexusChat</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
          </div>
        </div>

        <ScrollArea className="flex-1 px-2 py-3">
          {/* Direct Messages */}
          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between px-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
                Direct Messages
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-sidebar-foreground/60 hover:text-sidebar-foreground"
                    onClick={() => onOpen('addFriend')}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">New Message</TooltipContent>
              </Tooltip>
            </div>

            <div className="space-y-0.5">
              {conversations.map((conv) => {
                const other = conv.members.find((m) => m.userId !== currentUser.id)?.user;
                if (!other) return null;
                const isActive = pathname === `/conversations/${conv.id}`;
                const isOnline = onlineUsers.has(other.id);
                const unread = counts[conv.id] ?? 0;

                return (
                  <Link key={conv.id} href={`/conversations/${conv.id}`}>
                    <div
                      className={cn(
                        'flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                      )}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={other.imageUrl ?? undefined} />
                          <AvatarFallback className="text-xs">{getInitials(other.displayName)}</AvatarFallback>
                        </Avatar>
                        <span
                          className={cn(
                            'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-sidebar',
                            isOnline ? 'bg-emerald-500' : 'bg-zinc-400'
                          )}
                        />
                      </div>
                      <span className="truncate text-sm font-medium flex-1">{other.displayName}</span>
                      {unread > 0 && !isActive && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}

              {conversations.length === 0 && (
                <p className="px-2 py-1 text-xs text-sidebar-foreground/40">
                  No conversations yet. Add a friend to start chatting!
                </p>
              )}
            </div>
          </div>

          <Separator className="my-3 bg-sidebar-border" />

          {/* Groups */}
          <div>
            <div className="mb-1 flex items-center justify-between px-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
                Groups
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-sidebar-foreground/60 hover:text-sidebar-foreground"
                    onClick={() => onOpen('createGroup')}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Create Group</TooltipContent>
              </Tooltip>
            </div>

            <div className="space-y-0.5">
              {groups.map((group) => {
                const isActive = pathname === `/groups/${group.id}`;
                const unread = counts[group.id] ?? 0;

                return (
                  <Link key={group.id} href={`/groups/${group.id}`}>
                    <div
                      className={cn(
                        'flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/20">
                        {group.imageUrl ? (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={group.imageUrl} />
                            <AvatarFallback>{group.name[0]}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <span className="text-sm font-bold text-primary">{group.name[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{group.name}</p>
                        <p className="truncate text-xs text-sidebar-foreground/50">
                          {group._count?.members ?? group.members.length} members
                        </p>
                      </div>
                      {unread > 0 && !isActive && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}

              {groups.length === 0 && (
                <p className="px-2 py-1 text-xs text-sidebar-foreground/40">
                  No groups yet. Create one or join via invite!
                </p>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          <Link href="/friends">
            <Button
              variant="ghost"
              className="mb-2 w-full justify-start gap-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <Users className="h-4 w-4" />
              Friends
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <UserButton afterSignOutUrl="/sign-in" appearance={{ elements: { avatarBox: 'h-8 w-8' } }} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-sidebar-foreground">{currentUser.displayName}</span>
              <span className="truncate text-xs text-sidebar-foreground/50">@{currentUser.username}</span>
            </div>
            <div className={cn('h-2 w-2 shrink-0 rounded-full', isConnected ? 'bg-emerald-500' : 'bg-zinc-400')} />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
