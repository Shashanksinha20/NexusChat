import type {
  User,
  Friendship,
  FriendshipStatus,
  Conversation,
  ConversationMember,
  Group,
  GroupMember,
  GroupRole,
  Message,
  MessageReaction,
  Invite,
} from '@prisma/client';

// Re-export prisma types
export type {
  User,
  Friendship,
  FriendshipStatus,
  Conversation,
  ConversationMember,
  Group,
  GroupMember,
  GroupRole,
  Message,
  MessageReaction,
  Invite,
};

// Enriched types used throughout the UI
export type UserPublic = Pick<User, 'id' | 'displayName' | 'username' | 'imageUrl'>;

export type MessageWithSender = Message & {
  sender: UserPublic;
  reactions: (MessageReaction & { user: UserPublic })[];
  type?: 'dm' | 'group';
};

export type ConversationWithMembers = Conversation & {
  members: (ConversationMember & { user: UserPublic })[];
  messages: MessageWithSender[];
};

export type GroupWithMembers = Group & {
  members: (GroupMember & { user: UserPublic })[];
  messages?: MessageWithSender[];
  _count?: { members: number };
};

export type FriendshipWithUsers = Friendship & {
  requester: UserPublic;
  addressee: UserPublic;
};

export type SocketMessage = MessageWithSender & { type: 'dm' | 'group' };

// RBAC helpers
export const ROLE_WEIGHT: Record<GroupRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MODERATOR: 2,
  MEMBER: 1,
};

export function canManageMessages(role: GroupRole) {
  return ROLE_WEIGHT[role] >= ROLE_WEIGHT['MODERATOR'];
}

export function canManageMembers(actorRole: GroupRole, targetRole: GroupRole) {
  return ROLE_WEIGHT[actorRole] > ROLE_WEIGHT[targetRole] && ROLE_WEIGHT[actorRole] >= ROLE_WEIGHT['MODERATOR'];
}

export function canManageGroup(role: GroupRole) {
  return ROLE_WEIGHT[role] >= ROLE_WEIGHT['ADMIN'];
}
