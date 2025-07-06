"use client";

import { controlAiFlow } from '@/ai/flows/ai-flow-controller';
import { pruneMemories, summarizeAndStore } from '@/ai/flows/memory-manager';
import { useToast } from '@/hooks/use-toast';
import { AI_LIMIT, AVAILABLE_AI_ASSISTANTS, HUMAN_USER, MEMORY_PRUNE_COUNT, MEMORY_PRUNE_THRESHOLD } from '@/lib/constants';
import type { AIAssistant, Message, Participant, Persona, Memory } from '@/lib/types';
import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode, useRef } from 'react';
import { 
  addCustomAIToFirestore, 
  deleteCustomAIFromFirestore, 
  getCustomAIsFromFirestore, 
  updateCustomAIInFirestore 
} from '../services/aiService';


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
const MAX_REPLY_DEPTH = 2; // Prevents infinite bot-to-bot conversations

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([HUMAN_USER]);
  const [customAIs, setCustomAIs] = useState<AIAssistant[]>([]);
  const { toast } = useToast();

  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const participantsRef = useRef(participants);
  participantsRef.current = participants;

  // Load and sanitize state from local storage and Firestore on initial mount
  useEffect(() => {
    const loadState = async () => {
      let loadedParticipants: Participant[] = [HUMAN_USER];
      let loadedMessages: Message[] = [];
      let allAvailableAIs: AIAssistant[] = [...AVAILABLE_AI_ASSISTANTS];

      // 1. Load Custom AIs from Firestore
      try {
        const customAIsFromDb = await getCustomAIsFromFirestore();
        setCustomAIs(customAIsFromDb);
        allAvailableAIs.push(...customAIsFromDb);
      } catch (error) {
        console.error("Failed to load custom AIs from Firestore", error);
        toast({ title: "Error Loading AIs", description: "Could not fetch custom AI assistants.", variant: "destructive" });
      }

      // 2. Load chat state from local storage
      try {
        const storedData = localStorage.getItem(CHAT_STORAGE_KEY);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          loadedParticipants = parsedData.participants || [HUMAN_USER];
          loadedMessages = parsedData.messages || [];
        }
      } catch (error) {
        console.error("Failed to parse chat state from local storage", error);
        localStorage.removeItem(CHAT_STORAGE_KEY); // Clear corrupted data
      }

      // 3. Sanitize and Reconcile Participants
      const validParticipants: Participant[] = loadedParticipants
        .map(p => {
          if (!p || !p.id) return null;
          if (p.isAI) {
            const fullAIData = allAvailableAIs.find(ai => ai.id === p.id);
            if (fullAIData) {
              return { ...fullAIData, memoryBank: p.memoryBank || [], isTyping: false }; // Restore full data, keep memory
            }
            return null; // This AI doesn't exist anymore, discard
          }
          if (p.id === HUMAN_USER.id) {
            return HUMAN_USER; // It's the human user
          }
          return null; // Unknown participant
        })
        .filter((p): p is Participant => p !== null);

      if (!validParticipants.find(p => !p.isAI)) {
        validParticipants.unshift(HUMAN_USER);
      }
      setParticipants(validParticipants);
      participantsRef.current = validParticipants;

      // 4. Sanitize and Reconcile Messages
      const sanitizedMessages = loadedMessages.map(msg => {
          if (!msg || !msg.id || !msg.type) return null;
          if (msg.type === 'system') return msg;
          
          if (!msg.author || typeof msg.author.id === 'undefined') {
              if (msg.type === 'user') {
                  msg.author = HUMAN_USER;
              } else {
                  return null; // Can't determine author, discard
              }
          }
          
          const participantData = validParticipants.find(p => p.id === msg.author.id);
          if (!participantData) return null; // Author not in chat, discard message
          
          msg.author = participantData; // Ensure author object is the full, correct one
          return msg;
      }).filter((m): m is Message => m !== null);

      setMessages(sanitizedMessages);
      messagesRef.current = sanitizedMessages;
    };

    loadState();
  }, [toast]);

  // Save state to local storage whenever it changes
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

    setParticipants(currentParticipants => {
        const assistantIndex = currentParticipants.findIndex(p => p.id === assistantId);
        if (assistantIndex === -1) return currentParticipants;

        const assistant = currentParticipants[assistantIndex] as AIAssistant;
        let finalMemoryBank = [...(assistant.memoryBank || []), memoryItem];

        if (finalMemoryBank.length > MEMORY_PRUNE_THRESHOLD) {
            const memoriesToPrune = finalMemoryBank.slice(0, MEMORY_PRUNE_COUNT);
            const remainingMemories = finalMemoryBank.slice(MEMORY_PRUNE_COUNT);
            pruneMemories({ memoriesToPrune: memoriesToPrune.map(m => m.content) })
                .then(({ prunedSummary }) => {
                    if (prunedSummary) {
                        const prunedMemoryItem: Memory = { id: `mem-pruned-${Date.now()}`, content: prunedSummary, timestamp: Date.now() };
                        const newMemoryBank = [prunedMemoryItem, ...remainingMemories];
                        setParticipants(prev => prev.map(p => p.id === assistantId ? { ...p, memoryBank: newMemoryBank } : p));
                    }
                }).catch(e => console.error("Failed to prune memories", e));
        }
        
        const newParticipants = [...currentParticipants];
        newParticipants[assistantIndex] = { ...assistant, memoryBank: finalMemoryBank };
        return newParticipants;
    });
  }, []);

  const summarizeLastMessage = useCallback(async (message: Message) => {
    if (message.type !== 'ai' || !message.author.isAI) return;
    const aiAuthor = message.author;
    const conversationSlice = messagesRef.current.slice(-5);
    const conversationHistory = conversationSlice
      .filter(m => m.type !== 'system' && m.author)
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
  }, [updateMemoryAndPrune]);
  
  const processAIResponses = useCallback(async (triggeringMessage: Message, depth = 0) => {
    if (depth > MAX_REPLY_DEPTH) return;
    if (triggeringMessage.type === 'system' || !triggeringMessage.author) return;

    const aiParticipants = participantsRef.current.filter(p => p.isAI) as AIAssistant[];
    if (aiParticipants.length === 0) return;

    const recentHistory = messagesRef.current
        .slice(-4)
        .filter(m => m.type !== 'system' && m.author)
        .map(m => `${m.author.name}: ${m.text}`).join('\n');

    const decisions = await Promise.all(
      aiParticipants.map(async (ai) => {
        try {
          const memories = (ai.memoryBank || []).map(m => m.content);
          const decision = await controlAiFlow({
            messageToConsider: {
              authorName: triggeringMessage.author.name,
              text: triggeringMessage.text,
            },
            recentHistory,
            aiParticipant: {
              name: ai.name,
              persona: `Tone: ${ai.persona.tone}, Expertise: ${ai.persona.expertise}. ${ai.persona.additionalInstructions || ''}`,
              memories: memories,
            }
          });
          return { ...decision, ai };
        } catch (error) {
          console.error(`Error getting decision for ${ai.name}:`, error);
          return { shouldReply: false, ai };
        }
      })
    );

    const replies = decisions.filter(d => d.shouldReply && d.reply);

    for (const reply of replies) {
      const respondingAI = reply.ai;
      
      const thinkingDelay = 500 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, thinkingDelay));
      setParticipants(prev => prev.map(p => p.id === respondingAI.id ? { ...p, isTyping: true } : p));

      const typingDuration = 1000 + Math.random() * 2000;
      await new Promise(resolve => setTimeout(resolve, typingDuration));
      
      const aiMessage: Message = {
        id: `msg-${Date.now()}-${respondingAI.id}`,
        author: participantsRef.current.find(p => p.id === respondingAI.id)!,
        text: reply.reply!,
        timestamp: Date.now(),
        type: 'ai',
      };
      
      setParticipants(prev => prev.map(p => p.id === respondingAI.id ? { ...p, isTyping: false } : p));
      setMessages(prev => [...prev, aiMessage]);
      
      await summarizeLastMessage(aiMessage);
      await processAIResponses(aiMessage, depth + 1);
    }
  }, [summarizeLastMessage]);
  
  const sendMessage = useCallback(async (text: string) => {
    if (text.startsWith('/')) { return; }
    
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      author: HUMAN_USER,
      text,
      timestamp: Date.now(),
      type: 'user',
    };
    
    setMessages(prev => [...prev, newMessage]);
    await processAIResponses(newMessage);

  }, [processAIResponses]);
  
  const clearChat = useCallback(() => {
    setMessages([]);
    setParticipants(prev => prev.map(p => p.isAI ? { ...p, memoryBank: [] } : p));
    localStorage.removeItem(CHAT_STORAGE_KEY);
    toast({
        title: "Chat Cleared",
        description: "The chat history and AI memories have been reset."
    });
  }, [toast]);

  const addAIAssistant = useCallback((assistant: AIAssistant) => {
    setParticipants(prev => {
      const aiCount = prev.filter(p => p.isAI).length;
      if (aiCount >= AI_LIMIT) {
        toast({ title: "AI Limit Reached", description: `You can only add up to ${AI_LIMIT} AI assistants.`, variant: "destructive" });
        return prev;
      }
      if (prev.find(p => p.id === assistant.id)) {
        toast({ title: "Assistant Already Added", description: `${assistant.name} is already in the chat.` });
        return prev;
      }
      return [...prev, { ...assistant, memoryBank: assistant.memoryBank || [] }];
    });
  }, [toast]);

  const removeAIParticipant = useCallback((assistantId: string) => {
    setParticipants(prev => prev.filter(p => p.id !== assistantId));
  }, []);

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
        const newAI = { ...newAssistantData, id: newId, memoryBank: [] };
        setCustomAIs(prev => [...prev, newAI]);
        toast({ title: "Custom AI Created!", description: `${data.name} is now available.` });
    } catch(error) {
        console.error("Failed to create custom AI", error);
        toast({ title: "Error", description: "Failed to create custom AI.", variant: "destructive" });
    }
  }, [toast]);

  const removeCustomAIAssistant = useCallback(async (assistantId: string) => {
    try {
        await deleteCustomAIFromFirestore(assistantId);
        setParticipants(prev => prev.filter(p => p.id !== assistantId));
        setCustomAIs(prev => prev.filter(ai => ai.id !== assistantId));
        toast({ title: "Custom AI Deleted", description: "The custom AI has been permanently deleted." });
    } catch(error) {
        console.error("Failed to delete custom AI", error);
        toast({ title: "Error", description: "Failed to delete custom AI.", variant: "destructive" });
    }
  }, [toast]);

  const updateAIPersona = useCallback(async (assistantId: string, persona: Persona, name?: string) => {
    const allAIs = [...customAIs, ...AVAILABLE_AI_ASSISTANTS];
    const assistantToUpdate = allAIs.find(ai => ai.id === assistantId);
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
        
        toast({ title: "AI Persona Updated", description: `The AI assistant has been successfully updated.` });
    } catch (error) {
        console.error("Failed to update AI persona:", error);
        toast({ title: "Error", description: "Failed to update AI persona.", variant: "destructive" });
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
