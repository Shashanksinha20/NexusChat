'use client';

import { useCallback } from 'react';
import { ChatInput } from './chat-input';
import { useSocket } from '@/components/providers/socket-provider';

interface SendDmMessageProps {
  conversationId: string;
  roomId: string;
}

export function SendDmMessage({ conversationId, roomId }: SendDmMessageProps) {
  const { socket, isConnected } = useSocket();

  const handleSend = useCallback(
    (content: string) => {
      socket?.emit('send-dm-message', { conversationId, content });
    },
    [socket, conversationId]
  );

  const handleTypingStart = useCallback(() => {
    socket?.emit('typing-start', { roomId, displayName: '' });
  }, [socket, roomId]);

  const handleTypingStop = useCallback(() => {
    socket?.emit('typing-stop', { roomId });
  }, [socket, roomId]);

  return (
    <ChatInput
      disabled={!isConnected}
      placeholder={isConnected ? 'Send a message…' : 'Connecting…'}
      onSend={handleSend}
      onTypingStart={handleTypingStart}
      onTypingStop={handleTypingStop}
    />
  );
}
