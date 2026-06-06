'use client';

import { useState } from 'react';
import { Search, UserPlus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useModal } from '@/store/modal-store';
import { useToast } from '@/components/ui/use-toast';
import { getInitials } from '@/lib/utils';

interface SearchResult {
  id: string;
  displayName: string;
  username: string;
  imageUrl: string | null;
}

export function AddFriendDialog() {
  const { isOpen, type, onClose } = useModal();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());

  const isModalOpen = isOpen && type === 'addFriend';

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.users ?? []);
    } catch {
      toast({ variant: 'destructive', title: 'Search failed', description: 'Could not search for users.' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    setSendingTo(userId);
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresseeId: userId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed');
      }
      setSentTo((prev) => new Set([...prev, userId]));
      toast({ title: 'Friend request sent!' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSendingTo(null);
    }
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setSentTo(new Set());
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Friend</DialogTitle>
          <DialogDescription>Search by username or display name to send a friend request.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="Search users…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        <div className="space-y-2">
          {results.length === 0 && query && !isSearching && (
            <p className="py-4 text-center text-sm text-muted-foreground">No users found</p>
          )}
          {results.map((user) => (
            <div key={user.id} className="flex items-center gap-3 rounded-lg border p-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.imageUrl ?? undefined} />
                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{user.displayName}</p>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
              <Button
                size="sm"
                variant={sentTo.has(user.id) ? 'secondary' : 'default'}
                disabled={sentTo.has(user.id) || sendingTo === user.id}
                onClick={() => handleSendRequest(user.id)}
              >
                {sendingTo === user.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : sentTo.has(user.id) ? (
                  'Sent'
                ) : (
                  <>
                    <UserPlus className="mr-1 h-4 w-4" />
                    Add
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
