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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useCallback } from 'react';
import { addNewApiKey, getApiKeysAction, deleteApiKeyAction } from '@/app/actions';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import type { ApiKey } from '@/lib/types';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

const apiKeySchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  apiKey: z.string().min(10, { message: 'API key must be at least 10 characters.' }),
});

type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

interface ApiKeyModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ApiKeyModal({ isOpen, onOpenChange }: ApiKeyModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      name: '',
      apiKey: '',
    },
  });

  const fetchKeys = useCallback(async () => {
    const fetchedKeys = await getApiKeysAction();
    setKeys(fetchedKeys);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchKeys();
    }
  }, [isOpen, fetchKeys]);

  const toggleVisibility = (id: string) => {
    setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDelete = async (id: string) => {
    const result = await deleteApiKeyAction(id);
    if (result.success) {
      toast({ title: 'API Key Deleted' });
      fetchKeys(); // Refresh list
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const onSubmit = async (data: ApiKeyFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await addNewApiKey({ name: data.name, key: data.apiKey });
      if (result.success) {
        toast({
          title: 'API Key Added',
          description: 'The new Gemini API key has been saved.',
        });
        form.reset();
        fetchKeys();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to add the API key.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Gemini API Keys</DialogTitle>
          <DialogDescription>
            View, add, or delete your Gemini API keys stored in Firestore.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
            <h3 className="text-sm font-medium text-muted-foreground">Existing Keys</h3>
            <ScrollArea className="h-48 pr-4 border rounded-md">
                <div className="p-4 space-y-4">
                    {keys.length > 0 ? keys.map((key) => (
                        <div key={key.id} className="flex items-center gap-2">
                            <div className="flex-1 space-y-1">
                                <p className="font-medium text-sm">{key.name}</p>
                                <div className="flex items-center gap-1">
                                    <Input
                                        type={visibleKeys[key.id] ? 'text' : 'password'}
                                        value={key.key}
                                        readOnly
                                        className="h-9 text-xs text-muted-foreground bg-secondary"
                                    />
                                    <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={() => toggleVisibility(key.id)}>
                                        {visibleKeys[key.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                             <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive/70 hover:text-destructive shrink-0">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the API key "{key.name}". This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDelete(key.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )) : (
                        <p className="text-sm text-center text-muted-foreground py-4">No API keys found.</p>
                    )}
                </div>
            </ScrollArea>
        </div>

        <Separator />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <h3 className="text-sm font-medium text-muted-foreground pt-2">Add New Key</h3>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name / Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Personal Key, Project X Key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your Gemini API key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Key'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
