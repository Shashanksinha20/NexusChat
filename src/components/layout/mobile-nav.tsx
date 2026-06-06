'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './sidebar';
import type { ConversationWithMembers, GroupWithMembers, User } from '@/types';

interface MobileNavProps {
  currentUser: User;
  conversations: ConversationWithMembers[];
  groups: GroupWithMembers[];
}

export function MobileNav({ currentUser, conversations, groups }: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <Sidebar currentUser={currentUser} conversations={conversations} groups={groups} />
      </SheetContent>
    </Sheet>
  );
}
