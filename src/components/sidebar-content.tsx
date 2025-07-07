"use client";

import { useState } from 'react';
import { PlusCircle, KeyRound, Edit, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useChat } from '@/lib/hooks/use-chat';
import type { ChatGroup } from '@/lib/types';
import { ApiKeyManagerModal } from './api-key-manager-modal';
import { CreateEditGroupModal } from './create-edit-group-modal';
import { IconRenderer } from './icon-renderer';
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
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

interface SidebarContentProps {
    onShowDetails: () => void;
}

export function SidebarContent({ onShowDetails }: SidebarContentProps) {
  const { 
    groups, 
    activeGroup, 
    setActiveGroupId, 
    deleteChatGroup,
    isLoading 
  } = useChat();
  
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  
  const handleEditGroup = (group: ChatGroup) => {
    setActiveGroupId(group.id);
    onShowDetails();
  }

  const handleNewGroup = () => {
    setIsGroupModalOpen(true);
  }
  
  return (
    <>
      <div className="flex flex-col h-full bg-card border-r">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">ZenGroup Chat</h2>
           <Button variant="ghost" size="icon" onClick={() => setIsApiKeyModalOpen(true)}>
            <KeyRound className="h-5 w-5" />
            <span className="sr-only">Manage API Keys</span>
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground px-2">Conversations</h3>
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleNewGroup}>
                        <PlusCircle className="w-5 h-5 text-muted-foreground hover:text-primary" />
                    </Button>
                </div>
                <div className='space-y-1'>
                  {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <Skeleton className="w-5 h-5 rounded" />
                      <Skeleton className="w-32 h-4" />
                    </div>
                  ))}
                  {!isLoading && groups.map(group => (
                    <div key={group.id} className={cn("group flex items-center pr-2 pl-1 rounded-md", activeGroup?.id === group.id ? "bg-accent" : "hover:bg-accent/50")}>
                      <Button variant="ghost" className="flex-1 justify-start gap-3 font-normal" onClick={() => setActiveGroupId(group.id)}>
                          <IconRenderer name={group.icon} />
                          <span className='truncate'>{group.name}</span>
                      </Button>
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => handleEditGroup(group)}>
                            <Edit className="w-4 h-4" />
                         </Button>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button size="icon" variant="ghost" className="w-7 h-7 text-destructive/70 hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                               </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                               <AlertDialogHeader>
                                  <AlertDialogTitle>Delete "{group.name}"?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                     This action cannot be undone. This will permanently delete this conversation and all its messages.
                                  </AlertDialogDescription>
                               </AlertDialogHeader>
                               <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteChatGroup(group.id)}>Delete</AlertDialogAction>
                               </AlertDialogFooter>
                            </AlertDialogContent>
                         </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        </ScrollArea>
      </div>
      <ApiKeyManagerModal isOpen={isApiKeyModalOpen} onOpenChange={setIsApiKeyModalOpen} />
      <CreateEditGroupModal isOpen={isGroupModalOpen} onOpenChange={setIsGroupModalOpen} group={null} />
    </>
  );
}
