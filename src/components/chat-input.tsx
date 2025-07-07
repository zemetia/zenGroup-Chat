"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useChat } from '@/lib/hooks/use-chat';

const chatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
});

type ChatFormValues = z.infer<typeof chatSchema>;

export function ChatInput() {
  const { sendMessage, activeGroup, replyingTo, setReplyingTo } = useChat();
  
  const form = useForm<ChatFormValues>({
    resolver: zodResolver(chatSchema),
    defaultValues: {
      message: '',
    },
  });

  const onSubmit = async (data: ChatFormValues) => {
    if (!activeGroup) return;
    sendMessage(data.message);
    form.reset();
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

  return (
    <div className="p-4 border-t bg-card shrink-0">
      {replyingTo && replyingTo.type !== 'system' && replyingTo.author && (
          <div className="max-w-4xl mx-auto mb-2 p-2 bg-accent rounded-md text-sm">
              <div className="flex justify-between items-center">
                  <div className="flex-1 overflow-hidden">
                      <p className="font-semibold text-accent-foreground">
                          Replying to {replyingTo.author.name}
                      </p>
                      <p className="text-muted-foreground line-clamp-1 truncate">
                          {replyingTo.text}
                      </p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setReplyingTo(null)}>
                      <X className="h-4 w-4" />
                  </Button>
              </div>
          </div>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-4 max-w-4xl mx-auto">
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Textarea
                    placeholder="Type a message..."
                    className="resize-none bg-background focus-visible:ring-1 ring-inset text-base"
                    rows={1}
                    {...field}
                    onKeyDown={handleKeyDown}
                    onInput={(e) => {
                        const target = e.currentTarget;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                    }}
                    disabled={!activeGroup}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={!activeGroup || !form.formState.isValid}>
              <Send className="h-5 w-5" />
              <span className="sr-only">Send Message</span>
          </Button>
        </form>
      </Form>
    </div>
  );
}
