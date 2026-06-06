'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Link2, UserMinus, Shield, Loader2, LogOut } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useModal } from '@/store/modal-store';
import { useSocket } from '@/components/providers/socket-provider';
import { useToast } from '@/components/ui/use-toast';
import { getInitials, cn } from '@/lib/utils';
import { canManageMembers, canManageGroup, ROLE_WEIGHT } from '@/types';
import type { GroupRole } from '@/types';

const ROLE_COLORS: Record<GroupRole, string> = {
  OWNER: 'bg-amber-500/20 text-amber-500',
  ADMIN: 'bg-blue-500/20 text-blue-500',
  MODERATOR: 'bg-purple-500/20 text-purple-500',
  MEMBER: 'bg-muted text-muted-foreground',
};

export function GroupSettingsDialog() {
  const { isOpen, type, data, onClose } = useModal();
  const { socket } = useSocket();
  const { toast } = useToast();
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const isModalOpen = isOpen && type === 'groupSettings';
  const group = data?.group;

  if (!group) return null;

  const currentMember = group.members.find((m) => m.role === 'OWNER') ?? group.members[0];
  const myMembership = group.members.find((m) => m.userId === currentMember?.userId);
  const myRole: GroupRole = myMembership?.role ?? 'MEMBER';

  const generateInvite = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/groups/${group.id}/invites`, { method: 'POST' });
      const data = await res.json();
      const code = `${window.location.origin}/invite/${data.code}`;
      setInviteCode(code);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to generate invite link' });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyInvite = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      toast({ title: 'Invite link copied!' });
    }
  };

  const handleRemoveMember = (userId: string) => {
    socket?.emit('remove-member', { groupId: group.id, targetUserId: userId });
    toast({ title: 'Member removed' });
  };

  const handleUpdateRole = (userId: string, role: string) => {
    socket?.emit('update-member-role', { groupId: group.id, targetUserId: userId, role });
    toast({ title: 'Role updated' });
  };

  const handleLeaveGroup = async () => {
    try {
      await fetch(`/api/groups/${group.id}/members`, { method: 'DELETE' });
      onClose();
      router.push('/conversations');
      router.refresh();
    } catch {
      toast({ variant: 'destructive', title: 'Failed to leave group' });
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{group.name} — Settings</DialogTitle>
          <DialogDescription>{group.description ?? 'Manage this group.'}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="members">
          <TabsList className="w-full">
            <TabsTrigger value="members" className="flex-1">Members ({group.members.length})</TabsTrigger>
            <TabsTrigger value="invite" className="flex-1">Invite</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="mt-4 max-h-80 space-y-2 overflow-y-auto">
            {group.members
              .sort((a, b) => ROLE_WEIGHT[b.role] - ROLE_WEIGHT[a.role])
              .map((member) => (
                <div key={member.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={member.user.imageUrl ?? undefined} />
                    <AvatarFallback>{getInitials(member.user.displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{member.user.displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">@{member.user.username}</p>
                  </div>
                  <Badge className={cn('text-xs', ROLE_COLORS[member.role])} variant="outline">
                    {member.role}
                  </Badge>

                  {/* Actions — only shown if you outrank the member */}
                  {canManageMembers(myRole, member.role) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                          <Shield className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canManageGroup(myRole) && member.role !== 'ADMIN' && (
                          <DropdownMenuItem onClick={() => handleUpdateRole(member.userId, 'ADMIN')}>
                            Promote to Admin
                          </DropdownMenuItem>
                        )}
                        {member.role !== 'MODERATOR' && (
                          <DropdownMenuItem onClick={() => handleUpdateRole(member.userId, 'MODERATOR')}>
                            {ROLE_WEIGHT[member.role] > ROLE_WEIGHT['MODERATOR'] ? 'Demote to Moderator' : 'Promote to Moderator'}
                          </DropdownMenuItem>
                        )}
                        {member.role !== 'MEMBER' && (
                          <DropdownMenuItem onClick={() => handleUpdateRole(member.userId, 'MEMBER')}>
                            Demote to Member
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleRemoveMember(member.userId)}
                        >
                          <UserMinus className="mr-2 h-4 w-4" />
                          Remove from Group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
          </TabsContent>

          <TabsContent value="invite" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate a shareable invite link. Anyone with the link can join this group.
            </p>
            {inviteCode ? (
              <div className="flex gap-2">
                <code className="flex-1 truncate rounded-md border bg-muted px-3 py-2 text-xs">{inviteCode}</code>
                <Button size="icon" variant="outline" onClick={copyInvite}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={generateInvite} disabled={isGenerating} className="w-full">
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                Generate Invite Link
              </Button>
            )}
          </TabsContent>
        </Tabs>

        <Separator />

        {myRole !== 'OWNER' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Leave Group
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave &quot;{group.name}&quot;?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will need a new invite link to rejoin.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLeaveGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Leave
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
