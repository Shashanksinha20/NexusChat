import { MessageSquare } from 'lucide-react';

export default function ConversationsPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
      <div className="rounded-full bg-muted p-6">
        <MessageSquare className="h-12 w-12" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">Your Messages</h2>
        <p className="mt-1 text-sm">Select a conversation from the sidebar or add a friend to start chatting.</p>
      </div>
    </div>
  );
}
