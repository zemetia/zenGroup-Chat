"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@/lib/hooks/use-chat";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Bot, User, ArrowDown, CornerUpLeft, Info } from "lucide-react";
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

  const handleReplyClick = (messageId: string) => {
    const element = viewportRef.current?.querySelector(`#${CSS.escape(messageId)}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('animate-highlight');
        setTimeout(() => {
            element.classList.remove('animate-highlight');
        }, 1500);
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
        <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
          {messages.map((message) => {
            if (message.type === 'system') {
                return (
                    <div key={message.id} className="flex items-center justify-center gap-2 text-center text-sm text-muted-foreground p-2 my-2 rounded-md animate-fade-in">
                        <Info className="w-4 h-4" />
                        <p className="whitespace-pre-wrap">{message.text}</p>
                    </div>
                );
            }

            const isUser = !message.author.isAI;
            const repliedToMessage = message.replyToId
              ? messages.find((m) => m.id === message.replyToId)
              : null;
            
            return (
              <div
                key={message.id}
                id={message.id}
                className={cn(
                  "flex items-start gap-3 animate-fade-in",
                  isUser ? "justify-end" : "justify-start"
                )}
              >
                {!isUser && (
                  <Avatar className="w-8 h-8 border shrink-0">
                    <AvatarImage src={message.author.avatar} alt={message.author.name} data-ai-hint="robot face" />
                    <AvatarFallback><Bot /></AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("flex flex-col gap-1 max-w-md md:max-w-lg", isUser && "items-end")}>
                  <p className={cn("text-xs text-muted-foreground px-1", isUser ? "text-right" : "text-left")}>{message.author.name}</p>
                  <div
                    className={cn(
                      "p-3 rounded-xl",
                      isUser
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-card text-card-foreground rounded-bl-none border"
                    )}
                  >
                    
                    {repliedToMessage && repliedToMessage.type !== 'system' && (
                      <button
                        onClick={() => handleReplyClick(repliedToMessage.id)}
                        className={cn(
                          "w-full text-left p-2 mb-2 rounded-md transition-colors",
                          isUser ? "bg-black/10 hover:bg-black/20" : "bg-muted hover:bg-secondary"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <CornerUpLeft className="w-4 h-4 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="font-semibold text-xs opacity-80">
                              {repliedToMessage.author.name}
                            </p>
                            <p className="text-sm opacity-70 line-clamp-2">
                              {repliedToMessage.text}
                            </p>
                          </div>
                        </div>
                      </button>
                    )}

                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  </div>
                </div>

                {isUser && (
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={message.author.avatar} alt={message.author.name} data-ai-hint="person avatar" />
                    <AvatarFallback><User /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            )
          })}
           {typingAIs.map(ai => (
              <div key={`typing-${ai.id}`} className="flex items-start gap-4 justify-start animate-fade-in">
                <Avatar className="w-8 h-8 shrink-0 border">
                    <AvatarImage src={ai.avatar} alt={ai.name} />
                    <AvatarFallback><Bot /></AvatarFallback>
                </Avatar>
                <div className="max-w-md p-3 rounded-lg bg-card text-card-foreground border flex items-center space-x-1">
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
