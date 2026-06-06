import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const prisma = new PrismaClient();

const roleWeight: Record<string, number> = {
  OWNER: 4,
  ADMIN: 3,
  MODERATOR: 2,
  MEMBER: 1,
};

async function main() {
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Request handling error:', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    path: '/api/socket/io',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || `http://${hostname}:${port}`,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Redis pub/sub adapter – required for horizontal scaling across multiple instances
  if (process.env.REDIS_URL) {
    try {
      const pubClient = new Redis(process.env.REDIS_URL);
      const subClient = pubClient.duplicate();
      await Promise.all([
        new Promise<void>((resolve) => pubClient.once('ready', resolve)),
        new Promise<void>((resolve) => subClient.once('ready', resolve)),
      ]);
      io.adapter(createAdapter(pubClient, subClient));
      console.log('✅ Socket.IO Redis adapter connected');
    } catch (error) {
      console.warn('⚠️  Redis not available, falling back to in-memory adapter');
    }
  }

  // userId → set of socket IDs (for presence tracking)
  const onlineUsers = new Map<string, Set<string>>();

  io.on('connection', async (socket) => {
    const userId = socket.handshake.auth.userId as string | undefined;

    if (!userId) {
      socket.disconnect();
      return;
    }

    // ── Presence ──────────────────────────────────────────────
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)!.add(socket.id);
    socket.join(`user:${userId}`);
    io.emit('user-online', { userId });

    // ── Auto-join all rooms so the client receives new-message events
    //    for unread badge tracking even when not actively viewing a chat
    const [userConvs, userGroups] = await Promise.all([
      prisma.conversationMember.findMany({ where: { userId }, select: { conversationId: true } }),
      prisma.groupMember.findMany({ where: { userId }, select: { groupId: true } }),
    ]);
    for (const { conversationId } of userConvs) socket.join(`conversation:${conversationId}`);
    for (const { groupId } of userGroups) socket.join(`group:${groupId}`);

    // ── Join / leave rooms ────────────────────────────────────
    socket.on('join-conversation', async (conversationId: string) => {
      const member = await prisma.conversationMember.findUnique({
        where: { conversationId_userId: { conversationId, userId } },
      }).catch(() => null);
      if (member) socket.join(`conversation:${conversationId}`);
    });

    socket.on('join-group', async (groupId: string) => {
      const member = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId } },
      }).catch(() => null);
      if (member) socket.join(`group:${groupId}`);
    });

    socket.on('leave-room', (roomId: string) => {
      socket.leave(roomId);
    });

    // ── Direct messages ───────────────────────────────────────
    socket.on('send-dm-message', async (data: { conversationId: string; content: string }) => {
      try {
        const { conversationId, content } = data;
        if (!content?.trim()) return;

        const member = await prisma.conversationMember.findUnique({
          where: { conversationId_userId: { conversationId, userId } },
        });
        if (!member) return;

        const message = await prisma.message.create({
          data: { content: content.trim(), senderId: userId, conversationId },
          include: {
            sender: { select: { id: true, displayName: true, imageUrl: true, username: true } },
            reactions: { include: { user: { select: { id: true, displayName: true, imageUrl: true } } } },
          },
        });

        // Update conversation timestamp
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        io.to(`conversation:${conversationId}`).emit('new-message', { ...message, type: 'dm' });
      } catch (err) {
        console.error('send-dm-message error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ── Group messages ────────────────────────────────────────
    socket.on('send-group-message', async (data: { groupId: string; content: string }) => {
      try {
        const { groupId, content } = data;
        if (!content?.trim()) return;

        const member = await prisma.groupMember.findUnique({
          where: { groupId_userId: { groupId, userId } },
        });
        if (!member) return;

        const message = await prisma.message.create({
          data: { content: content.trim(), senderId: userId, groupId },
          include: {
            sender: { select: { id: true, displayName: true, imageUrl: true, username: true } },
            reactions: { include: { user: { select: { id: true, displayName: true, imageUrl: true } } } },
          },
        });

        await prisma.group.update({
          where: { id: groupId },
          data: { updatedAt: new Date() },
        });

        io.to(`group:${groupId}`).emit('new-message', { ...message, type: 'group' });
      } catch (err) {
        console.error('send-group-message error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ── Edit message ──────────────────────────────────────────
    socket.on('edit-message', async (data: { messageId: string; content: string; roomId: string }) => {
      try {
        const { messageId, content, roomId } = data;
        if (!content?.trim()) return;

        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message || message.senderId !== userId || message.deleted) return;

        const updated = await prisma.message.update({
          where: { id: messageId },
          data: { content: content.trim(), edited: true },
          include: {
            sender: { select: { id: true, displayName: true, imageUrl: true, username: true } },
            reactions: { include: { user: { select: { id: true, displayName: true, imageUrl: true } } } },
          },
        });

        io.to(roomId).emit('message-updated', updated);
      } catch (err) {
        console.error('edit-message error:', err);
      }
    });

    // ── Delete message (with RBAC) ────────────────────────────
    socket.on('delete-message', async (data: { messageId: string; roomId: string }) => {
      try {
        const { messageId, roomId } = data;

        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message || message.deleted) return;

        let canDelete = message.senderId === userId;

        if (!canDelete && message.groupId) {
          const actorMember = await prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId: message.groupId, userId } },
          });
          canDelete =
            actorMember?.role === 'OWNER' ||
            actorMember?.role === 'ADMIN' ||
            actorMember?.role === 'MODERATOR';
        }

        if (!canDelete) return;

        await prisma.message.update({
          where: { id: messageId },
          data: { deleted: true, content: 'This message was deleted.' },
        });

        io.to(roomId).emit('message-deleted', { messageId });
      } catch (err) {
        console.error('delete-message error:', err);
      }
    });

    // ── Reactions ─────────────────────────────────────────────
    socket.on('add-reaction', async (data: { messageId: string; emoji: string; roomId: string }) => {
      try {
        const reaction = await prisma.messageReaction.upsert({
          where: { messageId_userId_emoji: { messageId: data.messageId, userId, emoji: data.emoji } },
          update: {},
          create: { messageId: data.messageId, userId, emoji: data.emoji },
          include: { user: { select: { id: true, displayName: true, imageUrl: true } } },
        });
        io.to(data.roomId).emit('reaction-added', { messageId: data.messageId, reaction });
      } catch (err) {
        console.error('add-reaction error:', err);
      }
    });

    socket.on('remove-reaction', async (data: { messageId: string; emoji: string; roomId: string }) => {
      try {
        await prisma.messageReaction.deleteMany({
          where: { messageId: data.messageId, userId, emoji: data.emoji },
        });
        io.to(data.roomId).emit('reaction-removed', { messageId: data.messageId, userId, emoji: data.emoji });
      } catch (err) {
        console.error('remove-reaction error:', err);
      }
    });

    // ── Typing indicators ─────────────────────────────────────
    socket.on('typing-start', ({ roomId, displayName }: { roomId: string; displayName: string }) => {
      socket.to(roomId).emit('user-typing', { userId, displayName, roomId });
    });

    socket.on('typing-stop', ({ roomId }: { roomId: string }) => {
      socket.to(roomId).emit('user-stop-typing', { userId, roomId });
    });

    // ── RBAC: Remove group member ─────────────────────────────
    socket.on('remove-member', async (data: { groupId: string; targetUserId: string }) => {
      try {
        const { groupId, targetUserId } = data;

        const [actor, target] = await Promise.all([
          prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } }),
          prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId: targetUserId } } }),
        ]);

        if (!actor || !target) return;

        const actorW = roleWeight[actor.role] ?? 0;
        const targetW = roleWeight[target.role] ?? 0;

        // Must outrank the target and have at least MODERATOR permissions
        if (actorW <= targetW || actorW < roleWeight['MODERATOR']) return;

        await prisma.groupMember.delete({
          where: { groupId_userId: { groupId, userId: targetUserId } },
        });

        io.to(`user:${targetUserId}`).emit('removed-from-group', { groupId });
        io.to(`group:${groupId}`).emit('member-removed', { groupId, userId: targetUserId });
      } catch (err) {
        console.error('remove-member error:', err);
      }
    });

    // ── RBAC: Update member role ──────────────────────────────
    socket.on('update-member-role', async (data: { groupId: string; targetUserId: string; role: string }) => {
      try {
        const { groupId, targetUserId, role } = data;

        const [actor, target] = await Promise.all([
          prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } }),
          prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId: targetUserId } } }),
        ]);

        if (!actor || !target) return;

        // Only OWNER can set ADMIN; ADMIN can set MODERATOR and below
        const actorW = roleWeight[actor.role] ?? 0;
        const newRoleW = roleWeight[role] ?? 0;

        // Actor must outrank both the target and the new role
        if (actorW <= roleWeight[target.role] || actorW <= newRoleW) return;

        const updated = await prisma.groupMember.update({
          where: { groupId_userId: { groupId, userId: targetUserId } },
          data: { role: role as any },
        });

        io.to(`group:${groupId}`).emit('member-role-updated', {
          groupId,
          userId: targetUserId,
          role: updated.role,
        });
      } catch (err) {
        console.error('update-member-role error:', err);
      }
    });

    // ── Disconnect ────────────────────────────────────────────
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user-offline', { userId });
        }
      }
    });
  });

  // Expose io to Next.js API routes via global
  (global as any).io = io;

  // In development Next.js registers its own upgrade handler that crashes on
  // Socket.IO WebSocket upgrade requests and then destroys the socket,
  // causing the client to reconnect in an infinite loop.
  // Fix: intercept the 'upgrade' event emission and handle Socket.IO paths
  // directly without letting Next.js see them.
  if (dev) {
    const _emit = httpServer.emit.bind(httpServer);
    (httpServer as any).emit = (event: string, ...args: any[]) => {
      if (event === 'upgrade' && (args[0]?.url as string)?.startsWith('/api/socket/io')) {
        io.engine.handleUpgrade(args[0], args[1], args[2]);
        return true;
      }
      return _emit(event, ...args);
    };
  }

  httpServer.listen(port, () => {
    console.log(`
╔══════════════════════════════════════════╗
║           NexusChat Server               ║
╠══════════════════════════════════════════╣
║  ➜ App:    http://${hostname}:${port}             ║
║  ➜ Socket: ws://${hostname}:${port}/api/socket/io ║
║  ➜ Mode:   ${dev ? 'development' : 'production  '}              ║
╚══════════════════════════════════════════╝
    `);
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
