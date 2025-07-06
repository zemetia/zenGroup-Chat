"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Bot, PlusCircle, User, Cog, Trash2, Users, BrainCircuit, Eraser, Pencil } from 'lucide-react';
import {
  SidebarHeader,
  SidebarContent as UiSidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
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

export function SidebarContent() {
  const { participants, addAIAssistant, removeAIParticipant, clearChat, customAIs, removeCustomAIAssistant } = useChat();
  
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
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
           <h2 className="text-lg font-semibold font-headline">Controls</h2>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <UiSidebarContent className="p-0">
        <ScrollArea className="h-full">
            <SidebarGroup className="p-4">
                <SidebarGroupLabel className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-2"><BrainCircuit />Available AIs</span>
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setIsCreateModalOpen(true)}>
                        <PlusCircle className="w-5 h-5" />
                    </Button>
                </SidebarGroupLabel>
                <SidebarMenu>
                    {allAvailableAIs.map((ai) => (
                        <SidebarMenuItem key={ai.id} className="group/item">
                             <div className="flex items-center w-full">
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
                                    <p className="text-xs text-muted-foreground">{ai.description}</p>
                                </div>
                                <div className="flex opacity-0 group-hover/item:opacity-100 transition-opacity">
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
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
            <SidebarSeparator />
             <SidebarGroup className="p-4">
                 <SidebarGroupLabel className="flex items-center gap-2"><Users />Participants</SidebarGroupLabel>
                 <SidebarMenu>
                    {humanUser && (
                        <SidebarMenuItem>
                             <div className="flex items-center">
                                <Image src={humanUser.avatar} alt={humanUser.name} width={32} height={32} className="rounded-full mr-3" data-ai-hint="person avatar"/>
                                <span className="font-semibold text-sm flex items-center gap-2">{humanUser.name} <User className="w-4 h-4 text-muted-foreground" /></span>
                            </div>
                        </SidebarMenuItem>
                    )}
                    {aiParticipants.map((ai) => (
                         <SidebarMenuItem key={ai.id} className="group/item">
                              <div className="flex items-center w-full">
                                <Image src={ai.avatar} alt={ai.name} width={32} height={32} className="rounded-full mr-3" data-ai-hint="robot face" />
                                <span className="font-semibold text-sm flex-1 flex items-center gap-2">{ai.name} <Bot className="w-4 h-4 text-muted-foreground" /></span>
                                <div className="flex opacity-0 group-hover/item:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => handleConfigureClick(ai)}>
                                        <Cog className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => removeAIParticipant(ai.id)}>
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                         </SidebarMenuItem>
                    ))}
                 </SidebarMenu>
            </SidebarGroup>
        </ScrollArea>
      </UiSidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-4">
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
                current chat history and remove all AI participants.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={clearChat}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarFooter>
      {selectedAIForPersona && <AIPersonaModal ai={selectedAIForPersona} isOpen={!!selectedAIForPersona} onOpenChange={() => setSelectedAIForPersona(null)} />}
      <CreateAIModal isOpen={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
      {selectedAIForEdit && <CreateAIModal ai={selectedAIForEdit} isOpen={!!selectedAIForEdit} onOpenChange={() => setSelectedAIForEdit(null)} />}
    </>
  );
}
