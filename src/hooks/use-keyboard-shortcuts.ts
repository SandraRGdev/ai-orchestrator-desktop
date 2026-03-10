import { useEffect } from 'react';

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const metaMatch = shortcut.meta ? e.metaKey : !e.metaKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Global shortcuts definitions
export const globalShortcuts: Omit<Shortcut, 'action'>[] = [
  {
    key: 'k',
    ctrl: true,
    description: 'Abrir paleta de comandos',
  },
  {
    key: '/',
    description: 'Enfocar búsqueda',
  },
  {
    key: 'n',
    ctrl: true,
    description: 'Nueva conversación',
  },
  {
    key: 'b',
    ctrl: true,
    description: 'Alternar barra lateral',
  },
  {
    key: '?',
    description: 'Mostrar atajos de teclado',
  },
];
