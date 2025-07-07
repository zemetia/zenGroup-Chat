"use client";

import { useState } from 'react';
import { Sidebar } from "@/components/sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { Button } from "./ui/button";
import { PanelLeft, X } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import { useChat } from '@/lib/hooks/use-chat';
import { IconRenderer } from './icon-renderer';
import { Skeleton } from './ui/skeleton';


export default function ChatLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const isMobile = useIsMobile();
    const { activeGroup, isLoading } = useChat();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex h-screen bg-background text-foreground">
            <Sidebar isMobile={isMobile} isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            <div className="flex flex-col flex-1 overflow-hidden">
                 <header className="p-4 border-b flex items-center justify-between bg-card h-16 shrink-0">
                    <div className="flex items-center gap-2">
                       <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
                           <PanelLeft className="h-5 w-5" />
                       </Button>
                       <div className='flex items-center gap-3'>
                         {isLoading ? (
                            <>
                                <Skeleton className="h-7 w-7 rounded-full" />
                                <Skeleton className="h-5 w-32" />
                            </>
                         ) : activeGroup ? (
                            <>
                                <IconRenderer name={activeGroup.icon} />
                                <h1 className="text-xl font-semibold tracking-tight">{activeGroup.name}</h1>
                            </>
                         ): (
                            <h1 className="text-xl font-semibold tracking-tight">ZenGroup Chat</h1>
                         )}
                       </div>
                    </div>
                 </header>
                <ChatPanel />
            </div>
        </div>
    );
}
