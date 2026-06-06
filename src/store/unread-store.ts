import { create } from 'zustand';

interface UnreadStore {
  counts: Record<string, number>;
  sessionStart: number;
  setInitial: (counts: Record<string, number>) => void;
  increment: (id: string, createdAt: string) => void;
  reset: (id: string) => void;
}

export const useUnreadStore = create<UnreadStore>((set, get) => ({
  counts: {},
  sessionStart: Date.now(),
  setInitial: (counts) => set({ counts, sessionStart: Date.now() }),
  increment: (id, createdAt) => {
    // Skip messages that existed before this session started —
    // they are already included in the DB-computed initial count.
    if (new Date(createdAt).getTime() <= get().sessionStart) return;
    set((state) => ({ counts: { ...state.counts, [id]: (state.counts[id] ?? 0) + 1 } }));
  },
  reset: (id) => set((state) => ({ counts: { ...state.counts, [id]: 0 } })),
}));
