'use client';

import { useCallback } from 'react';
import { ChatInput } from './chat-input';
import { useSocket } from '@/components/providers/socket-provider';

interface SendGroupMessageProps {
  groupId: string;
  roomId: string;
  displayName: string;
}

export function SendGroupMessage({ groupId, roomId, displayName }: SendGroupMessageProps) {
  const { socket, isConnected } = useSocket();

  const handleSend = useCallback(
    (content: string) => {
      socket?.emit('send-group-message', { groupId, content });
    },
    [socket, groupId]
  );

  const handleTypingStart = useCallback(() => {
    socket?.emit('typing-start', { roomId, displayName });
  }, [socket, roomId, displayName]);

  const handleTypingStop = useCallback(() => {
    socket?.emit('typing-stop', { roomId });
  }, [socket, roomId]);

  return (
    <ChatInput
      disabled={!isConnected}
      placeholder={isConnected ? `Message #${roomId.split(':')[1]}…` : 'Connecting…'}
      onSend={handleSend}
      onTypingStart={handleTypingStart}
      onTypingStop={handleTypingStop}
    />
  );
}
