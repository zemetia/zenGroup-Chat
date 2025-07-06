export type Persona = {
  tone: string;
  expertise: string;
  additionalInstructions?: string;
};

export type Memory = {
    id: string;
    content: string;
    timestamp: number;
};

export type Participant = {
  id:string;
  name: string;
  avatar: string;
  isAI: boolean;
  persona?: Persona;
  description?: string;
  isTyping?: boolean;
  isCustom?: boolean;
  memoryBank?: Memory[];
};

export type AIAssistant = Omit<Participant, 'isAI' | 'memoryBank'> & {
  isAI: true;
  description: string;
  persona: Persona;
  isCustom?: boolean;
  memoryBank: Memory[];
};

export type User = Omit<Participant, 'isAI' | 'persona' | 'description' | 'isTyping' | 'isCustom' | 'memoryBank'> & {
  isAI: false;
};

export type Message = {
    id: string;
    text: string;
    timestamp: number;
} & (
    | { type: 'user' | 'ai'; author: Participant; replyToId?: string; }
    | { type: 'system'; author?: never; replyToId?: never; }
);

export type ApiKey = {
  id: string;
  name: string;
  key: string;
};
