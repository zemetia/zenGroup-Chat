"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Bot, PlusCircle, User, Cog, Brain, Pencil, LogOut, KeyRound, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useChat } from '@/lib/hooks/use-chat';
import { AVAILABLE_AI_ASSISTANTS } from '@/lib/constants';
import type { AIAssistant } from '@/lib/types';
import { AIPersonaModal } from './ai-persona-modal';
import { CreateAIModal } from './create-ai-modal';
import { Separator } from './ui/separator';
import { AIMemoryModal } from './ai-memory-modal';
import { ApiKeyModal } from './api-key-modal';
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
import { Badge } from './ui/badge';

export function SidebarContent() {
  const { participants, addAIAssistant, removeAIParticipant, customAIs, removeCustomAIAssistant } = useChat();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [selectedAIForPersona, setSelectedAIForPersona] = useState<AIAssistant | null>(null);
  const [selectedAIForEdit, setSelectedAIForEdit] = useState<AIAssistant | null>(null);
  const [selectedAIForMemory, setSelectedAIForMemory] = useState<AIAssistant | null>(null);

  const humanUser = participants.find(p => !p.isAI);
  const aiParticipants = participants.filter(p => p.isAI) as AIAssistant[];
  const allAvailableAIs = [...AVAILABLE_AI_ASSISTANTS, ...customAIs];

  const handleConfigureClick = (ai: AIAssistant) => {
    if (ai.isCustom) {
      setSelectedAIForEdit(ai);
    } else {
      setSelectedAIForPersona(ai);
    }
  }

  return (
    <>
      <div className="flex flex-col h-full bg-card border-r">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Controls</h2>
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setIsApiKeyModalOpen(true)}>
            <KeyRound className="w-4 h-4" />
            <span className="sr-only">Manage API Keys</span>
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><User className="w-4 h-4" />Participants</h3>
              <div className="space-y-1">
                {humanUser && (
                  <div className="flex items-center p-2">
                    <Image src={humanUser.avatar} alt={humanUser.name} width={32} height={32} className="rounded-full mr-3" data-ai-hint="person avatar" />
                    <span className="font-semibold text-sm flex items-center gap-2">{humanUser.name}</span>
                  </div>
                )}
                {aiParticipants.map((ai) => (
                  <div key={ai.id} className="group flex items-start p-2 rounded-md hover:bg-accent">
                    <Image src={ai.avatar} alt={ai.name} width={32} height={32} className="rounded-full mr-3" data-ai-hint="robot face" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{ai.name}</p>
                       {ai.apiKeyName && (
                        <Badge variant="outline" className="text-xs mt-1 font-mono py-0">{ai.apiKeyName}</Badge>
                      )}
                    </div>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => setSelectedAIForMemory(ai)}>
                        <Brain className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => handleConfigureClick(ai)}>
                        <Cog className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="w-8 h-8 text-destructive/70 hover:text-destructive" onClick={() => removeAIParticipant(ai.id)}>
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><Bot className="w-4 h-4" />Available AIs</h3>
                <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setIsCreateModalOpen(true)}>
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
                    <div className="flex items-center ml-2">
                      {ai.isCustom && (
                        <>
                          <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => handleConfigureClick(ai)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="w-8 h-8 text-destructive/70 hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the AI assistant "{ai.name}". This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => removeCustomAIAssistant(ai.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8"
                        onClick={() => addAIAssistant(ai)}
                        disabled={participants.some(p => p.id === ai.id)}
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
      {selectedAIForPersona && <AIPersonaModal ai={selectedAIForPersona} isOpen={!!selectedAIForPersona} onOpenChange={() => setSelectedAIForPersona(null)} />}
      <CreateAIModal isOpen={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
      {selectedAIForEdit && <CreateAIModal ai={selectedAIForEdit} isOpen={!!selectedAIForEdit} onOpenChange={() => setSelectedAIForEdit(null)} />}
      {selectedAIForMemory && <AIMemoryModal ai={selectedAIForMemory} isOpen={!!selectedAIForMemory} onOpenChange={() => setSelectedAIForMemory(null)} />}
      <ApiKeyModal isOpen={isApiKeyModalOpen} onOpenChange={setIsApiKeyModalOpen} />
    </>
  );
}
