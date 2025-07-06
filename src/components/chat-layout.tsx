"use client";

import { Sidebar, SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarContent as AppSidebarContent } from "@/components/sidebar-content";
import { ChatPanel } from "@/components/chat-panel";
import { Bot } from "lucide-react";

export default function ChatLayout() {
    return (
        <SidebarProvider>
            <div className="flex h-screen bg-background">
                <Sidebar collapsible="icon" className="group" data-testid="sidebar">
                    <AppSidebarContent />
                </Sidebar>
                <SidebarInset className="flex flex-col flex-1">
                     <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                        <div className="flex items-center gap-3">
                            <Bot className="w-8 h-8 text-primary" />
                            <h1 className="text-xl font-semibold tracking-tight font-headline">ZenGroup Chat</h1>
                        </div>
                        <div className="md:hidden">
                           <SidebarTrigger />
                        </div>
                    </header>
                    <ChatPanel />
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
