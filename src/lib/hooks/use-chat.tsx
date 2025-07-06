"use client";

import { getDecisiveAIResponse } from '@/ai/flows/ai-flow-controller';
import { getRelevantMemories, pruneMemories, summarizeAndStore } from '@/ai/flows/memory-manager';
import { useToast } from '@/hooks/use-toast';
import { HUMAN_USER, MEMORY_PRUNE_COUNT, MEMORY_PRUNE_THRESHOLD } from '@/lib/constants';
import type { AIAssistant, Message, Participant, Persona, Memory, ApiKey } from '@/lib/types';
import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode, useRef } from 'react';
import { 
  addCustomAIToFirestore, 
  deleteCustomAIFromFirestore, 
  getCustomAIsFromFirestore, 
  updateCustomAIInFirestore 
} from '../services/aiService';
import { getApiKeysAction } from '@/app/actions';


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
  // Memory management functions
  addAIMemory: (assistantId: string, content: string) => void;
  updateAIMemory: (assistantId: string, memoryId: string, newContent: string) => void;
  deleteAIMemory: (assistantId: string, memoryId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const CHAT_STORAGE_KEY = 'zen-group-chat';

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([HUMAN_USER]);
  const [customAIs, setCustomAIs] = useState<AIAssistant[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const { toast } = useToast();

  const lastProcessedMemoryId = useRef<string | null>(null);
  const lastProcessedBotResponseId = useRef<string | null>(null);

  const nextApiKeyIndexRef = useRef(0);

  const participantsRef = useRef(participants);
  participantsRef.current = participants;

  // This ref is crucial to prevent the AI response logic from running before API keys are loaded.
  const isReadyForAIResponse = useRef(false);

  // Load state from local storage and remote databases on initial mount
  useEffect(() => {
    // Load local chat state
    try {
      const storedData = localStorage.getItem(CHAT_STORAGE_KEY);
      if (storedData) {
        const { messages: storedMessages, participants: storedParticipants } = JSON.parse(storedData);
        setMessages(storedMessages || []);
        const participantsWithMemory = (storedParticipants || [HUMAN_USER]).map((p: Participant) => 
            p.isAI ? { ...p, memoryBank: p.memoryBank || [], apiKeyId: p.apiKeyId, apiKeyName: p.apiKeyName } : p
        );
        setParticipants(participantsWithMemory);
      }
    } catch (error) {
      console.error("Failed to load chat state from local storage", error);
    }
    
    // Load custom AIs from Firestore
    const loadCustomAIs = async () => {
      try {
        const aisFromDb = await getCustomAIsFromFirestore();
        setCustomAIs(aisFromDb);
      } catch (error) {
        console.error("Failed to load custom AIs from Firestore", error);
        toast({ title: "Error Loading AIs", description: "Could not fetch your custom AI assistants.", variant: "destructive" });
      }
    };

    // Load API Keys from Firestore
    const loadApiKeys = async () => {
        try {
            const keys = await getApiKeysAction();
            setApiKeys(keys);
            if (keys.length === 0) {
              toast({
                title: "No API Keys Found",
                description: "Please add a Gemini API key in the Controls sidebar to enable AI responses.",
                variant: "destructive",
                duration: 5000,
              });
            } else {
              // Now that we have keys, we are ready to process AI responses.
              isReadyForAIResponse.current = true;
            }
        } catch (error) {
            console.error("Failed to load API keys", error);
            toast({ title: "Error Loading API Keys", description: "Could not fetch API keys.", variant: "destructive" });
        }
    }

    loadCustomAIs();
    loadApiKeys();
  }, [toast]);

  // Save messages and participants to local storage whenever they change
  useEffect(() => {
    try {
      const dataToStore = JSON.stringify({ messages, participants });
      localStorage.setItem(CHAT_STORAGE_KEY, dataToStore);
    } catch (error) {
      console.error("Failed to save chat to local storage", error);
    }
  }, [messages, participants]);


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

  // Main AI processing logic - runs when messages change.
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    const aiParticipants = participantsRef.current.filter(p => p.isAI) as AIAssistant[];

    // Task 1: Summarize conversation for AI memory after an AI speaks.
    if (lastMessage.type === 'ai' && lastMessage.id !== lastProcessedMemoryId.current) {
        lastProcessedMemoryId.current = lastMessage.id;
        
        const aiAuthor = lastMessage.author as AIAssistant;
        const conversationSlice = messages.slice(-5);
        const conversationHistory = conversationSlice
            .filter(m => m.type !== 'system')
            .map(m => `${m.author.name}: ${m.text}`).join('\n');
        
        summarizeAndStore({
            conversationHistory,
            botPersona: `Tone: ${aiAuthor.persona.tone}, Expertise: ${aiAuthor.persona.expertise}. ${aiAuthor.persona.additionalInstructions || ''}`,
        }).then(({ newMemory }) => {
            if (newMemory) {
                updateMemoryAndPrune(aiAuthor.id, newMemory);
            }
        }).catch(e => {
            console.error("Failed to summarize and store memory", e);
        });
    }

    // Task 2: Get AI responses after a user speaks.
    if (lastMessage.type === 'user' && lastMessage.id !== lastProcessedBotResponseId.current) {
        // Critical check: only proceed if keys are loaded and there are AI participants.
        if (isReadyForAIResponse.current && aiParticipants.length > 0) {
            lastProcessedBotResponseId.current = lastMessage.id;

            const chatHistoryText = messages
                .slice(-5, -1) // Get 4 messages before the last one
                .filter(m => m.type !== 'system')
                .map(m => `${m.author.name}: ${m.text}`).join('\n');

            for (const ai of aiParticipants) {
                const thinkingDelay = 1000 + Math.random() * 2500;
                
                setTimeout(() => {
                    (async () => {
                        const apiKey = apiKeys.find(k => k.id === ai.apiKeyId)?.key;
                        if (!apiKey) {
                            console.warn(`No API key found for ${ai.name}, skipping response.`);
                            return;
                        }

                        setParticipantTyping(ai.id, true);
                        try {
                            const { relevantMemories } = await getRelevantMemories({
                                query: lastMessage.text,
                                memoryBank: ai.memoryBank.map(m => m.content),
                            });

                            const response = await getDecisiveAIResponse({
                                message: lastMessage.text,
                                chatHistory: chatHistoryText,
                                aiName: ai.name,
                                aiPersona: `Tone: ${ai.persona.tone}, Expertise: ${ai.persona.expertise}. ${ai.persona.additionalInstructions || ''}`,
                                apiKey: apiKey,
                                memories: relevantMemories,
                            });

                            if (response.shouldReply && response.reply) {
                                const aiMessage: Message = {
                                    id: `msg-${Date.now()}-${ai.id}`,
                                    author: ai,
                                    text: response.reply,
                                    timestamp: Date.now(),
                                    type: 'ai',
                                };
                                setMessages(prev => [...prev, aiMessage]);
                            }
                        } catch (error) {
                            console.error(`Error getting response from ${ai.name}:`, error);
                            toast({ title: `Error from ${ai.name}`, description: 'Could not generate a response.', variant: 'destructive' });
                        } finally {
                            setParticipantTyping(ai.id, false);
                        }
                    })();
                }, thinkingDelay);
            }
        }
    }
  }, [messages, apiKeys, updateMemoryAndPrune, toast]);

  const setParticipantTyping = (participantId: string, isTyping: boolean) => {
    setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, isTyping } : p));
  };

  const addAIAssistant = useCallback((assistant: AIAssistant) => {
    if (apiKeys.length === 0) {
      toast({
        title: "No API Keys Available",
        description: "Please add at least one Gemini API key before adding an AI.",
        variant: "destructive",
      });
      return;
    }
    const aiCount = participants.filter(p => p.isAI).length;
    if (aiCount >= apiKeys.length) {
      toast({
        title: "AI Limit Reached",
        description: `You can only add as many AI assistants as you have API keys. You have ${apiKeys.length} key(s) available.`,
        variant: "destructive",
      });
      return;
    }
    if (participants.some(p => p.id === assistant.id)) {
      toast({
        title: "Assistant Already Added",
        description: `${assistant.name} is already in the chat.`,
      });
      return;
    }
    
    // Assign an API key using round-robin
    const assignedKey = apiKeys[nextApiKeyIndexRef.current];
    nextApiKeyIndexRef.current = (nextApiKeyIndexRef.current + 1) % apiKeys.length;

    const newParticipant: AIAssistant = {
      ...assistant,
      persona: { ...assistant.persona },
      memoryBank: assistant.memoryBank ? [...assistant.memoryBank] : [],
      isTyping: false,
      apiKeyId: assignedKey.id,
      apiKeyName: assignedKey.name,
    };
    setParticipants(prev => [...prev, newParticipant]);
  }, [toast, participants, apiKeys]);
  
  const addCustomAIAssistant = useCallback(async (data: Omit<AIAssistant, 'id' | 'avatar' | 'isAI' | 'isCustom' | 'description' | 'memoryBank'> & {description?: string}) => {
    const newAssistantData: Omit<AIAssistant, 'id' | 'memoryBank'> = {
        ...data,
        avatar: 'https://placehold.co/40x40.png',
        isAI: true,
        isCustom: true,
        description: data.description || `Custom AI with expertise in ${data.persona.expertise}.`,
    };
    try {
        const newId = await addCustomAIToFirestore(newAssistantData);
        setCustomAIs(prev => [...prev, { ...newAssistantData, id: newId, memoryBank: [] }]);
        toast({
            title: "Custom AI Created!",
            description: `${data.name} is now available to add to the chat.`,
        });
    } catch(error) {
        console.error("Failed to create custom AI", error);
        toast({ title: "Error", description: "Failed to create custom AI.", variant: "destructive" });
    }
  }, [toast]);

  const removeAIParticipant = useCallback((assistantId: string) => {
    setParticipants(prev => prev.filter(p => p.id !== assistantId));
  }, []);

  const removeCustomAIAssistant = useCallback(async (assistantId: string) => {
    try {
        await deleteCustomAIFromFirestore(assistantId);
        setParticipants(prev => prev.filter(p => p.id !== assistantId));
        setCustomAIs(prev => prev.filter(ai => ai.id !== assistantId));
        toast({
            title: "Custom AI Deleted",
            description: "The custom AI has been permanently deleted.",
        });
    } catch(error) {
        console.error("Failed to delete custom AI", error);
        toast({ title: "Error", description: "Failed to delete custom AI.", variant: "destructive" });
    }
  }, [toast]);

  const updateAIPersona = useCallback(async (assistantId: string, persona: Persona, name?: string) => {
    const assistantToUpdate = customAIs.find(ai => ai.id === assistantId);
    try {
        if (assistantToUpdate?.isCustom) {
            await updateCustomAIInFirestore(assistantId, { name, persona });
        }
        
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
  }, [toast, customAIs]);

  const addAIMemory = useCallback((assistantId: string, content: string) => {
    setParticipants(currentParticipants => 
      currentParticipants.map(p => {
        if (p.id === assistantId && p.isAI) {
          const newMemory: Memory = { id: `mem-${Date.now()}-${Math.random()}`, content, timestamp: Date.now() };
          return { ...p, memoryBank: [...(p.memoryBank || []), newMemory] };
        }
        return p;
      })
    );
  }, []);

  const updateAIMemory = useCallback((assistantId: string, memoryId: string, newContent: string) => {
    setParticipants(currentParticipants =>
      currentParticipants.map(p => {
        if (p.id === assistantId && p.isAI) {
          const updatedMemoryBank = (p.memoryBank || []).map(mem => 
            mem.id === memoryId ? { ...mem, content: newContent } : mem
          );
          return { ...p, memoryBank: updatedMemoryBank };
        }
        return p;
      })
    );
  }, []);

  const deleteAIMemory = useCallback((assistantId: string, memoryId: string) => {
    setParticipants(currentParticipants =>
      currentParticipants.map(p => {
        if (p.id === assistantId && p.isAI) {
          return { ...p, memoryBank: (p.memoryBank || []).filter(mem => mem.id !== memoryId) };
        }
        return p;
      })
    );
  }, []);


  const handleSlashCommand = useCallback((command: string) => {
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
  }, [participants]);

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
  }, [handleSlashCommand]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setParticipants(prev => {
        return [HUMAN_USER, ...prev.filter(p => p.isAI).map(ai => ({...ai, memoryBank: []}))];
    });
    lastProcessedMemoryId.current = null;
    lastProcessedBotResponseId.current = null;
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
    addAIMemory,
    updateAIMemory,
    deleteAIMemory,
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
