"use client";

import { 
    MessageSquare, Hash, Bot, Code, Coffee, Rocket, 
    Briefcase, Book, BrainCircuit, Feather, Film, FlaskConical, Globe, GraduationCap,
    Heart, Lightbulb, Music, Palette, ShoppingBag, Sparkles, Star, Wrench
} from "lucide-react";

export const ICONS: Record<string, React.ElementType> = {
  MessageSquare, 
  Hash, 
  Bot, 
  Code, 
  Coffee, 
  Rocket,
  Briefcase,
  Book,
  BrainCircuit,
  Feather,
  Film,
  FlaskConical,
  Globe,
  GraduationCap,
  Heart,
  Lightbulb,
  Music,
  Palette,
  ShoppingBag,
  Sparkles,
  Star,
  Wrench
};

export function IconRenderer({ name, className }: { name: string, className?: string }) {
  const Icon = ICONS[name] || MessageSquare;
  return <Icon className={className || "w-5 h-5"} />;
}
