
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Info, Users, Bot } from 'lucide-react';
import { GroupOverview } from './group-overview';
import { GroupMembers } from './group-members';
import { AvailableAIs } from './available-ais';
import type { ChatGroup } from '@/lib/types';

interface GroupDetailPanelProps {
  group: ChatGroup;
}

type Tab = 'overview' | 'members' | 'ais';

export function GroupDetailPanel({ group }: GroupDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
      { id: 'overview', label: 'Overview', icon: Info },
      { id: 'members', label: 'Members', icon: Users },
      { id: 'ais', label: 'Available AIs', icon: Bot },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navigation Panel: Top on mobile, Left on desktop */}
        <div className="md:w-64 bg-card md:border-r flex flex-col shrink-0">
            {/* Desktop Title - Hidden on mobile */}
            <div className="p-4 border-b h-16 hidden md:flex items-center">
                <h2 className="text-lg font-semibold tracking-tight">Group Info</h2>
            </div>
            
            {/* Tabs */}
            <nav className="flex md:flex-col p-2 space-x-1 md:space-x-0 md:space-y-1 border-b md:border-b-0 overflow-x-auto">
                {TABS.map(tab => (
                    <Button 
                        key={tab.id}
                        variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                        className="shrink-0 md:w-full justify-center md:justify-start gap-3 text-base h-11"
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <tab.icon className="h-5 w-5" />
                        <span>{tab.label}</span>
                    </Button>
                ))}
            </nav>
        </div>

        {/* Content Panel */}
        <div className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6">
                {activeTab === 'overview' && <GroupOverview group={group} />}
                {activeTab === 'members' && <GroupMembers />}
                {activeTab === 'ais' && <AvailableAIs />}
            </div>
        </div>
    </div>
  );
}
