'use client';

import { useState } from 'react';
import { MoreVertical, Trash2, Pencil, SmilePlus, Check, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatMessageDate, getInitials } from '@/lib/utils';
import type { MessageWithSender, GroupRole } from '@/types';
import { canManageMessages } from '@/types';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏'];

interface MessageItemProps {
  message: MessageWithSender;
  currentUserId: string;
  roomId: string;
  currentUserRole?: GroupRole;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, content: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onRemoveReact: (messageId: string, emoji: string) => void;
}

export function MessageItem({
  message,
  currentUserId,
  roomId,
  currentUserRole,
  onDelete,
  onEdit,
  onReact,
  onRemoveReact,
}: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);

  const isOwn = message.senderId === currentUserId;
  const canDelete =
    isOwn || (currentUserRole && canManageMessages(currentUserRole));
  const canEdit = isOwn && !message.deleted;

  const handleEditSubmit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  // Group reactions by emoji
  const reactionGroups = message.reactions.reduce<Record<string, { count: number; hasOwn: boolean }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, hasOwn: false };
    acc[r.emoji].count++;
    if (r.userId === currentUserId) acc[r.emoji].hasOwn = true;
    return acc;
  }, {});

  return (
    <div
      className={cn('group relative flex gap-3 px-4 py-1 hover:bg-accent/30', isOwn && 'flex-row-reverse')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <Avatar className="mt-1 h-8 w-8 shrink-0">
        <AvatarImage src={message.sender.imageUrl ?? undefined} />
        <AvatarFallback className="text-xs">{getInitials(message.sender.displayName)}</AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className={cn('flex max-w-[75%] flex-col', isOwn && 'items-end')}>
        <div className={cn('flex items-baseline gap-2', isOwn && 'flex-row-reverse')}>
          <span className="text-sm font-semibold">{isOwn ? 'You' : message.sender.displayName}</span>
          <span className="text-xs text-muted-foreground">{formatMessageDate(message.createdAt)}</span>
          {message.edited && !message.deleted && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>

        {/* Message bubble */}
        {isEditing ? (
          <div className="mt-1 flex flex-col gap-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); }
                if (e.key === 'Escape') { setIsEditing(false); setEditContent(message.content); }
              }}
              className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleEditSubmit}><Check className="h-3 w-3 mr-1" />Save</Button>
              <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditContent(message.content); }}>
                <X className="h-3 w-3 mr-1" />Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'mt-1 rounded-2xl px-4 py-2 text-sm',
              isOwn
                ? 'rounded-tr-sm bg-primary text-primary-foreground'
                : 'rounded-tl-sm bg-muted',
              message.deleted && 'italic text-muted-foreground'
            )}
          >
            {message.content}
          </div>
        )}

        {/* Reactions */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className={cn('mt-1 flex flex-wrap gap-1', isOwn && 'justify-end')}>
            {Object.entries(reactionGroups).map(([emoji, { count, hasOwn }]) => (
              <button
                key={emoji}
                onClick={() => hasOwn ? onRemoveReact(message.id, emoji) : onReact(message.id, emoji)}
                className={cn(
                  'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
                  hasOwn
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-border bg-background hover:bg-accent'
                )}
              >
                <span>{emoji}</span>
                <span>{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {showActions && !message.deleted && !isEditing && (
        <div
          className={cn(
            'absolute top-0 flex items-center gap-1 rounded-md border bg-background p-1 shadow-sm',
            isOwn ? 'left-4' : 'right-4'
          )}
        >
          {/* Quick emoji */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <SmilePlus className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="flex gap-1">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      const hasOwn = reactionGroups[emoji]?.hasOwn;
                      hasOwn ? onRemoveReact(message.id, emoji) : onReact(message.id, emoji);
                    }}
                    className="rounded p-1 text-lg hover:bg-accent"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* More actions */}
          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? 'start' : 'end'}>
                {canEdit && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                    {canEdit && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(message.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </div>
  );
}
