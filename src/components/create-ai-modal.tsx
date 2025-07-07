"use client";

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useChat } from '@/lib/hooks/use-chat';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { optimizeAIPrompt } from '@/ai/flows/ai-prompt-optimizer';
import { useToast } from '@/hooks/use-toast';
import type { AIAssistant } from '@/lib/types';


const createAISchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters long.' }),
  tone: z.string().min(3, { message: 'Tone must be at least 3 characters long.' }),
  expertise: z.string().min(3, { message: 'Expertise must be at least 3 characters long.' }),
  additionalInstructions: z.string().optional(),
});

type CreateAIFormValues = z.infer<typeof createAISchema>;

interface CreateAIModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  ai?: AIAssistant;
}

export function CreateAIModal({ isOpen, onOpenChange, ai }: CreateAIModalProps) {
  const { addCustomAIAssistant, updateAIPersona, removeCustomAIAssistant } = useChat();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateAIFormValues>({
    resolver: zodResolver(createAISchema),
    defaultValues: {
      name: ai?.name || '',
      tone: ai?.persona.tone || '',
      expertise: ai?.persona.expertise || '',
      additionalInstructions: ai?.persona.additionalInstructions || '',
    },
  });

  const handleOptimizePrompt = async () => {
    const instructions = form.getValues("additionalInstructions");
    if (!instructions || instructions.length < 10) {
      toast({
        title: "Prompt is too short",
        description: "Please provide a more detailed idea for the prompt to optimize.",
        variant: "destructive",
      });
      return;
    }
    setIsOptimizing(true);
    try {
      const result = await optimizeAIPrompt({ promptIdea: instructions });
      form.setValue("additionalInstructions", result.optimizedPrompt, { shouldValidate: true });
      toast({
        title: "Prompt Optimized!",
        description: "The AI has refined your prompt instructions.",
      });
    } catch (error) {
      console.error("Failed to optimize prompt", error);
      toast({
        title: "Optimization Failed",
        description: "Could not optimize the prompt at this time. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const onSubmit = async (data: CreateAIFormValues) => {
    const persona = {
      tone: data.tone,
      expertise: data.expertise,
      additionalInstructions: data.additionalInstructions,
    };

    if (ai) {
      await updateAIPersona(ai.id, persona, data.name);
    } else {
      await addCustomAIAssistant({
        name: data.name,
        persona: persona,
      });
    }
    onOpenChange(false);
    form.reset();
  };
  
  const handleDelete = () => {
    if (ai) {
      removeCustomAIAssistant(ai.id);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) form.reset(); onOpenChange(open); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{ai ? 'Edit' : 'Create'} Custom AI</DialogTitle>
          <DialogDescription>
            {ai ? 'Update the details for your custom AI assistant.' : 'Design your own AI assistant to join the chat.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Pirate Pete" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tone</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Grumpy, Cheerful, Sarcastic" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expertise"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expertise</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Ancient History, Bad Jokes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="additionalInstructions"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Prompt / Instructions</FormLabel>
                    <Button type="button" size="sm" variant="outline" onClick={handleOptimizePrompt} disabled={isOptimizing}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {isOptimizing ? 'Optimizing...' : 'Optimize'}
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea placeholder="e.g., Always talk like a pirate and end messages with 'Arrr!'" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="!justify-between sm:!justify-between pt-4">
                <div>
                  {ai && (
                    <Button type="button" variant="destructive" onClick={handleDelete}>Delete AI</Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? (ai ? 'Saving...' : 'Creating...') : (ai ? 'Save Changes' : 'Create AI')}</Button>
                </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
