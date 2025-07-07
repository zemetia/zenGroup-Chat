import type { User } from './types';

export const HUMAN_USER: User = {
  id: 'human-user',
  name: 'You',
  avatar: 'https://placehold.co/40x40.png',
  isAI: false,
};

export const AI_LIMIT = 3;
export const MEMORY_PRUNE_THRESHOLD = 5;
export const MEMORY_PRUNE_COUNT = 3;
