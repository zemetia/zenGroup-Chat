"use client";

import { selectRespondingAI } from '@/ai/flows/ai-responder-selector';
import { configureAIPersona } from '@/ai/flows/ai-persona-configurator';
import { getRelevantMemories, pruneMemories, summarizeAndStore } from '@/ai/flows/memory-manager';
import { useToast } from '@/hooks/use-toast';
import { AI_LIMIT, CUSTOM_AI_STORAGE_KEY, HUMAN_USER, MEMORY_PRUNE_COUNT, MEMORY_PRUNE_THRESHOLD } from '@/lib/constants';
import type { AIAssistant, Message, Participant, Persona, Memory } from '@/lib/types';
import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode, useRef } from 'react';

interface ChatContextType {
  messages: Message[];
  participants: Participant[];
  customAIs: AIAssistant[];
  addAIAssistant: (assistant: AIAssistant) => void;
  removeAIParticipant: (assistantId: string) => void;
  sendMessage: (text: string) => Promise<void>;
  updateAIPersona: (assistantId: string, persona: Persona, name?: string) => Promise<void>;
  clearChat: () => void;
  addCustomAIAssistant: (data: Omit<AIAssistant, 'id' | 'avatar' | 'isAI' | 'isCustom' | 'description' | 'memoryBank'> & {description?: string}) => void;
  removeCustomAIAssistant: (assistantId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const CHAT_STORAGE_KEY = 'zen-group-chat';

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([HUMAN_USER]);
  const [customAIs, setCustomAIs] = useState<AIAssistant[]>([]);
  const { toast } = useToast();
  const lastProcessedId = useRef<string | null>(null);

  const participantsRef = useRef(participants);
  participantsRef.current = participants;

  useEffect(() => {
    try {
      const storedData = localStorage.getItem(CHAT_STORAGE_KEY);
      if (storedData) {
        const { messages: storedMessages, participants: storedParticipants } = JSON.parse(storedData);
        setMessages(storedMessages || []);
        // Backwards compatibility for memoryBank
        const participantsWithMemory = (storedParticipants || [HUMAN_USER]).map((p: Participant) => 
            p.isAI ? { ...p, memoryBank: p.memoryBank || [] } : p
        );
        setParticipants(participantsWithMemory);
      }
      const storedCustomAIs = localStorage.getItem(CUSTOM_AI_STORAGE_KEY);
      if(storedCustomAIs) {
        // Backwards compatibility for memoryBank
        const customAIsWithMemory = JSON.parse(storedCustomAIs).map((ai: AIAssistant) => ({
            ...ai,
            memoryBank: ai.memoryBank || [],
        }));
        setCustomAIs(customAIsWithMemory);
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

  const updateMemoryAndPrune = useCallback(async (assistantId: string, newMemoryContent: string) => {
    const memoryItem: Memory = { id: `mem-${Date.now()}`, content: newMemoryContent, timestamp: Date.now() };

    const assistant = participantsRef.current.find(p => p.id === assistantId) as AIAssistant;
    if (!assistant) return;

    let finalMemoryBank = [...assistant.memoryBank, memoryItem];

    if (finalMemoryBank.length > MEMORY_PRUNE_THRESHOLD) {
        const memoriesToPrune = finalMemoryBank.slice(0, MEMORY_PRUNE_COUNT);
        const remainingMemories = finalMemoryBank.slice(MEMORY_PRUNE_COUNT);
        try {
            const { prunedSummary } = await pruneMemories({ memoriesToPrune: memoriesToPrune.map(m => m.content) });
            if (prunedSummary) {
                const prunedMemoryItem: Memory = { id: `mem-pruned-${Date.now()}`, content: prunedSummary, timestamp: Date.now() };
                finalMemoryBank = [prunedMemoryItem, ...remainingMemories];
            }
        } catch (e) {
            console.error("Failed to prune memories", e);
        }
    }
    
    setParticipants(currentParticipants => {
        return currentParticipants.map(p => {
            if (p.id === assistantId && p.isAI) {
                return { ...p, memoryBank: finalMemoryBank };
            }
            return p;
        });
    });
  }, []);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || lastMessage.id === lastProcessedId.current) {
      return;
    }
    lastProcessedId.current = lastMessage.id;
    
    const aiParticipants = participantsRef.current.filter(p => p.isAI) as AIAssistant[];

    const processTurn = async () => {
        if (lastMessage.type === 'user') {
            if (aiParticipants.length === 0) return;

            const recentHistory = messages.slice(-4).map(m => m.type !== 'system' ? { id: m.id, name: m.author.name, text: m.text } : null).filter(Boolean) as {id: string; name: string; text: string}[];

            try {
                const potentialResponders = await Promise.all(aiParticipants
                    .filter(ai => ai.id !== lastMessage.author.id)
                    .map(async (ai) => {
                        const { relevantMemories } = await getRelevantMemories({
                            query: lastMessage.text,
                            memoryBank: ai.memoryBank.map(m => m.content),
                        });
                        return {
                            id: ai.id,
                            name: ai.name,
                            persona: `Tone: ${ai.persona.tone}, Expertise: ${ai.persona.expertise}. ${ai.persona.additionalInstructions || ''}`,
                            memories: relevantMemories,
                        };
                    }));

                const result = await selectRespondingAI({
                    message: lastMessage.text,
                    recentHistory: recentHistory,
                    participants: potentialResponders,
                });

                if (result.responses && result.responses.length > 0) {
                    let baseDelay = 0;
                    for (const response of result.responses) {
                        const respondingAI = aiParticipants.find(p => p.id === response.responderId);
                        if (respondingAI) {
                            setParticipantTyping(respondingAI.id, true);
                            
                            const typingDuration = 1500 + Math.random() * 2000;
                            const delay = baseDelay + typingDuration;

                            setTimeout(() => {
                                const aiMessageAuthor = participantsRef.current.find(p => p.id === respondingAI.id);
                                
                                if (aiMessageAuthor) {
                                    const aiMessage: Message = {
                                        id: `msg-${Date.now()}-${respondingAI.id}`,
                                        author: aiMessageAuthor,
                                        text: response.reply,
                                        timestamp: Date.now(),
                                        replyToId: response.replyToId,
                                        type: 'ai',
                                    };
                                    setMessages(prev => [...prev, aiMessage]);
                                    setParticipantTyping(respondingAI.id, false);
                                }
                            }, delay);

                            baseDelay += 2000 + Math.random() * 1500;
                        }
                    }
                }
            } catch (error) {
                console.error(`Error processing AI response:`, error);
            }
        } else if (lastMessage.type === 'ai') {
            const aiAuthor = lastMessage.author as AIAssistant;
            const conversationSlice = messages.slice(-5);
            const conversationHistory = conversationSlice
                .filter(m => m.type !== 'system')
                .map(m => `${m.author.name}: ${m.text}`).join('\n');
            
            try {
                const { newMemory } = await summarizeAndStore({
                    conversationHistory,
                    botPersona: `Tone: ${aiAuthor.persona.tone}, Expertise: ${aiAuthor.persona.expertise}. ${aiAuthor.persona.additionalInstructions || ''}`,
                });

                if (newMemory) {
                    await updateMemoryAndPrune(aiAuthor.id, newMemory);
                }
            } catch (e) {
                console.error("Failed to summarize and store memory", e);
            }
        }
    };
    
    processTurn();
  }, [messages, updateMemoryAndPrune]);

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
      return [...prev, { ...assistant, memoryBank: assistant.memoryBank || [] }];
    });
  }, [toast]);
  
  const addCustomAIAssistant = useCallback((data: Omit<AIAssistant, 'id' | 'avatar' | 'isAI' | 'isCustom' | 'description' | 'memoryBank'> & {description?: string}) => {
    const newAssistant: AIAssistant = {
        ...data,
        id: `custom-ai-${Date.now()}`,
        avatar: 'https://placehold.co/40x40.png',
        isAI: true,
        isCustom: true,
        description: data.description || `Custom AI with expertise in ${data.persona.expertise}.`,
        memoryBank: [],
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

  const handleSlashCommand = (command: string) => {
    const [cmd, ...args] = command.slice(1).split(' ');
    const botName = args.join(' ');

    const bot = participants.find(p => p.isAI && p.name.toLowerCase() === botName.toLowerCase()) as AIAssistant;

    if (cmd === 'show_memories') {
        let text;
        if (bot && bot.memoryBank && bot.memoryBank.length > 0) {
            text = `Memory bank for ${bot.name}:\n` + bot.memoryBank.map((mem, i) => `${i + 1}. ${mem.content}`).join('\n');
        } else {
            text = bot ? `${bot.name} has no memories.` : `Bot "${botName}" not found in this chat.`;
        }
        const systemMessage: Message = { id: `msg-${Date.now()}`, text, timestamp: Date.now(), type: 'system' };
        setMessages(prev => [...prev, systemMessage]);
    } else if (cmd === 'clear_memories') {
        if (bot) {
            setParticipants(prev => prev.map(p => p.id === bot.id ? { ...p, memoryBank: [] } : p));
            const systemMessage: Message = { id: `msg-${Date.now()}`, text: `Memory bank for ${bot.name} has been cleared.`, timestamp: Date.now(), type: 'system' };
            setMessages(prev => [...prev, systemMessage]);
        } else {
            const systemMessage: Message = { id: `msg-${Date.now()}`, text: `Bot "${botName}" not found in this chat.`, timestamp: Date.now(), type: 'system' };
            setMessages(prev => [...prev, systemMessage]);
        }
    }
  }

  const sendMessage = useCallback(async (text: string) => {
    if (text.startsWith('/')) {
        handleSlashCommand(text);
        return;
    }
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      author: HUMAN_USER,
      text,
      timestamp: Date.now(),
      type: 'user',
    };
    setMessages(prev => [...prev, newMessage]);
  }, [participants]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setParticipants(prev => {
        return [HUMAN_USER, ...prev.filter(p => p.isAI).map(ai => ({...ai, memoryBank: []}))];
    });
    lastProcessedId.current = null;
    // Don't remove participants from local storage on clear, just reset their memory
    const dataToStore = JSON.stringify({ messages: [], participants: participantsRef.current.map(p => p.isAI ? {...p, memoryBank: []} : p) });
    localStorage.setItem(CHAT_STORAGE_KEY, dataToStore);
    
    toast({
        title: "Chat Cleared",
        description: "The chat history has been reset."
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
