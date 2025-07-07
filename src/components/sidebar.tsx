
"use client";

import { SidebarContent } from "@/components/sidebar-content";
import { Button } from "./ui/button";
import { X } from "lucide-react";


interface SidebarProps {
    isMobile: boolean;
    isOpen: boolean;
    toggleSidebar: () => void;
}

export function Sidebar({ isMobile, isOpen, toggleSidebar }: SidebarProps) {

    if (isMobile) {
        return (
            <>
                {isOpen && (
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
            </>
        )
    }

    return (
        <aside className="hidden md:flex flex-col w-80 border-r border-border bg-card">
            <SidebarContent />
        </aside>
    );
}
