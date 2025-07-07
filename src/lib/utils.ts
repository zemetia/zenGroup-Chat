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

/**
 * Fetches an image from a URL and converts it to a Base64 data URI.
 * @param url The URL of the image to fetch.
 * @returns A promise that resolves to the Base64 data URI.
 */
export const fetchImageAsBase64 = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Image fetch error:", error);
        // Fallback to a placeholder if the fetch fails
        return 'https://placehold.co/40x40.png';
    }
};
