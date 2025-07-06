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
import type { AIAssistant, Persona } from '@/lib/types';
import { useEffect } from 'react';

const personaSchema = z.object({
  tone: z.string().min(3, { message: 'Tone must be at least 3 characters long.' }),
  expertise: z.string().min(3, { message: 'Expertise must be at least 3 characters long.' }),
  additionalInstructions: z.string().optional(),
});

type PersonaFormValues = z.infer<typeof personaSchema>;

interface AIPersonaModalProps {
  ai: AIAssistant;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AIPersonaModal({ ai, isOpen, onOpenChange }: AIPersonaModalProps) {
  const { updateAIPersona } = useChat();

  const form = useForm<PersonaFormValues>({
    resolver: zodResolver(personaSchema),
    defaultValues: {
      tone: ai.persona.tone || '',
      expertise: ai.persona.expertise || '',
      additionalInstructions: ai.persona.additionalInstructions || '',
    },
  });
  
  useEffect(() => {
    if (ai) {
        form.reset({
            tone: ai.persona.tone || '',
            expertise: ai.persona.expertise || '',
            additionalInstructions: ai.persona.additionalInstructions || '',
        })
    }
  }, [ai, form]);

  const onSubmit = async (data: PersonaFormValues) => {
    await updateAIPersona(ai.id, data);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure {ai.name}'s Persona</DialogTitle>
          <DialogDescription>
            Customize how you want {ai.name} to behave in the chat.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="tone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tone</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Professional, Friendly, Humorous" {...field} />
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
                    <Input placeholder="e.g., Marketing, Technical Support" {...field} />
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
                  <FormLabel>Additional Instructions (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Always start responses with a joke." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>Save changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
