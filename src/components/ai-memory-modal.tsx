"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '@/lib/hooks/use-chat';
import type { AIAssistant } from '@/lib/types';
import { Trash2, Save, PlusCircle } from 'lucide-react';
import { Separator } from './ui/separator';

const memorySchema = z.object({
  newMemory: z.string().min(1, 'Memory content cannot be empty.'),
});

type MemoryFormValues = z.infer<typeof memorySchema>;

interface AIMemoryModalProps {
  ai: AIAssistant;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AIMemoryModal({ ai, isOpen, onOpenChange }: AIMemoryModalProps) {
  const { addAIMemory, updateAIMemory, deleteAIMemory } = useChat();
  const [editingStates, setEditingStates] = useState<Record<string, string>>({});

  const form = useForm<MemoryFormValues>({
    resolver: zodResolver(memorySchema),
    defaultValues: {
      newMemory: '',
    },
  });

  const handleAddMemory = (data: MemoryFormValues) => {
    addAIMemory(ai.id, data.newMemory);
    form.reset();
  };
  
  const handleUpdateMemory = (memoryId: string) => {
    const newContent = editingStates[memoryId];
    if (newContent !== undefined) {
      updateAIMemory(ai.id, memoryId, newContent);
      setEditingStates(prev => {
        const newState = { ...prev };
        delete newState[memoryId];
        return newState;
      });
    }
  };
  
  const handleDeleteMemory = (memoryId: string) => {
    deleteAIMemory(ai.id, memoryId);
  }

  const handleInputChange = (memoryId: string, value: string) => {
    setEditingStates(prev => ({...prev, [memoryId]: value}));
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage {ai.name}'s Memories</DialogTitle>
          <DialogDescription>
            View, edit, and delete what this AI remembers. Changes are saved automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
            <h3 className="text-sm font-medium text-muted-foreground">Current Memories</h3>
            <ScrollArea className="h-64 pr-4">
                <div className='space-y-3'>
                {ai.memoryBank && ai.memoryBank.length > 0 ? (
                    ai.memoryBank.map((memory) => (
                        <div key={memory.id} className="flex items-center gap-2 group">
                            <Input
                                value={editingStates[memory.id] ?? memory.content}
                                onChange={(e) => handleInputChange(memory.id, e.target.value)}
                                className="flex-1"
                            />
                            {editingStates[memory.id] !== undefined && (
                                <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => handleUpdateMemory(memory.id)}>
                                    <Save className="h-4 w-4" />
                                </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive/70 hover:text-destructive" onClick={() => handleDeleteMemory(memory.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-center text-muted-foreground py-8">This AI has no memories yet.</p>
                )}
                </div>
            </ScrollArea>
            <Separator />
            <h3 className="text-sm font-medium text-muted-foreground pt-2">Add New Memory</h3>
             <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddMemory)} className="flex items-start gap-2">
                <FormField
                  control={form.control}
                  name="newMemory"
                  render={({ field }) => (
                    <FormItem className='flex-1'>
                      <FormControl>
                        <Input placeholder="Add a new fact or summary..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" size="icon" className="h-10 w-10 shrink-0">
                    <PlusCircle className="h-5 w-5" />
                    <span className="sr-only">Add Memory</span>
                </Button>
              </form>
            </Form>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
