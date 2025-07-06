"use client";

import { useState } from 'react';
import { SidebarContent } from "@/components/sidebar-content";
import { ChatPanel } from "@/components/chat-panel";
import { Button } from "./ui/button";
import { PanelLeft, X, Eraser } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
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
import { useChat } from '@/lib/hooks/use-chat';


export default function ChatLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const isMobile = useIsMobile();
    const { clearChat } = useChat();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-80 border-r border-border bg-card">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar (Sheet-like) */}
            {isMobile && isSidebarOpen && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/60" onClick={toggleSidebar}></div>
                    <aside className="fixed top-0 left-0 h-full w-80 bg-card border-r border-border z-50 transform transition-transform duration-300 ease-in-out">
                        <div className="flex justify-end p-2">
                             <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                                <X className="h-5 w-5" />
                             </Button>
                        </div>
                        <SidebarContent />
                    </aside>
                </>
            )}

            <div className="flex flex-col flex-1 overflow-hidden">
                 <header className="p-4 border-b flex items-center justify-between bg-card h-16 shrink-0">
                    <div className="flex items-center gap-2">
                       <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
                           <PanelLeft className="h-5 w-5" />
                       </Button>
                       <h1 className="text-xl font-semibold tracking-tight">ZenGroup Chat</h1>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive">
                          <Eraser className="w-5 h-5" />
                          <span className="sr-only">Clear Chat</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            current chat history and reset all AI memories.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={clearChat}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                 </header>
                <ChatPanel />
            </div>
        </div>
    );
}
