"use client";

import { Sidebar, SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarContent as AppSidebarContent } from "@/components/sidebar-content";
import { ChatPanel } from "@/components/chat-panel";
import { Bot, Eraser } from "lucide-react";
import { Button } from "./ui/button";
import { useChat } from "@/lib/hooks/use-chat";
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

export default function ChatLayout() {
    const { clearChat } = useChat();

    return (
        <SidebarProvider>
            <div className="flex h-screen bg-background">
                <Sidebar collapsible="icon" className="group" data-testid="sidebar">
                    <AppSidebarContent />
                </Sidebar>
                <SidebarInset className="flex flex-col flex-1">
                     <header className="p-4 border-b flex items-center justify-between bg-background shrink-0">
                        <div className="flex items-center gap-3">
                            <Bot className="w-8 h-8 text-primary" />
                            <h1 className="text-xl font-semibold tracking-tight font-headline">ZenGroup Chat</h1>
                        </div>
                        <div className="flex items-center gap-2">
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Eraser className="w-5 h-5" />
                                  <span className="sr-only">Clear Chat</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the
                                    current chat history and remove all AI participants.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={clearChat}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                           <div className="md:hidden">
                               <SidebarTrigger />
                           </div>
                        </div>
                    </header>
                    <ChatPanel />
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
