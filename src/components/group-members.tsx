"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useChat } from '@/lib/hooks/use-chat';
import { Button } from '@/components/ui/button';
import { Brain, Cog, LogOut, Search } from 'lucide-react';
import { AIMemoryModal } from './ai-memory-modal';
import { CreateAIModal } from './create-ai-modal';
import type { AIAssistant } from '@/lib/types';
import { Input } from './ui/input';

export function GroupMembers() {
  const { participants, removeAIParticipant } = useChat();
  const [selectedAIForEdit, setSelectedAIForEdit] = useState<AIAssistant | null>(null);
  const [selectedAIForMemory, setSelectedAIForMemory] = useState<AIAssistant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const humanUser = participants.find(p => !p.isAI);
  const aiParticipants = participants.filter(p => p.isAI) as AIAssistant[];

  const filteredAIs = aiParticipants.filter(ai =>
    ai.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ai.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfigureClick = (ai: AIAssistant) => {
    setSelectedAIForEdit(ai);
  };
  
  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Members ({participants.length})</h2>

          {aiParticipants.length > 0 && (
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
          )}

          <div className="space-y-2">
            {humanUser && (
              <div className="flex items-center p-3 rounded-md bg-card border">
                <Image src={humanUser.avatar} alt={humanUser.name} width={40} height={40} className="rounded-full mr-4" data-ai-hint="person avatar" />
                <span className="font-semibold text-base">{humanUser.name} (You)</span>
              </div>
            )}
            {filteredAIs.map((ai) => (
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
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
             {aiParticipants.length > 0 && filteredAIs.length === 0 && (
                <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
                    <h3 className="text-lg font-medium">No Members Match Your Search</h3>
                    <p className="text-sm text-muted-foreground mt-1">Try a different search term.</p>
                </div>
            )}
          </div>
        </div>
      </div>
      {selectedAIForEdit && <CreateAIModal ai={selectedAIForEdit} isOpen={!!selectedAIForEdit} onOpenChange={() => setSelectedAIForEdit(null)} />}
      {selectedAIForMemory && <AIMemoryModal ai={selectedAIForMemory} isOpen={!!selectedAIForMemory} onOpenChange={() => setSelectedAIForMemory(null)} />}
    </>
  );
}
