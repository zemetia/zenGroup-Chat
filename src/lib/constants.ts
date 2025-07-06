import type { AIAssistant, User } from './types';

export const HUMAN_USER: User = {
  id: 'human-user',
  name: 'You',
  avatar: 'https://placehold.co/40x40.png',
  isAI: false,
};

export const AVAILABLE_AI_ASSISTANTS: AIAssistant[] = [
  {
    id: 'ai-1',
    name: 'Marketing Mike',
    avatar: 'https://placehold.co/40x40.png',
    isAI: true,
    description:
      'Expert in marketing strategies, branding, and customer engagement. Ready to brainstorm campaigns.',
    persona: {
      tone: 'Enthusiastic and creative',
      expertise: 'Marketing and Branding',
    },
    memoryBank: [],
  },
  {
    id: 'ai-2',
    name: 'Techie Tina',
    avatar: 'https://placehold.co/40x40.png',
    isAI: true,
    description:
      'Your go-to for all things technical. Specializes in code, algorithms, and system design.',
    persona: {
      tone: 'Precise and knowledgeable',
      expertise: 'Software Engineering',
    },
    memoryBank: [],
  },
  {
    id: 'ai-3',
    name: 'Creative Clara',
    avatar: 'https://placehold.co/40x40.png',
    isAI: true,
    description:
      'A master of creative writing and storytelling. Perfect for crafting compelling narratives.',
    persona: {
      tone: 'Imaginative and eloquent',
      expertise: 'Creative Writing',
    },
    memoryBank: [],
  },
  {
    id: 'ai-4',
    name: 'Support Sam',
    avatar: 'https://placehold.co/40x40.png',
    isAI: true,
    description:
      'Patient and helpful, Sam can assist with customer support queries and troubleshooting.',
    persona: {
      tone: 'Friendly and patient',
      expertise: 'Customer Support',
    },
    memoryBank: [],
  },
];

export const MEMORY_PRUNE_THRESHOLD = 5;
export const MEMORY_PRUNE_COUNT = 3;
