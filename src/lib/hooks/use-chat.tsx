
'use client';

import { controlAiFlow } from '@/ai/flows/ai-flow-controller';
import { pruneMemories, summarizeAndStore } from '@/ai/flows/memory-manager';
import {
  addMessageToGroupAction,
  createChatGroupAction,
  deleteChatGroupAction,
  getChatGroupsAction,
  getMessagesForGroupAction,
  getParticipantsForGroupAction,
  updateChatGroupAction,
  updateParticipantsForGroupAction,
} from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import {
  AI_LIMIT,
  HUMAN_USER,
  MEMORY_PRUNE_COUNT,
  MEMORY_PRUNE_THRESHOLD,
} from '@/lib/constants';
import type {
  AIAssistant,
  ChatGroup,
  Message,
  Memory,
  Participant,
  Persona,
} from '@/lib/types';
import { getRandomIconName } from '../utils';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  useRef,
} from 'react';
import {
  addCustomAIToFirestore,
  deleteCustomAIFromFirestore,
  getCustomAIsFromFirestore,
  updateCustomAIInFirestore,
} from '../services/aiService';
import { produce } from 'immer';

interface ChatContextType {
  groups: ChatGroup[];
  activeGroup: ChatGroup | null;
  messages: Message[];
  participants: Participant[];
  customAIs: AIAssistant[];
  isLoading: boolean;
  setActiveGroupId: (id: string) => void;
  createChatGroup: (name: string) => Promise<void>;
  updateChatGroup: (id: string, updates: { name?: string; icon?: string, description?: string }) => Promise<void>;
  deleteChatGroup: (id: string) => Promise<void>;
  addAIAssistant: (assistant: AIAssistant) => void;
  removeAIParticipant: (assistantId: string) => void;
  sendMessage: (text: string) => Promise<void>;
  updateAIPersona: (
    assistantId: string,
    persona: Persona,
    name?: string
  ) => Promise<void>;
  addCustomAIAssistant: (
    data: Omit<
      AIAssistant,
      'id' | 'avatar' | 'isAI' | 'isCustom' | 'description' | 'memoryBank'
    > & { description?: string }
  ) => void;
  removeCustomAIAssistant: (assistantId: string) => void;
  addAIMemory: (assistantId: string, content: string) => void;
  updateAIMemory: (
    assistantId: string,
    memoryId: string,
    newContent: string
  ) => void;
  deleteAIMemory: (assistantId: string, memoryId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const MAX_REPLY_DEPTH = 2; // Prevents infinite bot-to-bot conversations

export function ChatProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [customAIs, setCustomAIs] = useState<AIAssistant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();

  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const participantsRef = useRef(participants);
  participantsRef.current = participants;

  // Load custom AIs from Firestore on initial mount
  useEffect(() => {
    const loadCustomAIs = async () => {
      try {
        const customAIsFromDb = await getCustomAIsFromFirestore();
        setCustomAIs(customAIsFromDb);
      } catch (error) {
        console.error('Failed to load custom AIs from Firestore', error);
        toast({
          title: 'Error Loading AIs',
          description: 'Could not fetch custom AI assistants.',
          variant: 'destructive',
        });
      }
    };
    loadCustomAIs();
  }, [toast]);

  // Load chat groups on initial mount
  useEffect(() => {
    const loadGroups = async () => {
      setIsLoading(true);
      try {
        const fetchedGroups = await getChatGroupsAction();
        if (fetchedGroups.length > 0) {
          setGroups(fetchedGroups);
          setActiveGroupId(fetchedGroups[0].id);
        } else {
          // No groups exist, create a default one
          const newGroup = await createChatGroupAction(
            'General Chat',
            getRandomIconName()
          );
          setGroups([newGroup]);
          setActiveGroupId(newGroup.id);
        }
      } catch (error) {
        console.error('Failed to load chat groups', error);
        toast({
          title: 'Error',
          description: 'Could not load your conversations.',
          variant: 'destructive',
        });
      }
    };
    loadGroups();
  }, [toast]);

  // Load messages and participants when active group changes
  useEffect(() => {
    if (!activeGroupId) {
      setMessages([]);
      setParticipants([]);
      setIsLoading(false);
      return;
    };

    const loadGroupData = async () => {
      setIsLoading(true);
      try {
        const [groupMessages, groupParticipants] = await Promise.all([
          getMessagesForGroupAction(activeGroupId),
          getParticipantsForGroupAction(activeGroupId),
        ]);

        // Sanitize participants to ensure they exist and have full data
        const allAvailableAIs = [...customAIs];
        const validParticipants = (groupParticipants.length > 0 ? groupParticipants : [HUMAN_USER]).map(p => {
          if (!p || !p.id) return null;
          if (p.id === HUMAN_USER.id) return HUMAN_USER;
          if (p.isAI) {
            const fullAIData = allAvailableAIs.find(ai => ai.id === p.id);
            return fullAIData ? { ...fullAIData, memoryBank: p.memoryBank || [], isTyping: false } : null;
          }
          return null;
        }).filter((p): p is Participant => p !== null);
        
        // Ensure user is always a participant
        if (!validParticipants.some(p => p.id === HUMAN_USER.id)) {
            validParticipants.unshift(HUMAN_USER);
        }

        setParticipants(validParticipants);

        // Sanitize messages to map correct author object
        const sanitizedMessages = groupMessages.map(msg => {
            if (msg.type === 'system') return msg;
            const author = validParticipants.find(p => p.id === msg.author.id);
            return author ? { ...msg, author } : null;
        }).filter((m): m is Message => m !== null);
        
        setMessages(sanitizedMessages);

      } catch (error) {
        console.error(`Failed to load data for group ${activeGroupId}`, error);
        toast({
          title: 'Error Loading Chat',
          description: 'Could not load messages for this conversation.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadGroupData();
  }, [activeGroupId, customAIs, toast]);

  const updateMemoryAndPrune = useCallback(
    async (assistantId: string, newMemoryContent: string) => {
      if (!activeGroupId) return;
  
      const memoryItem: Memory = {
        id: `mem-${Date.now()}`,
        content: newMemoryContent,
        timestamp: Date.now(),
      };
  
      // Step 1: Add new memory and get the next state
      const nextParticipants = produce(participantsRef.current, draft => {
        const assistant = draft.find(p => p.id === assistantId) as AIAssistant | undefined;
        if (assistant) {
          assistant.memoryBank = assistant.memoryBank || [];
          assistant.memoryBank.push(memoryItem);
        }
      });
      
      // Update state and then firestore
      setParticipants(nextParticipants);
      await updateParticipantsForGroupAction(activeGroupId, nextParticipants);
  
      // Step 2: Check for pruning
      const assistantForPruning = nextParticipants.find(p => p.id === assistantId) as AIAssistant | undefined;
      const shouldPrune = assistantForPruning && assistantForPruning.memoryBank.length > MEMORY_PRUNE_THRESHOLD;
  
      if (shouldPrune) {
        const memoriesToPrune = assistantForPruning.memoryBank.slice(0, MEMORY_PRUNE_COUNT);
        const remainingMemories = assistantForPruning.memoryBank.slice(MEMORY_PRUNE_COUNT);
        
        try {
          // Step 3: Call async function with plain data to get summary
          const { prunedSummary } = await pruneMemories({ memoriesToPrune: memoriesToPrune.map(m => m.content) });
  
          if (prunedSummary) {
            const prunedMemoryItem: Memory = {
              id: `mem-pruned-${Date.now()}`,
              content: prunedSummary,
              timestamp: Date.now(),
            };
            
            // Step 4: Calculate the final state after pruning
            const finalParticipantsState = produce(nextParticipants, draft => {
              const finalAssistant = draft.find(p => p.id === assistantId) as AIAssistant | undefined;
              if (finalAssistant) {
                finalAssistant.memoryBank = [prunedMemoryItem, ...remainingMemories];
              }
            });

            // Step 5: Update state and firestore again with the pruned state
            setParticipants(finalParticipantsState);
            await updateParticipantsForGroupAction(activeGroupId, finalParticipantsState);
          }
        } catch (e) {
          console.error("Failed to prune memories", e);
        }
      }
    },
    [activeGroupId]
  );

  const summarizeLastMessage = useCallback(
    async (message: Message) => {
      if (message.type !== 'ai' || !message.author.isAI) return;
      const aiAuthor = message.author;
      const conversationSlice = messagesRef.current.slice(-5);
      const conversationHistory = conversationSlice
        .filter(m => m.type !== 'system' && m.author)
        .map(m => `${m.author.name}: ${m.text}`)
        .join('\n');

      try {
        const { newMemory } = await summarizeAndStore({
          conversationHistory,
          botPersona: `Tone: ${aiAuthor.persona.tone}, Expertise: ${aiAuthor.persona.expertise}. ${aiAuthor.persona.additionalInstructions || ''}`,
        });
        if (newMemory) {
          await updateMemoryAndPrune(aiAuthor.id, newMemory);
        }
      } catch (e) {
        console.error('Failed to summarize and store memory', e);
      }
    },
    [updateMemoryAndPrune]
  );

  const processAIResponses = useCallback(
    async (triggeringMessage: Message, depth = 0) => {
      if (depth > MAX_REPLY_DEPTH || !activeGroupId) return;
      if (triggeringMessage.type === 'system' || !triggeringMessage.author)
        return;

      const aiParticipants = participantsRef.current.filter(
        p => p.isAI
      ) as AIAssistant[];
      if (aiParticipants.length === 0) return;

      const recentHistory = messagesRef.current
        .slice(-4)
        .filter(m => m.type !== 'system' && m.author)
        .map(m => `${m.author.name}: ${m.text}`)
        .join('\n');

      const decisions = await Promise.all(
        aiParticipants.map(async ai => {
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
                persona: `Tone: ${ai.persona.tone}, Expertise: ${
                  ai.persona.expertise
                }. ${ai.persona.additionalInstructions || ''}`,
                memories: memories,
              },
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

        const thinkingDelay = 500 + Math.random() * 1500;
        await new Promise(resolve => setTimeout(resolve, thinkingDelay));
        setParticipants(prev =>
          produce(prev, draft => {
            const p = draft.find(p => p.id === respondingAI.id);
            if (p) p.isTyping = true;
          })
        );

        const typingDuration = 1500 + Math.random() * 3500;
        await new Promise(resolve => setTimeout(resolve, typingDuration));

        const aiMessage: Message = {
          id: `msg-${Date.now()}-${respondingAI.id}`,
          author: participantsRef.current.find(p => p.id === respondingAI.id)!,
          text: reply.reply!,
          timestamp: Date.now(),
          type: 'ai',
          replyToId: triggeringMessage.id,
        };
        
        setParticipants(prev => produce(prev, draft => {
            const p = draft.find(p => p.id === respondingAI.id);
            if (p) p.isTyping = false;
        }));
        
        setMessages(prev => [...prev, aiMessage]);
        
        await addMessageToGroupAction(activeGroupId, aiMessage);
        await summarizeLastMessage(aiMessage);
        await processAIResponses(aiMessage, depth + 1);
      }
    },
    [activeGroupId, summarizeLastMessage]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!activeGroupId) return;

      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        author: HUMAN_USER,
        text,
        timestamp: Date.now(),
        type: 'user',
      };
      setMessages(prev => [...prev, newMessage]);

      // First, save the user's message to the database.
      await addMessageToGroupAction(activeGroupId, newMessage);
      
      // Then, trigger the AI response flow without awaiting it.
      // This allows the UI to become responsive immediately.
      processAIResponses(newMessage);
    },
    [activeGroupId, processAIResponses]
  );
  
  const createChatGroup = useCallback(async (name: string) => {
      try {
          const newGroup = await createChatGroupAction(name, getRandomIconName());
          setGroups(prev => [...prev, newGroup]);
          setActiveGroupId(newGroup.id);
          toast({ title: "Conversation Created", description: `"${name}" has been created.` });
      } catch (error) {
          console.error("Failed to create group", error);
          toast({ title: "Error", description: "Could not create the conversation.", variant: "destructive" });
      }
  }, [toast]);

  const updateChatGroup = useCallback(async (id: string, updates: { name?: string; icon?: string; description?: string }) => {
      try {
        await updateChatGroupAction(id, updates);
        setGroups(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
        toast({ title: "Conversation Updated" });
      } catch (error) {
          console.error("Failed to update group", error);
          toast({ title: "Error", description: "Could not update the conversation.", variant: "destructive" });
      }
  }, [toast]);

  const deleteChatGroup = useCallback(async (id: string) => {
      const remainingGroups = groups.filter(g => g.id !== id);
      try {
          await deleteChatGroupAction(id);
          setGroups(remainingGroups);
          if (activeGroupId === id) {
              setActiveGroupId(remainingGroups.length > 0 ? remainingGroups[0].id : null);
          }
          toast({ title: "Conversation Deleted" });
      } catch (error) {
          console.error("Failed to delete group", error);
          toast({ title: "Error", description: "Could not delete the conversation.", variant: "destructive" });
      }
  }, [toast, groups, activeGroupId]);

  const addAIAssistant = useCallback(
    async (assistant: AIAssistant) => {
        if (!activeGroupId) return;
      const aiCount = participants.filter(p => p.isAI).length;
      if (aiCount >= AI_LIMIT) {
        toast({
          title: 'AI Limit Reached',
          description: `You can only add up to ${AI_LIMIT} AI assistants.`,
          variant: 'destructive',
        });
        return;
      }
      if (participants.find(p => p.id === assistant.id)) {
        toast({
          title: 'Assistant Already Added',
          description: `${assistant.name} is already in the chat.`,
        });
        return;
      }
      const newParticipants = [...participants, { ...assistant, memoryBank: [] }];
      setParticipants(newParticipants);
      await updateParticipantsForGroupAction(activeGroupId, newParticipants);
    },
    [activeGroupId, participants, toast]
  );

  const removeAIParticipant = useCallback(
    async (assistantId: string) => {
        if (!activeGroupId) return;
      const newParticipants = participants.filter(p => p.id !== assistantId)
      setParticipants(newParticipants);
      await updateParticipantsForGroupAction(activeGroupId, newParticipants);
    },
    [activeGroupId, participants]
  );

  const addCustomAIAssistant = useCallback(
    async (
      data: Omit<
        AIAssistant,
        'id' | 'avatar' | 'isAI' | 'isCustom' | 'description' | 'memoryBank'
      > & { description?: string }
    ) => {
      const newAssistantData: Omit<AIAssistant, 'id' | 'memoryBank'> = {
        ...data,
        avatar: 'https://placehold.co/40x40.png',
        isAI: true,
        isCustom: true,
        description:
          data.description ||
          `Custom AI with expertise in ${data.persona.expertise}.`,
      };
      try {
        const newId = await addCustomAIToFirestore(newAssistantData);
        const newAI = { ...newAssistantData, id: newId, memoryBank: [] };
        setCustomAIs(prev => [...prev, newAI]);
        toast({
          title: 'Custom AI Created!',
          description: `${data.name} is now available.`,
        });
      } catch (error) {
        console.error('Failed to create custom AI', error);
        toast({
          title: 'Error',
          description: 'Failed to create custom AI.',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  const removeCustomAIAssistant = useCallback(
    async (assistantId: string) => {
      try {
        await deleteCustomAIFromFirestore(assistantId);
        // Also remove from current group participants if present
        if(activeGroupId) {
            const newParticipants = participants.filter(p => p.id !== assistantId);
            setParticipants(newParticipants);
            await updateParticipantsForGroupAction(activeGroupId, newParticipants);
        }
        setCustomAIs(prev => prev.filter(ai => ai.id !== assistantId));
        toast({
          title: 'Custom AI Deleted',
          description: 'The custom AI has been permanently deleted.',
        });
      } catch (error) {
        console.error('Failed to delete custom AI', error);
        toast({
          title: 'Error',
          description: 'Failed to delete custom AI.',
          variant: 'destructive',
        });
      }
    },
    [toast, activeGroupId, participants]
  );

  const updateAIPersona = useCallback(
    async (assistantId: string, persona: Persona, name?: string) => {
      if (!activeGroupId) return;

      const allAIs = [...customAIs];
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
        };

        const newParticipants = participants.map(updateLogic);
        setParticipants(newParticipants);
        setCustomAIs(prev => prev.map(p => updateLogic(p) as AIAssistant));

        await updateParticipantsForGroupAction(activeGroupId, newParticipants);

        toast({
          title: 'AI Persona Updated',
          description: `The AI assistant has been successfully updated.`,
        });
      } catch (error) {
        console.error('Failed to update AI persona:', error);
        toast({
          title: 'Error',
          description: 'Failed to update AI persona.',
          variant: 'destructive',
        });
      }
    },
    [toast, customAIs, activeGroupId, participants]
  );

  const addAIMemory = useCallback(
    async (assistantId: string, content: string) => {
      if (!activeGroupId) return;
      const newParticipants = produce(participants, draft => {
        const p = draft.find(p => p.id === assistantId) as AIAssistant | undefined;
        if(p) {
            const newMemory: Memory = {
                id: `mem-${Date.now()}-${Math.random()}`,
                content,
                timestamp: Date.now(),
            };
            p.memoryBank = p.memoryBank || [];
            p.memoryBank.push(newMemory);
        }
      });
      setParticipants(newParticipants);
      await updateParticipantsForGroupAction(activeGroupId, newParticipants);
    },
    [activeGroupId, participants]
  );

  const updateAIMemory = useCallback(
    async (assistantId: string, memoryId: string, newContent: string) => {
      if (!activeGroupId) return;
      const newParticipants = produce(participants, draft => {
        const p = draft.find(p => p.id === assistantId) as AIAssistant | undefined;
        if (p?.memoryBank) {
            const mem = p.memoryBank.find(m => m.id === memoryId);
            if (mem) mem.content = newContent;
        }
      });
      setParticipants(newParticipants);
      await updateParticipantsForGroupAction(activeGroupId, newParticipants);
    },
    [activeGroupId, participants]
  );

  const deleteAIMemory = useCallback(
    async (assistantId: string, memoryId: string) => {
      if (!activeGroupId) return;
      const newParticipants = produce(participants, draft => {
        const p = draft.find(p => p.id === assistantId) as AIAssistant | undefined;
        if (p?.memoryBank) {
            p.memoryBank = p.memoryBank.filter(m => m.id !== memoryId);
        }
      });
      setParticipants(newParticipants);
      await updateParticipantsForGroupAction(activeGroupId, newParticipants);
    },
    [activeGroupId, participants]
  );

  const value: ChatContextType = {
    groups,
    activeGroup: groups.find(g => g.id === activeGroupId) || null,
    messages,
    participants,
    customAIs,
    isLoading,
    setActiveGroupId,
    createChatGroup,
    updateChatGroup,
    deleteChatGroup,
    addAIAssistant,
    removeAIParticipant,
    sendMessage,
    updateAIPersona,
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
