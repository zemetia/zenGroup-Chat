"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useChat } from "@/lib/hooks/use-chat";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Bot, User, ArrowDown } from "lucide-react";
import { Button } from "./ui/button";

export function ChatMessages() {
  const { messages, participants } = useChat();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [showScrollDownButton, setShowScrollDownButton] = useState(false);
  const atBottomRef = useRef(true);

  const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
    const target = viewportRef.current;
    if (target) {
      target.scrollTo({
        top: target.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector<HTMLDivElement>(
      '[data-radix-scroll-area-viewport]'
    );
    
    if (viewport) {
      viewportRef.current = viewport;

      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = viewport;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 1;
        atBottomRef.current = isAtBottom;
        setShowScrollDownButton(!isAtBottom);
      };

      viewport.addEventListener("scroll", handleScroll);
      handleScroll();
      
      return () => {
        viewport.removeEventListener("scroll", handleScroll);
      };
    }
  }, [scrollAreaRef, messages]);

  useEffect(() => {
    if (atBottomRef.current) {
      scrollToBottom("smooth");
    }
  }, [messages]);

  useEffect(() => {
    setTimeout(() => scrollToBottom('auto'), 100);
  }, []);

  const typingAIs = participants.filter(p => p.isAI && p.isTyping);

  return (
    <div className="flex-1 relative">
      <ScrollArea className="absolute inset-0" ref={scrollAreaRef}>
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
      {showScrollDownButton && (
        <Button
            onClick={() => scrollToBottom('smooth')}
            variant="outline"
            size="icon"
            className="absolute bottom-4 right-4 h-10 w-10 rounded-full z-10 bg-background/80 backdrop-blur-sm"
        >
            <ArrowDown className="h-5 w-5" />
            <span className="sr-only">Scroll to bottom</span>
        </Button>
      )}
    </div>
  );
}
