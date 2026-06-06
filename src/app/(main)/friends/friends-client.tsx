'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, UserMinus, Check, X, UserPlus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useModal } from '@/store/modal-store';
import { useToast } from '@/components/ui/use-toast';
import { useSocket } from '@/components/providers/socket-provider';
import { getInitials } from '@/lib/utils';
import type { FriendshipWithUsers } from '@/types';

interface FriendsPageClientProps {
  currentUserId: string;
  friendships: FriendshipWithUsers[];
  pending: FriendshipWithUsers[];
}

export function FriendsPageClient({ currentUserId, friendships, pending }: FriendsPageClientProps) {
  const { onOpen } = useModal();
  const { toast } = useToast();
  const { onlineUsers } = useSocket();
  const router = useRouter();

  const [friends, setFriends] = useState(friendships);
  const [pendingReqs, setPendingReqs] = useState(pending);

  const handleAccept = async (friendshipId: string) => {
    const res = await fetch(`/api/friends/${friendshipId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ACCEPTED' }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPendingReqs((prev) => prev.filter((p) => p.id !== friendshipId));
      setFriends((prev) => [...prev, updated]);
      router.refresh();
      toast({ title: 'Friend request accepted!' });
    }
  };

  const handleDecline = async (friendshipId: string) => {
    await fetch(`/api/friends/${friendshipId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DECLINED' }),
    });
    setPendingReqs((prev) => prev.filter((p) => p.id !== friendshipId));
    toast({ title: 'Request declined' });
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    await fetch(`/api/friends/${friendshipId}`, { method: 'DELETE' });
    setFriends((prev) => prev.filter((f) => f.id !== friendshipId));
    toast({ title: 'Friend removed' });
  };

  const handleMessage = async (friendId: string) => {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: friendId }),
    });
    const data = await res.json();
    if (res.ok) router.push(`/conversations/${data.id}`);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-xl font-bold">Friends</h1>
          <p className="text-sm text-muted-foreground">Manage your connections</p>
        </div>
        <Button onClick={() => onOpen('addFriend')}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Friend
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Friends ({friends.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending
              {pendingReqs.length > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center" variant="destructive">
                  {pendingReqs.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {friends.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                <div className="text-4xl">👥</div>
                <p className="font-medium">No friends yet</p>
                <p className="text-sm">Add friends to start chatting!</p>
                <Button onClick={() => onOpen('addFriend')} variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Find Friends
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {friends.map((f) => {
                  const friend = f.requesterId === currentUserId ? f.addressee : f.requester;
                  const isOnline = onlineUsers.has(friend.id);
                  return (
                    <div key={f.id} className="flex items-center gap-3 rounded-xl border p-4 hover:bg-muted/50 transition-colors">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={friend.imageUrl ?? undefined} />
                          <AvatarFallback>{getInitials(friend.displayName)}</AvatarFallback>
                        </Avatar>
                        <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${isOnline ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{friend.displayName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {isOnline ? '🟢 Online' : '⚫ Offline'} · @{friend.username}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleMessage(friend.id)}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveFriend(f.id)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-4">
            {pendingReqs.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                <div className="text-4xl">✉️</div>
                <p className="font-medium">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReqs.map((req) => (
                  <div key={req.id} className="flex items-center gap-3 rounded-xl border p-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={req.requester.imageUrl ?? undefined} />
                      <AvatarFallback>{getInitials(req.requester.displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{req.requester.displayName}</p>
                      <p className="text-xs text-muted-foreground">@{req.requester.username} wants to be friends</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAccept(req.id)}>
                        <Check className="mr-1 h-4 w-4" />
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDecline(req.id)}>
                        <X className="mr-1 h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
