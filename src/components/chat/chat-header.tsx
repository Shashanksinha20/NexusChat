'use client';

import { Settings, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MobileNav } from '@/components/layout/mobile-nav';
import { useSocket } from '@/components/providers/socket-provider';
import { useModal } from '@/store/modal-store';
import { getInitials, cn } from '@/lib/utils';
import type { User, ConversationWithMembers, GroupWithMembers } from '@/types';

interface ChatHeaderProps {
  currentUser: User;
  conversations: ConversationWithMembers[];
  groups: GroupWithMembers[];
  chatType: 'dm' | 'group';
  otherUser?: User;
  group?: GroupWithMembers;
  currentUserRole?: string;
}

export function ChatHeader({
  currentUser,
  conversations,
  groups,
  chatType,
  otherUser,
  group,
  currentUserRole,
}: ChatHeaderProps) {
  const { onlineUsers } = useSocket();
  const { onOpen } = useModal();

  return (
    <TooltipProvider>
      <div className="flex h-14 items-center gap-3 border-b bg-background px-4">
        <MobileNav currentUser={currentUser} conversations={conversations} groups={groups} />

        {chatType === 'dm' && otherUser && (
          <>
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src={otherUser.imageUrl ?? undefined} />
                <AvatarFallback className="text-xs">{getInitials(otherUser.displayName)}</AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background',
                  onlineUsers.has(otherUser.id) ? 'bg-emerald-500' : 'bg-zinc-400'
                )}
              />
            </div>
            <div>
              <p className="font-semibold leading-tight">{otherUser.displayName}</p>
              <p className="text-xs text-muted-foreground">
                {onlineUsers.has(otherUser.id) ? 'Online' : 'Offline'} · @{otherUser.username}
              </p>
            </div>
          </>
        )}

        {chatType === 'group' && group && (
          <>
            <Avatar className="h-8 w-8">
              <AvatarImage src={group.imageUrl ?? undefined} />
              <AvatarFallback>{group.name[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">{group.name}</p>
              <p className="text-xs text-muted-foreground">
                {group.members.length} member{group.members.length !== 1 && 's'} · #{group.name.toLowerCase().replace(/\s+/g, '-')}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              {currentUserRole && (
                <Badge variant="secondary" className="hidden text-xs sm:inline-flex">
                  {currentUserRole}
                </Badge>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => onOpen('groupSettings', { group })}>
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Group Settings</TooltipContent>
              </Tooltip>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
