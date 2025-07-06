"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Bot, PlusCircle, User, Cog, Trash2, Users, BrainCircuit, Eraser, Pencil } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useChat } from '@/lib/hooks/use-chat';
import { AVAILABLE_AI_ASSISTANTS } from '@/lib/constants';
import type { AIAssistant } from '@/lib/types';
import { AIPersonaModal } from './ai-persona-modal';
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
import { CreateAIModal } from './create-ai-modal';
import { Separator } from './ui/separator';

export function SidebarContent() {
  const { participants, addAIAssistant, clearChat, customAIs } = useChat();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAIForPersona, setSelectedAIForPersona] = useState<AIAssistant | null>(null);
  const [selectedAIForEdit, setSelectedAIForEdit] = useState<AIAssistant | null>(null);

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
      <div className="flex flex-col h-full">
        <div className="p-4">
          <h2 className="text-xl font-semibold">Controls</h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-8">
            {/* Available AIs Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><BrainCircuit className="w-4 h-4" />Available AIs</h3>
                <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setIsCreateModalOpen(true)}>
                  <PlusCircle className="w-5 h-5" />
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
                        disabled={participants.some(p => p.id === ai.id)}
                      >
                        <PlusCircle className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Participants Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4" />Participants</h3>
              <div className="space-y-1">
                {humanUser && (
                  <div className="flex items-center p-2">
                    <Image src={humanUser.avatar} alt={humanUser.name} width={32} height={32} className="rounded-full mr-3" data-ai-hint="person avatar" />
                    <span className="font-semibold text-sm flex items-center gap-2">{humanUser.name} <User className="w-4 h-4 text-muted-foreground" /></span>
                  </div>
                )}
                {aiParticipants.map((ai) => (
                  <div key={ai.id} className="group flex items-center p-2 rounded-md hover:bg-accent">
                    <Image src={ai.avatar} alt={ai.name} width={32} height={32} className="rounded-full mr-3" data-ai-hint="robot face" />
                    <span className="font-semibold text-sm flex-1 flex items-center gap-2">{ai.name} <Bot className="w-4 h-4 text-muted-foreground" /></span>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => handleConfigureClick(ai)}>
                        <Cog className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="p-4 mt-auto border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Eraser className="mr-2 h-4 w-4" /> Clear Chat
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  current chat history and reset all AI memories.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearChat}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {selectedAIForPersona && <AIPersonaModal ai={selectedAIForPersona} isOpen={!!selectedAIForPersona} onOpenChange={() => setSelectedAIForPersona(null)} />}
      <CreateAIModal isOpen={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
      {selectedAIForEdit && <CreateAIModal ai={selectedAIForEdit} isOpen={!!selectedAIForEdit} onOpenChange={() => setSelectedAIForEdit(null)} />}
    </>
  );
}
