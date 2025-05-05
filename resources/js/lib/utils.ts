import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function nameToUnique(name: string) {
    return name.replace(/\s+/g, '_').replace(/[^\w]/g, '_').replace(/__+/g, '_');
}
