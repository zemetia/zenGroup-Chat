"use client";

import { useState, useEffect } from 'react';
import { Sidebar } from "@/components/sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { Button } from "./ui/button";
import { PanelLeft } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import { useChat } from '@/lib/hooks/use-chat';
import { IconRenderer } from './icon-renderer';
import { Skeleton } from './ui/skeleton';
import { GroupDetailPanel } from './group-detail-panel';


export default function ChatLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'chat' | 'details'>('chat');
    const isMobile = useIsMobile();
    const { activeGroup, isLoading } = useChat();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // When the active group changes, always switch back to the chat view
    useEffect(() => {
        setViewMode('chat');
    }, [activeGroup?.id]);
    
    const HeaderContent = () => {
        if (isLoading) {
            return (
                <>
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <Skeleton className="h-5 w-32" />
                </>
            );
        }

        if (viewMode === 'details') {
            return <h1 className="text-xl font-semibold tracking-tight">Conversation Details</h1>
        }

        if (activeGroup) {
            return (
                <button className="flex items-center gap-3 text-left rounded-md -ml-2 px-2 py-1 hover:bg-accent" onClick={() => setViewMode('details')}>
                    <IconRenderer name={activeGroup.icon} />
                    <h1 className="text-xl font-semibold tracking-tight">{activeGroup.name}</h1>
                </button>
            );
        }
        
        return <h1 className="text-xl font-semibold tracking-tight">ZenGroup Chat</h1>;
    }

    return (
        <div className="flex h-screen bg-background text-foreground">
            <Sidebar 
                isMobile={isMobile} 
                isOpen={isSidebarOpen} 
                toggleSidebar={toggleSidebar} 
                onShowDetails={() => setViewMode('details')}
            />

            <div className="flex flex-col flex-1 overflow-hidden">
                 <header className="p-4 border-b flex items-center justify-between bg-card h-16 shrink-0">
                    <div className="flex items-center gap-2">
                       <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
                           <PanelLeft className="h-5 w-5" />
                       </Button>
                       <div className='flex items-center gap-3'>
                         <HeaderContent />
                       </div>
                    </div>
                 </header>
                 {viewMode === 'chat' || !activeGroup ? (
                    <ChatPanel />
                 ) : (
                    <GroupDetailPanel group={activeGroup} onClose={() => setViewMode('chat')} />
                 )}
            </div>
        </div>
    );
}
