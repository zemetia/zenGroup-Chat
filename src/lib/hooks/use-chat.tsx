"use client";

import { controlAi } from '@/ai/flows/ai-flow-controller';
import { configureAIPersona } from '@/ai/flows/ai-persona-configurator';
import { useToast } from '@/hooks/use-toast';
import { AI_LIMIT, CUSTOM_AI_STORAGE_KEY, HUMAN_USER } from '@/lib/constants';
import type { AIAssistant, Message, Participant, Persona } from '@/lib/types';
import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

interface ChatContextType {
  messages: Message[];
  participants: Participant[];
  customAIs: AIAssistant[];
  addAIAssistant: (assistant: AIAssistant) => void;
  removeAIParticipant: (assistantId: string) => void;
  sendMessage: (text: string) => Promise<void>;
  updateAIPersona: (assistantId: string, persona: Persona, name?: string) => Promise<void>;
  clearChat: () => void;
  addCustomAIAssistant: (data: Omit<AIAssistant, 'id' | 'avatar' | 'isAI' | 'isCustom' | 'description'> & {description?: string}) => void;
  removeCustomAIAssistant: (assistantId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const CHAT_STORAGE_KEY = 'zen-group-chat';

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([HUMAN_USER]);
  const [customAIs, setCustomAIs] = useState<AIAssistant[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(CHAT_STORAGE_KEY);
      if (storedData) {
        const { messages: storedMessages, participants: storedParticipants } = JSON.parse(storedData);
        setMessages(storedMessages || []);
        setParticipants(storedParticipants || [HUMAN_USER]);
      }
      const storedCustomAIs = localStorage.getItem(CUSTOM_AI_STORAGE_KEY);
      if(storedCustomAIs) {
        setCustomAIs(JSON.parse(storedCustomAIs));
      }
    } catch (error) {
      console.error("Failed to load data from local storage", error);
    }
  }, []);

  useEffect(() => {
    try {
      const dataToStore = JSON.stringify({ messages, participants });
      localStorage.setItem(CHAT_STORAGE_KEY, dataToStore);
      const customAIsToStore = JSON.stringify(customAIs);
      localStorage.setItem(CUSTOM_AI_STORAGE_KEY, customAIsToStore);
    } catch (error)
 {
      console.error("Failed to save chat to local storage", error);
    }
  }, [messages, participants, customAIs]);

  const setParticipantTyping = (participantId: string, isTyping: boolean) => {
    setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, isTyping } : p));
  };

  const addAIAssistant = useCallback((assistant: AIAssistant) => {
    setParticipants(prev => {
      const aiCount = prev.filter(p => p.isAI).length;
      if (aiCount >= AI_LIMIT) {
        toast({
          title: "AI Limit Reached",
          description: `You can only add up to ${AI_LIMIT} AI assistants to the chat.`,
          variant: "destructive",
        });
        return prev;
      }
      if (prev.find(p => p.id === assistant.id)) {
        toast({
          title: "Assistant Already Added",
          description: `${assistant.name} is already in the chat.`,
        });
        return prev;
      }
      return [...prev, assistant];
    });
  }, [toast]);
  
  const addCustomAIAssistant = useCallback((data: Omit<AIAssistant, 'id' | 'avatar' | 'isAI' | 'isCustom' | 'description'> & {description?: string}) => {
    const newAssistant: AIAssistant = {
        ...data,
        id: `custom-ai-${Date.now()}`,
        avatar: 'https://placehold.co/40x40.png',
        isAI: true,
        isCustom: true,
        description: data.description || `Custom AI with expertise in ${data.persona.expertise}.`
    };
    setCustomAIs(prev => [...prev, newAssistant]);
    toast({
        title: "Custom AI Created!",
        description: `${data.name} is now available to add to the chat.`,
    });
  }, [toast]);

  const removeAIParticipant = useCallback((assistantId: string) => {
    setParticipants(prev => prev.filter(p => p.id !== assistantId));
  }, []);

  const removeCustomAIAssistant = useCallback((assistantId: string) => {
    setParticipants(prev => prev.filter(p => p.id !== assistantId));
    setCustomAIs(prev => prev.filter(ai => ai.id !== assistantId));
    toast({
        title: "Custom AI Deleted",
        description: "The custom AI has been permanently deleted.",
    });
  }, [toast]);

  const updateAIPersona = useCallback(async (assistantId: string, persona: Persona, name?: string) => {
    try {
        await configureAIPersona(persona);
        
        const updateLogic = (p: Participant) => {
          if (p.id === assistantId) {
            return { ...p, persona, name: name || p.name };
          }
          return p;
        }

        setParticipants(prev => prev.map(updateLogic));
        setCustomAIs(prev => prev.map(p => updateLogic(p) as AIAssistant));
        
        toast({
            title: "AI Persona Updated",
            description: `The AI assistant has been successfully updated.`,
        });
    } catch (error) {
        console.error("Failed to update AI persona:", error);
        toast({
            title: "Error",
            description: "Failed to update AI persona. Please try again.",
            variant: "destructive",
        });
    }
  }, [toast]);

  const sendMessage = useCallback(async (text: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      author: HUMAN_USER,
      text,
      timestamp: Date.now(),
    };
    
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);

    const activeAIs = participants.filter(p => p.isAI) as AIAssistant[];
    const chatHistory = updatedMessages.slice(-10).map(m => `${m.author.name}: ${m.text}`).join('\n');

    activeAIs.forEach(ai => setParticipantTyping(ai.id, true));

    const aiResponses = await Promise.allSettled(
      activeAIs.map(ai => 
        controlAi({
          message: text,
          chatHistory,
          aiName: ai.name,
          aiPersona: `Tone: ${ai.persona.tone}, Expertise: ${ai.persona.expertise}. ${ai.persona.additionalInstructions || ''}`,
        }).finally(() => {
          setParticipantTyping(ai.id, false);
        })
      )
    );

    const newAIMessages = aiResponses.reduce<Message[]>((acc, result, index) => {
      if (result.status === 'fulfilled' && result.value.shouldReply && result.value.reply) {
        const aiAuthor = activeAIs[index];
        acc.push({
          id: `msg-${Date.now()}-${aiAuthor.id}`,
          author: aiAuthor,
          text: result.value.reply,
          timestamp: Date.now(),
        });
      }
      return acc;
    }, []);

    if (newAIMessages.length > 0) {
      setMessages(prev => [...prev, ...newAIMessages]);
    }

  }, [messages, participants]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setParticipants([HUMAN_USER]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
    toast({
        title: "Chat Cleared",
        description: "The chat history and participants have been reset."
    });
  }, [toast]);

  const value = {
    messages,
    participants,
    customAIs,
    addAIAssistant,
    removeAIParticipant,
    sendMessage,
    updateAIPersona,
    clearChat,
    addCustomAIAssistant,
    removeCustomAIAssistant,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
