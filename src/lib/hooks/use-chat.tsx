"use client";

import { controlAi } from '@/ai/flows/ai-flow-controller';
import { configureAIPersona } from '@/ai/flows/ai-persona-configurator';
import { useToast } from '@/hooks/use-toast';
import { AI_LIMIT, HUMAN_USER } from '@/lib/constants';
import type { AIAssistant, Message, Participant, Persona } from '@/lib/types';
import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

interface ChatContextType {
  messages: Message[];
  participants: Participant[];
  addAIAssistant: (assistant: AIAssistant) => void;
  removeAIParticipant: (assistantId: string) => void;
  sendMessage: (text: string) => Promise<void>;
  updateAIPersona: (assistantId: string, persona: Persona) => Promise<void>;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const CHAT_STORAGE_KEY = 'zen-group-chat';

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([HUMAN_USER]);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(CHAT_STORAGE_KEY);
      if (storedData) {
        const { messages: storedMessages, participants: storedParticipants } = JSON.parse(storedData);
        setMessages(storedMessages || []);
        setParticipants(storedParticipants || [HUMAN_USER]);
      }
    } catch (error) {
      console.error("Failed to load chat from local storage", error);
    }
  }, []);

  useEffect(() => {
    try {
      const dataToStore = JSON.stringify({ messages, participants });
      localStorage.setItem(CHAT_STORAGE_KEY, dataToStore);
    } catch (error) {
      console.error("Failed to save chat to local storage", error);
    }
  }, [messages, participants]);

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

  const removeAIParticipant = useCallback((assistantId: string) => {
    setParticipants(prev => prev.filter(p => p.id !== assistantId));
  }, []);

  const updateAIPersona = useCallback(async (assistantId: string, persona: Persona) => {
    try {
        await configureAIPersona(persona);
        setParticipants(prev =>
            prev.map(p => (p.id === assistantId ? { ...p, persona } : p))
        );
        toast({
            title: "AI Persona Updated",
            description: `The persona for the AI assistant has been successfully updated.`,
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

  }, [messages, participants, toast]);

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
    addAIAssistant,
    removeAIParticipant,
    sendMessage,
    updateAIPersona,
    clearChat,
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
