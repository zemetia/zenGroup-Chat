import type { User } from './types';

const randomAvatarId = Math.random().toString(36).substring(2, 10);

export const HUMAN_USER: User = {
  id: 'human-user',
  name: 'You',
  avatar: `https://avatar.iran.liara.run/public/${randomAvatarId}`,
  isAI: false,
};

export const AI_LIMIT = 3;
export const MEMORY_PRUNE_THRESHOLD = 5;
export const MEMORY_PRUNE_COUNT = 3;
