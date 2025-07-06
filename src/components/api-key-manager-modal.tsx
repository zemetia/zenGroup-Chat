"use client";

import { useEffect, useState } from 'react';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getApiKeysAction, addApiKeyAction, deleteApiKeyAction, updateApiKeyNameAction } from '@/app/actions';
import type { ApiKey } from '@/lib/types';
import { Eye, EyeOff, Trash2, PlusCircle, Pencil, Save } from 'lucide-react';
import { Separator } from './ui/separator';

const apiKeySchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  key: z.string().min(10, 'API Key seems too short.'),
});

type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

interface ApiKeyManagerModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ApiKeyManagerModal({ isOpen, onOpenChange }: ApiKeyManagerModalProps) {
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [editingName, setEditingName] = useState<Record<string, string | undefined>>({});

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: { name: '', key: '' },
  });

  const loadKeys = async () => {
    try {
      const apiKeys = await getApiKeysAction();
      setKeys(apiKeys);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not fetch API keys.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadKeys();
    }
  }, [isOpen, toast]);

  const handleAddKey = async (data: ApiKeyFormValues) => {
    try {
      const newKey = await addApiKeyAction(data.name, data.key);
      setKeys(prev => [...prev, newKey]);
      toast({ title: 'Success', description: 'API Key added successfully.' });
      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add API key.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      await deleteApiKeyAction(id);
      setKeys(prev => prev.filter(key => key.id !== id));
      toast({ title: 'Success', description: 'API Key deleted.' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete API key.',
        variant: 'destructive',
      });
    }
  };
  
  const handleUpdateName = async (id: string) => {
    const newName = editingName[id];
    if (!newName || newName.trim() === '') {
        toast({ title: 'Error', description: 'Name cannot be empty.', variant: 'destructive' });
        return;
    }
    try {
      await updateApiKeyNameAction(id, newName);
      setKeys(prev => prev.map(key => key.id === id ? { ...key, name: newName } : key));
      setEditingName(prev => {
          const newState = {...prev};
          delete newState[id];
          return newState;
      });
      toast({ title: 'Success', description: 'API Key name updated.' });
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to update key name.', variant: 'destructive' });
    }
  }

  const toggleVisibility = (id: string) => {
    setVisibility(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEditNameChange = (id: string, value: string) => {
    setEditingName(prev => ({ ...prev, [id]: value }));
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Gemini API Keys</DialogTitle>
          <DialogDescription>
            Add, view, and remove your Gemini API keys here. These keys are stored securely.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <h3 className="text-sm font-medium text-muted-foreground">Existing Keys</h3>
          <ScrollArea className="h-60 pr-4 border rounded-md">
            <div className="p-2 space-y-2">
              {keys.length > 0 ? (
                keys.map(key => (
                  <div key={key.id} className="flex items-center gap-2 p-2 rounded hover:bg-accent/50">
                    <div className="flex-1 flex items-center gap-2">
                        {editingName[key.id] !== undefined ? (
                            <Input
                                value={editingName[key.id]}
                                onChange={(e) => handleEditNameChange(key.id, e.target.value)}
                                className="h-9"
                            />
                        ) : (
                            <span className="font-medium truncate" title={key.name}>{key.name}</span>
                        )}

                        {editingName[key.id] !== undefined ? (
                           <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => handleUpdateName(key.id)}>
                                <Save />
                           </Button>
                        ) : (
                           <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => handleEditNameChange(key.id, key.name)}>
                                <Pencil />
                           </Button>
                        )}
                    </div>

                    <div className="flex items-center bg-background border rounded-md px-2 w-64">
                        <span className="text-sm text-muted-foreground font-mono flex-1 truncate">
                            {visibility[key.id] ? key.key : '•'.repeat(20)}
                        </span>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleVisibility(key.id)}>
                            {visibility[key.id] ? <EyeOff /> : <Eye />}
                        </Button>
                    </div>

                    <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive/70 hover:text-destructive" onClick={() => handleDeleteKey(key.id)}>
                      <Trash2 />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-center text-muted-foreground py-8">No API keys found. Add one below.</p>
              )}
            </div>
          </ScrollArea>

          <Separator />
          
          <h3 className="text-sm font-medium text-muted-foreground pt-2">Add New Key</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddKey)} className="space-y-4">
              <div className='flex gap-4 items-end'>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className='flex-1'>
                    <FormLabel>Key Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Personal Project Key" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem className='flex-1'>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your Gemini API Key" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                  <PlusCircle className="mr-2"/>
                  Add Key
                </Button>
              </div>
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
