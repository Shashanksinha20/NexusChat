import { create } from 'zustand';
import type { GroupWithMembers } from '@/types';

export type ModalType =
  | 'addFriend'
  | 'createGroup'
  | 'editGroup'
  | 'groupSettings'
  | 'inviteLink'
  | 'deleteMessage'
  | 'leaveGroup';

interface ModalData {
  group?: GroupWithMembers;
  messageId?: string;
  conversationId?: string;
}

interface ModalStore {
  type: ModalType | null;
  data: ModalData;
  isOpen: boolean;
  onOpen: (type: ModalType, data?: ModalData) => void;
  onClose: () => void;
}

export const useModal = create<ModalStore>((set) => ({
  type: null,
  data: {},
  isOpen: false,
  onOpen: (type, data = {}) => set({ type, data, isOpen: true }),
  onClose: () => set({ type: null, isOpen: false }),
}));
