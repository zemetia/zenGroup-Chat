
"use client";

import { useEffect } from 'react';
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
import { useChat } from '@/lib/hooks/use-chat';
import type { ChatGroup } from '@/lib/types';

const groupSchema = z.object({
  name: z.string().min(3, { message: 'Group name must be at least 3 characters long.' }),
});

type GroupFormValues = z.infer<typeof groupSchema>;

interface CreateEditGroupModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  group: ChatGroup | null;
}

export function CreateEditGroupModal({ isOpen, onOpenChange, group }: CreateEditGroupModalProps) {
  const { createChatGroup, updateChatGroup } = useChat();

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: group?.name || '',
    },
  });

  useEffect(() => {
    form.reset({
        name: group?.name || '',
    });
  }, [group, form, isOpen]);

  const onSubmit = async (data: GroupFormValues) => {
    if (group) {
        await updateChatGroup(group.id, data.name);
    } else {
        await createChatGroup(data.name);
    }
    onOpenChange(false);
  };
  
  const isEditing = !!group;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Conversation' : 'Create New Conversation'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the name of this conversation.' : 'Give your new conversation a name to get started.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conversation Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Marketing Campaign" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>{isEditing ? 'Save Changes' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
