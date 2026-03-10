import { useState, useEffect } from 'react';

export interface Command {
  id: string;
  label: string;
  action: () => void;
  icon?: string;
  category?: string;
}

interface CommandPaletteProps {
  commands: Command[];
}

export function CommandPalette({ commands }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category?.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        }
        if (e.key === 'Enter' && filteredCommands.length > 0) {
          e.preventDefault();
          filteredCommands[selectedIndex].action();
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-32 z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Escribe un comando o busca..."
          className="w-full px-6 py-4 text-lg border-b border-gray-200 dark:border-gray-700 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />

        {filteredCommands.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            No se encontraron comandos
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto py-2">
            {filteredCommands.map((cmd, index) => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  setIsOpen(false);
                }}
                className={`w-full px-6 py-3 flex items-center gap-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left ${
                  index === selectedIndex ? 'bg-gray-100 dark:bg-gray-800' : ''
                }`}
              >
                {cmd.icon && <span className="text-2xl">{cmd.icon}</span>}
                <div className="flex-1">
                  <div className="text-gray-900 dark:text-white font-medium">{cmd.label}</div>
                  {cmd.category && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">{cmd.category}</div>
                  )}
                </div>
                {index === selectedIndex && (
                  <span className="text-xs text-gray-400">↵</span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-3 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
          <div className="flex gap-4">
            <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">↑↓</kbd> navegar</span>
            <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">↵</kbd> seleccionar</span>
          </div>
          <span><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">esc</kbd> cerrar</span>
        </div>
      </div>
    </div>
  );
}
