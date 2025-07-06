export type Persona = {
  tone: string;
  expertise: string;
  additionalInstructions?: string;
};

export type Participant = {
  id: string;
  name: string;
  avatar: string;
  isAI: boolean;
  persona?: Persona;
  description?: string;
  isTyping?: boolean;
};

export type AIAssistant = Omit<Participant, 'isAI'> & {
  isAI: true;
  description: string;
  persona: Persona;
};

export type User = Omit<Participant, 'isAI' | 'persona' | 'description' | 'isTyping'> & {
  isAI: false;
};

export type Message = {
  id: string;
  author: Participant;
  text: string;
  timestamp: number;
};
