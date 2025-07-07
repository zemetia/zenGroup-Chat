"use client";

import { useState } from 'react';
import { Bot, PlusCircle, User, Cog, Brain, Pencil, KeyRound, MessageSquare, Trash2, Edit } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useChat } from '@/lib/hooks/use-chat';
import { AVAILABLE_AI_ASSISTANTS } from '@/lib/constants';
import type { AIAssistant, ChatGroup } from '@/lib/types';
import { CreateAIModal } from './create-ai-modal';
import { Separator } from './ui/separator';
import { AIMemoryModal } from './ai-memory-modal';
import { ApiKeyManagerModal } from './api-key-manager-modal';
import { CreateEditGroupModal } from './create-edit-group-modal';
import { IconRenderer } from './icon-renderer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function SidebarContent() {
  const { 
    groups, 
    activeGroup, 
    setActiveGroupId, 
    deleteChatGroup,
    participants, 
    addAIAssistant, 
    removeAIParticipant, 
    customAIs,
    isLoading 
  } = useChat();
  
  const [isCreateAIModalOpen, setIsCreateAIModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<ChatGroup | null>(null);

  const [selectedAIForEdit, setSelectedAIForEdit] = useState<AIAssistant | null>(null);
  const [selectedAIForMemory, setSelectedAIForMemory] = useState<AIAssistant | null>(null);
  
  const humanUser = participants.find(p => !p.isAI);
  const aiParticipants = participants.filter(p => p.isAI) as AIAssistant[];
  const allAvailableAIs = [...AVAILABLE_AI_ASSISTANTS, ...customAIs];

  const handleEditGroup = (group: ChatGroup) => {
    setGroupToEdit(group);
    setIsGroupModalOpen(true);
  }

  const handleNewGroup = () => {
    setGroupToEdit(null);
    setIsGroupModalOpen(true);
  }

  const handleConfigureClick = (ai: AIAssistant) => {
    setSelectedAIForEdit(ai);
  }
  
  return (
    <>
      <div className="flex flex-col h-full bg-card border-r">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Controls</h2>
           <Button variant="ghost" size="icon" onClick={() => setIsApiKeyModalOpen(true)}>
            <KeyRound className="h-5 w-5" />
            <span className="sr-only">Manage API Keys</span>
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground px-2">Conversations</h3>
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleNewGroup}>
                        <PlusCircle className="w-5 h-5 text-muted-foreground hover:text-primary" />
                    </Button>
                </div>
                <div className='space-y-1'>
                  {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <Skeleton className="w-5 h-5 rounded" />
                      <Skeleton className="w-32 h-4" />
                    </div>
                  ))}
                  {!isLoading && groups.map(group => (
                    <div key={group.id} className={cn("group flex items-center pr-2 pl-1 rounded-md", activeGroup?.id === group.id ? "bg-accent" : "hover:bg-accent/50")}>
                      <Button variant="ghost" className="flex-1 justify-start gap-3 font-normal" onClick={() => setActiveGroupId(group.id)}>
                          <IconRenderer name={group.icon} />
                          <span className='truncate'>{group.name}</span>
                      </Button>
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => handleEditGroup(group)}>
                            <Edit className="w-4 h-4" />
                         </Button>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button size="icon" variant="ghost" className="w-7 h-7 text-destructive/70 hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                               </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                               <AlertDialogHeader>
                                  <AlertDialogTitle>Delete "{group.name}"?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                     This action cannot be undone. This will permanently delete this conversation and all its messages.
                                  </AlertDialogDescription>
                               </AlertDialogHeader>
                               <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteChatGroup(group.id)}>Delete</AlertDialogAction>
                               </AlertDialogFooter>
                            </AlertDialogContent>
                         </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
            </div>

            <Separator />
            
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground px-2">Group Participants</h3>
              {isLoading && (
                 <div className="p-2 space-y-3">
                   <div className="flex items-center gap-3"><Skeleton className="w-8 h-8 rounded-full" /><Skeleton className="w-24 h-4" /></div>
                 </div>
              )}
              {!isLoading && activeGroup && (
                <div className="space-y-1">
                  {humanUser && (
                    <div className="flex items-center p-2">
                      <Image src={humanUser.avatar} alt={humanUser.name} width={32} height={32} className="rounded-full mr-3" data-ai-hint="person avatar" />
                      <span className="font-semibold text-sm flex items-center gap-2">{humanUser.name}</span>
                    </div>
                  )}
                  {aiParticipants.map((ai) => (
                    <div key={ai.id} className="group flex items-center p-2 rounded-md hover:bg-accent">
                      <Image src={ai.avatar} alt={ai.name} width={32} height={32} className="rounded-full mr-3" data-ai-hint="robot face" />
                      <span className="font-semibold text-sm flex-1">{ai.name}</span>
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => setSelectedAIForMemory(ai)}>
                          <Brain className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => handleConfigureClick(ai)}>
                          <Cog className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="w-8 h-8 text-destructive/70 hover:text-destructive" onClick={() => removeAIParticipant(ai.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground px-2">Available AIs</h3>
                <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setIsCreateAIModalOpen(true)}>
                  <PlusCircle className="w-5 h-5 text-muted-foreground hover:text-primary" />
                </Button>
              </div>
              <div className="space-y-1">
                {allAvailableAIs.map((ai) => (
                  <div key={ai.id} className="group flex items-center p-2 rounded-md hover:bg-accent">
                    <Image
                      src={ai.avatar}
                      alt={ai.name}
                      width={32}
                      height={32}
                      className="rounded-full mr-3"
                      data-ai-hint={ai.isCustom ? "custom robot" : "robot face"}
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{ai.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{ai.description}</p>
                    </div>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                      {ai.isCustom && (
                        <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => handleConfigureClick(ai)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8"
                        onClick={() => addAIAssistant(ai)}
                        disabled={!activeGroup || participants.some(p => p.id === ai.id)}
                      >
                        <PlusCircle className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
      <CreateAIModal isOpen={isCreateAIModalOpen} onOpenChange={setIsCreateAIModalOpen} />
      {selectedAIForEdit && <CreateAIModal ai={selectedAIForEdit} isOpen={!!selectedAIForEdit} onOpenChange={() => setSelectedAIForEdit(null)} />}
      {selectedAIForMemory && <AIMemoryModal ai={selectedAIForMemory} isOpen={!!selectedAIForMemory} onOpenChange={() => setSelectedAIForMemory(null)} />}
      <ApiKeyManagerModal isOpen={isApiKeyModalOpen} onOpenChange={setIsApiKeyModalOpen} />
      <CreateEditGroupModal isOpen={isGroupModalOpen} onOpenChange={setIsGroupModalOpen} group={groupToEdit} />
    </>
  );
}
