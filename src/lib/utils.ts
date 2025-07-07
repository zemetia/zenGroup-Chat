import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ICON_NAMES = ['MessageSquare', 'Hash', 'Bot', 'Code', 'Coffee', 'Rocket'];

export function getRandomIconName(): string {
  return ICON_NAMES[Math.floor(Math.random() * ICON_NAMES.length)];
}
