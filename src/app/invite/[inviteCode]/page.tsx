'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Users, Hash } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface InviteData {
  group: { id: string; name: string; imageUrl: string | null; _count: { members: number } };
  createdBy: { displayName: string };
  expiresAt: string | null;
}

export default function InvitePage({ params }: { params: { inviteCode: string } }) {
  const { data: session } = useSession();
  const isSignedIn = !!session;
  const router = useRouter();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/invites/${params.inviteCode}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setInvite(data);
      })
      .catch(() => setError('Failed to load invite'))
      .finally(() => setLoading(false));
  }, [params.inviteCode]);

  const handleJoin = async () => {
    if (!isSignedIn) {
      router.push(`/sign-in?callbackUrl=/invite/${params.inviteCode}`);
      return;
    }
    setIsJoining(true);
    try {
      const res = await fetch(`/api/invites/${params.inviteCode}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/groups/${data.groupId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      <div className="w-full max-w-sm rounded-2xl border bg-background p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <span className="text-lg font-bold text-primary-foreground">N</span>
          </div>
          <p className="text-sm text-muted-foreground">You have been invited to join</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-center">
            <p className="font-semibold text-destructive">Invalid Invite</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button className="mt-4" onClick={() => router.push('/')}>Go Home</Button>
          </div>
        )}

        {invite && !error && (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-20 w-20">
                <AvatarImage src={invite.group.imageUrl ?? undefined} />
                <AvatarFallback className="text-2xl">{invite.group.name[0]}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-2xl font-bold">{invite.group.name}</h2>
                <div className="mt-1 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{invite.group._count.members} members</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Invited by <span className="font-medium">{invite.createdBy.displayName}</span>
                </p>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={handleJoin} disabled={isJoining}>
              {isJoining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Hash className="mr-2 h-4 w-4" />}
              {isSignedIn ? 'Join Group' : 'Sign in & Join'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
