import { auth } from '@clerk/nextjs/server';
import { db } from './db';

export async function currentUser() {
  const { userId } = auth();
  if (!userId) return null;

  return db.user.findUnique({ where: { clerkId: userId } });
}

export async function currentUserOrThrow() {
  const user = await currentUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}
