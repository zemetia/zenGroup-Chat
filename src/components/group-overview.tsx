"use client";

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useChat } from '@/lib/hooks/use-chat';
import type { ChatGroup } from '@/lib/types';
import { ICONS, IconRenderer } from './icon-renderer';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const overviewSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  description: z.string().optional(),
  icon: z.string().min(1, 'An icon must be selected.'),
});

type OverviewFormValues = z.infer<typeof overviewSchema>;

interface GroupOverviewProps {
  group: ChatGroup;
}

export function GroupOverview({ group }: GroupOverviewProps) {
  const { updateChatGroup } = useChat();
  const { toast } = useToast();

  const form = useForm<OverviewFormValues>({
    resolver: zodResolver(overviewSchema),
    defaultValues: {
      name: group.name,
      description: group.description || '',
      icon: group.icon,
    },
  });

  useEffect(() => {
    form.reset({
        name: group.name,
        description: group.description || '',
        icon: group.icon,
    })
  }, [group, form]);

  const onSubmit = async (data: OverviewFormValues) => {
    await updateChatGroup(group.id, data);
    toast({ title: 'Success', description: 'Group details have been updated.' });
    form.reset(data); // Resets the dirty state
  };
  
  const iconNames = Object.keys(ICONS);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex flex-col items-center text-center gap-4">
        <IconRenderer name={form.watch('icon')} className="w-24 h-24 text-muted-foreground" />
        <h1 className="text-3xl font-bold">{group.name}</h1>
        <p className="text-sm text-muted-foreground">
            Created on {format(new Date(group.createdAt), "PPP")}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Q3 Project Planning" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Add a short description for this conversation..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group Icon</FormLabel>
                <FormControl>
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 p-2 border rounded-md">
                        {iconNames.map(iconName => (
                            <Button
                                key={iconName}
                                type="button"
                                variant="outline"
                                size="icon"
                                className={cn("h-12 w-12", field.value === iconName && "ring-2 ring-primary")}
                                onClick={() => field.onChange(iconName)}
                            >
                                <IconRenderer name={iconName} className="h-6 w-6" />
                            </Button>
                        ))}
                    </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
                {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
