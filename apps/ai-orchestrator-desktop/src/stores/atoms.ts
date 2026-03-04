import { atom } from 'jotai';

// App state
export const appUnlockedAtom = atom(false);
export const appVersionAtom = atom('0.1.0-alpha');

// UI state
export const sidebarOpenAtom = atom(true);
export const currentViewAtom = atom<'chat' | 'compare' | 'agents' | 'providers'>('providers');
