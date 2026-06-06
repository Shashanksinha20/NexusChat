'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        username: form.username.toLowerCase().trim(),
        displayName: form.displayName.trim(),
        password: form.password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Registration failed');
      setLoading(false);
      return;
    }

    const result = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      setError('Account created but sign-in failed. Try signing in manually.');
      setLoading(false);
    } else {
      router.push('/conversations');
      router.refresh();
    }
  };

  return (
    <div className="w-full min-w-[340px] max-w-sm bg-[#0a0a0f] px-8 py-10">
      <h2 className="mb-1 text-xl font-bold text-white">Create an account</h2>
      <p className="mb-6 text-sm text-white/40">Join NexusChat today</p>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="displayName" className="text-sm text-white/70">Display name</Label>
          <Input
            id="displayName"
            value={form.displayName}
            onChange={set('displayName')}
            required
            placeholder="Alex Johnson"
            className="border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-violet-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="username" className="text-sm text-white/70">Username</Label>
          <Input
            id="username"
            value={form.username}
            onChange={set('username')}
            required
            placeholder="alexj"
            className="border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-violet-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm text-white/70">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={set('email')}
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
            value={form.password}
            onChange={set('password')}
            required
            placeholder="••••••••"
            className="border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-violet-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-sm text-white/70">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
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
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-white/40">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-violet-400 hover:text-violet-300 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
