'use client';

import { useState, useRef, useCallback } from 'react';
import { SendHorizonal, SmilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const EMOJI_CATEGORIES = [
  { label: 'Smileys', emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😗','😙','😚','🤗','🤭','🤫','🤔','🫡','🤐','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','😟','🙁','😮','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱'] },
  { label: 'Gestures', emojis: ['👍','👎','👌','🤌','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👋','🤚','🖐️','✋','🖖','🤜','🤛','👏','🙌','🤲','🙏','✍️','💪','🦾','🦿'] },
  { label: 'Objects', emojis: ['❤️','🧡','💛','💚','💙','💜','🤎','🖤','🤍','💔','❣️','💕','💞','💓','💗','💖','💘','💝','🔥','⭐','🌟','💫','✨','💥','🎉','🎊','🎈','🎁','🏆','🥇','🎯','🎮','🎲','🎭','🎬','🎤','🎵','🎶','🎸','🎹','🥁','🎷','🎺','🎻','🪕','🎼','🎧'] },
];

interface ChatInputProps {
  placeholder?: string;
  disabled?: boolean;
  onSend: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

export function ChatInput({ placeholder = 'Type a message…', disabled, onSend, onTypingStart, onTypingStop }: ChatInputProps) {
  const [content, setContent] = useState('');
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);

  const handleTyping = useCallback(() => {
    if (!isTyping.current) {
      isTyping.current = true;
      onTypingStart();
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTyping.current = false;
      onTypingStop();
    }, 2000);
  }, [onTypingStart, onTypingStop]);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setContent('');
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    if (isTyping.current) { isTyping.current = false; onTypingStop(); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="flex items-end gap-2 rounded-xl border bg-muted/50 px-4 py-2 focus-within:ring-2 focus-within:ring-ring">
        {/* Emoji picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="mb-0.5 h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground" disabled={disabled}>
              <SmilePlus className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" side="top" align="start">
            {EMOJI_CATEGORIES.map((cat) => (
              <div key={cat.label} className="mb-3">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">{cat.label}</p>
                <div className="flex flex-wrap gap-0.5">
                  {cat.emojis.map((e) => (
                    <button key={e} onClick={() => insertEmoji(e)} className="rounded p-1 text-lg hover:bg-accent">
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </PopoverContent>
        </Popover>

        {/* Text area */}
        <textarea
          value={content}
          onChange={(e) => { setContent(e.target.value); handleTyping(); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="max-h-40 flex-1 resize-none bg-transparent py-1.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          style={{ height: 'auto' }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
          }}
        />

        {/* Send button */}
        <Button
          size="icon"
          className={cn('mb-0.5 h-8 w-8 shrink-0', !content.trim() && 'opacity-50')}
          onClick={handleSend}
          disabled={!content.trim() || disabled}
        >
          <SendHorizonal className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-1 text-center text-xs text-muted-foreground">
        Press <kbd className="rounded border px-1 font-mono text-[10px]">Enter</kbd> to send &middot;{' '}
        <kbd className="rounded border px-1 font-mono text-[10px]">Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}
