import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ICON_NAMES = [
    'MessageSquare', 'Hash', 'Bot', 'Code', 'Coffee', 'Rocket', 
    'Briefcase', 'Book', 'BrainCircuit', 'Feather', 'Film', 'FlaskConical', 'Globe', 'GraduationCap',
    'Heart', 'Lightbulb', 'Music', 'Palette', 'ShoppingBag', 'Sparkles', 'Star', 'Wrench'
];

export function getRandomIconName(): string {
  return ICON_NAMES[Math.floor(Math.random() * ICON_NAMES.length)];
}
