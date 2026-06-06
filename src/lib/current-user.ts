import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { db } from './db';

export async function currentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return db.user.findUnique({ where: { id: session.user.id } });
}

export async function currentUserOrThrow() {
  const user = await currentUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}
