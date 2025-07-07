
"use client";

import { MessageSquare, Hash, Bot, Code, Coffee, Rocket } from "lucide-react";

export const ICONS: Record<string, React.ElementType> = {
  MessageSquare, 
  Hash, 
  Bot, 
  Code, 
  Coffee, 
  Rocket
};

export function IconRenderer({ name, className }: { name: string, className?: string }) {
  const Icon = ICONS[name] || MessageSquare;
  return <Icon className={className || "w-5 h-5"} />;
}
