'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', { email, password, redirect: false });

    if (result?.error) {
      setError('Invalid email or password');
      setLoading(false);
    } else {
      router.push('/conversations');
      router.refresh();
    }
  };

  return (
    <div className="w-full min-w-[340px] max-w-sm bg-[#0a0a0f] px-8 py-10">
      <h2 className="mb-1 text-xl font-bold text-white">Welcome back</h2>
      <p className="mb-6 text-sm text-white/40">Sign in to your NexusChat account</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm text-white/70">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-violet-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm text-white/70">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-violet-500"
          />
        </div>

        {error && (
          <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-white/40">
        No account?{' '}
        <Link href="/sign-up" className="text-violet-400 hover:text-violet-300 transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  );
}
