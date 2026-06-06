'use client';

import { useEffect, useState } from 'react';
import { AddFriendDialog } from '@/components/friends/add-friend-dialog';
import { CreateGroupDialog } from '@/components/groups/create-group-dialog';
import { GroupSettingsDialog } from '@/components/groups/group-settings-dialog';

export function ModalProvider() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <>
      <AddFriendDialog />
      <CreateGroupDialog />
      <GroupSettingsDialog />
    </>
  );
}
