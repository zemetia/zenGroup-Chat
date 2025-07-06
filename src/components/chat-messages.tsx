"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useChat } from "@/lib/hooks/use-chat";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Bot, User } from "lucide-react";

export function ChatMessages() {
  const { messages, participants } = useChat();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const typingAIs = participants.filter(p => p.isAI && p.isTyping);

  return (
    <ScrollArea className="flex-1" ref={scrollAreaRef}>
      <div className="p-4 md:p-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-start gap-4",
              message.author.isAI ? "justify-start" : "justify-end"
            )}
          >
            {message.author.isAI && (
               <Avatar className="w-8 h-8 border-2 border-primary/50">
                <AvatarImage src={message.author.avatar} alt={message.author.name} data-ai-hint="robot face" />
                <AvatarFallback><Bot /></AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                "max-w-md p-3 rounded-lg shadow-sm",
                message.author.isAI
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-primary text-primary-foreground"
              )}
            >
              <p className="font-bold text-sm mb-1">{message.author.name}</p>
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
            </div>
             {!message.author.isAI && (
              <Avatar className="w-8 h-8">
                <AvatarImage src={message.author.avatar} alt={message.author.name} data-ai-hint="person avatar" />
                <AvatarFallback><User /></AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
         {typingAIs.map(ai => (
            <div key={`typing-${ai.id}`} className="flex items-start gap-4 justify-start">
              <Avatar className="w-8 h-8">
                  <AvatarImage src={ai.avatar} alt={ai.name} />
                  <AvatarFallback><Bot /></AvatarFallback>
              </Avatar>
              <div className="max-w-md p-3 rounded-lg bg-secondary text-secondary-foreground shadow-sm flex items-center space-x-1">
                 <span className="text-sm font-bold">{ai.name} is typing</span>
                 <span className="animate-pulse-fast">.</span>
                 <span className="animate-pulse-medium">.</span>
                 <span className="animate-pulse-slow">.</span>
              </div>
            </div>
        ))}
      </div>
    </ScrollArea>
  );
}
