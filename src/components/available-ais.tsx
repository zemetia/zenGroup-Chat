"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useChat } from '@/lib/hooks/use-chat';
import { Button } from '@/components/ui/button';
import { Pencil, PlusCircle } from 'lucide-react';
import { CreateAIModal } from './create-ai-modal';
import type { AIAssistant } from '@/lib/types';

export function AvailableAIs() {
  const { customAIs, participants, addAIAssistant, activeGroup } = useChat();
  const [isCreateAIModalOpen, setIsCreateAIModalOpen] = useState(false);
  const [selectedAIForEdit, setSelectedAIForEdit] = useState<AIAssistant | null>(null);

  const handleConfigureClick = (ai: AIAssistant) => {
    setSelectedAIForEdit(ai);
  };
  
  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Available AIs ({customAIs.length})</h2>
            <Button onClick={() => setIsCreateAIModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New AI
            </Button>
        </div>
        <div className="space-y-2">
          {customAIs.map((ai) => {
            const isAdded = participants.some(p => p.id === ai.id);
            return (
              <div key={ai.id} className="group flex items-center p-3 rounded-md bg-card border">
                <Image
                  src={ai.avatar}
                  alt={ai.name}
                  width={40}
                  height={40}
                  className="rounded-full mr-4"
                  data-ai-hint="custom robot"
                />
                <div className="flex-1">
                  <p className="font-semibold text-base">{ai.name}</p>
                  <p className="text-sm text-muted-foreground line-clamp-1">{ai.description}</p>
                </div>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="w-9 h-9" onClick={() => handleConfigureClick(ai)}>
                    <Pencil className="w-5 h-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-9 h-9"
                    onClick={() => addAIAssistant(ai)}
                    disabled={!activeGroup || isAdded}
                  >
                    <PlusCircle className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )
          })}
           {customAIs.length === 0 && (
                <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
                    <h3 className="text-lg font-medium">No Custom AIs Found</h3>
                    <p className="text-sm text-muted-foreground mt-1">Click "Create New AI" to build your first assistant.</p>
                </div>
            )}
        </div>
      </div>
      <CreateAIModal isOpen={isCreateAIModalOpen} onOpenChange={setIsCreateAIModalOpen} />
      {selectedAIForEdit && <CreateAIModal ai={selectedAIForEdit} isOpen={!!selectedAIForEdit} onOpenChange={() => setSelectedAIForEdit(null)} />}
    </>
  );
}
