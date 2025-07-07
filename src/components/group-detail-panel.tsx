"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, Users, Bot } from 'lucide-react';
import { GroupOverview } from './group-overview';
import { GroupMembers } from './group-members';
import { AvailableAIs } from './available-ais';
import { ScrollArea } from './ui/scroll-area';
import type { ChatGroup } from '@/lib/types';

interface GroupDetailPanelProps {
  group: ChatGroup;
  onClose: () => void;
}

type Tab = 'overview' | 'members' | 'ais';

export function GroupDetailPanel({ group, onClose }: GroupDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
      { id: 'overview', label: 'Overview', icon: Info },
      { id: 'members', label: 'Members', icon: Users },
      { id: 'ais', label: 'Available AIs', icon: Bot },
  ];

  return (
    <div className="flex h-full bg-background">
        {/* Left Navigation */}
        <div className="w-64 bg-card border-r flex flex-col">
            <div className="p-4 border-b h-16 flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-lg font-semibold tracking-tight">Group Info</h2>
            </div>
            <nav className="p-2 space-y-1">
                {TABS.map(tab => (
                    <Button 
                        key={tab.id}
                        variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                        className="w-full justify-start gap-3 text-base h-11"
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <tab.icon className="h-5 w-5" />
                        <span>{tab.label}</span>
                    </Button>
                ))}
            </nav>
        </div>

        {/* Right Content */}
        <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
                <div className="p-4 md:p-6">
                    {activeTab === 'overview' && <GroupOverview group={group} />}
                    {activeTab === 'members' && <GroupMembers />}
                    {activeTab === 'ais' && <AvailableAIs />}
                </div>
            </ScrollArea>
        </div>
    </div>
  );
}
