'use client';

import { useEffect } from 'react';
import { useUnreadStore } from '@/store/unread-store';

interface MarkReadProps {
  id: string;
  type: 'conversation' | 'group';
}

export function MarkRead({ id, type }: MarkReadProps) {
  const reset = useUnreadStore((s) => s.reset);

  useEffect(() => {
    reset(id);
    const path = type === 'conversation' ? 'conversations' : 'groups';
    fetch(`/api/${path}/${id}/read`, { method: 'PATCH' });
  }, [id, type, reset]);

  return null;
}
