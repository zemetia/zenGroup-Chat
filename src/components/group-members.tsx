"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useChat } from '@/lib/hooks/use-chat';
import { Button } from '@/components/ui/button';
import { Brain, Cog, Trash2 } from 'lucide-react';
import { AIMemoryModal } from './ai-memory-modal';
import { CreateAIModal } from './create-ai-modal';
import type { AIAssistant } from '@/lib/types';

export function GroupMembers() {
  const { participants, removeAIParticipant } = useChat();
  const [selectedAIForEdit, setSelectedAIForEdit] = useState<AIAssistant | null>(null);
  const [selectedAIForMemory, setSelectedAIForMemory] = useState<AIAssistant | null>(null);

  const humanUser = participants.find(p => !p.isAI);
  const aiParticipants = participants.filter(p => p.isAI) as AIAssistant[];

  const handleConfigureClick = (ai: AIAssistant) => {
    setSelectedAIForEdit(ai);
  };
  
  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Members ({participants.length})</h2>
          <div className="space-y-2">
            {humanUser && (
              <div className="flex items-center p-3 rounded-md bg-card border">
                <Image src={humanUser.avatar} alt={humanUser.name} width={40} height={40} className="rounded-full mr-4" data-ai-hint="person avatar" />
                <span className="font-semibold text-base">{humanUser.name} (You)</span>
              </div>
            )}
            {aiParticipants.map((ai) => (
              <div key={ai.id} className="group flex items-center p-3 rounded-md bg-card border">
                <Image src={ai.avatar} alt={ai.name} width={40} height={40} className="rounded-full mr-4" data-ai-hint="robot face" />
                <div className="flex-1">
                  <p className="font-semibold text-base">{ai.name}</p>
                  <p className="text-sm text-muted-foreground">{ai.description}</p>
                </div>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="w-9 h-9" onClick={() => setSelectedAIForMemory(ai)}>
                    <Brain className="w-5 h-5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="w-9 h-9" onClick={() => handleConfigureClick(ai)}>
                    <Cog className="w-5 h-5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="w-9 h-9 text-destructive/70 hover:text-destructive" onClick={() => removeAIParticipant(ai.id)}>
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {selectedAIForEdit && <CreateAIModal ai={selectedAIForEdit} isOpen={!!selectedAIForEdit} onOpenChange={() => setSelectedAIForEdit(null)} />}
      {selectedAIForMemory && <AIMemoryModal ai={selectedAIForMemory} isOpen={!!selectedAIForMemory} onOpenChange={() => setSelectedAIForMemory(null)} />}
    </>
  );
}
