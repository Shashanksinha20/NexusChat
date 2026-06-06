'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { MessageItem } from './message-item';
import { TypingIndicator } from './typing-indicator';
import { useChatScroll } from '@/hooks/use-chat-scroll';
import { useSocket } from '@/components/providers/socket-provider';
import type { MessageWithSender, GroupRole } from '@/types';

interface ChatMessagesProps {
  initialMessages: MessageWithSender[];
  currentUserId: string;
  roomId: string;
  currentUserRole?: GroupRole;
  chatType: 'dm' | 'group';
  conversationId?: string;
  groupId?: string;
}

export function ChatMessages({
  initialMessages,
  currentUserId,
  roomId,
  currentUserRole,
  chatType,
  conversationId,
  groupId,
}: ChatMessagesProps) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages);
  const [typingUsers, setTypingUsers] = useState<{ userId: string; displayName: string }[]>([]);
  const scrollRef = useChatScroll(messages);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!socket) return;

    const joinRoom = () => {
      if (conversationId) socket.emit('join-conversation', conversationId);
      if (groupId) socket.emit('join-group', groupId);
    };

    // Join now (queued by Socket.IO if not yet connected) and re-join on every reconnect
    joinRoom();
    socket.on('connect', joinRoom);

    const onNewMessage = (msg: MessageWithSender & { type: string }) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    const onMessageUpdated = (msg: MessageWithSender) => {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
    };

    const onMessageDeleted = ({ messageId }: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, deleted: true, content: 'This message was deleted.' } : m
        )
      );
    };

    const onReactionAdded = ({
      messageId,
      reaction,
    }: {
      messageId: string;
      reaction: MessageWithSender['reactions'][0];
    }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, reactions: [...m.reactions.filter((r) => !(r.userId === reaction.userId && r.emoji === reaction.emoji)), reaction] }
            : m
        )
      );
    };

    const onReactionRemoved = ({
      messageId,
      userId,
      emoji,
    }: {
      messageId: string;
      userId: string;
      emoji: string;
    }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, reactions: m.reactions.filter((r) => !(r.userId === userId && r.emoji === emoji)) }
            : m
        )
      );
    };

    const onUserTyping = ({ userId, displayName, roomId: typingRoomId }: { userId: string; displayName: string; roomId: string }) => {
      if (typingRoomId !== roomId) return;
      setTypingUsers((prev) => {
        if (prev.some((u) => u.userId === userId)) return prev;
        return [...prev, { userId, displayName }];
      });
    };

    const onUserStopTyping = ({ userId }: { userId: string; roomId: string }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    };

    socket.on('new-message', onNewMessage);
    socket.on('message-updated', onMessageUpdated);
    socket.on('message-deleted', onMessageDeleted);
    socket.on('reaction-added', onReactionAdded);
    socket.on('reaction-removed', onReactionRemoved);
    socket.on('user-typing', onUserTyping);
    socket.on('user-stop-typing', onUserStopTyping);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('new-message', onNewMessage);
      socket.off('message-updated', onMessageUpdated);
      socket.off('message-deleted', onMessageDeleted);
      socket.off('reaction-added', onReactionAdded);
      socket.off('reaction-removed', onReactionRemoved);
      socket.off('user-typing', onUserTyping);
      socket.off('user-stop-typing', onUserStopTyping);
    };
  }, [socket, roomId, conversationId, groupId]);

  const handleDelete = useCallback(
    (messageId: string) => {
      socket?.emit('delete-message', { messageId, roomId });
    },
    [socket, roomId]
  );

  const handleEdit = useCallback(
    (messageId: string, content: string) => {
      socket?.emit('edit-message', { messageId, content, roomId });
    },
    [socket, roomId]
  );

  const handleReact = useCallback(
    (messageId: string, emoji: string) => {
      socket?.emit('add-reaction', { messageId, emoji, roomId });
    },
    [socket, roomId]
  );

  const handleRemoveReact = useCallback(
    (messageId: string, emoji: string) => {
      socket?.emit('remove-reaction', { messageId, emoji, roomId });
    },
    [socket, roomId]
  );

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto py-4">
      {messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
          <div className="text-4xl">💬</div>
          <p className="font-medium">No messages yet</p>
          <p className="text-sm">Send the first message!</p>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              currentUserId={currentUserId}
              roomId={roomId}
              currentUserRole={currentUserRole}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onReact={handleReact}
              onRemoveReact={handleRemoveReact}
            />
          ))}
        </>
      )}
      <TypingIndicator typingUsers={typingUsers.filter((u) => u.userId !== currentUserId)} />
    </div>
  );
}
