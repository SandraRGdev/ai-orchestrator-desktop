import { sidebarOpenAtom, currentViewAtom } from '../../stores/atoms';
import { useAtom } from 'jotai';

export function Sidebar() {
  const [open, setOpen] = useAtom(sidebarOpenAtom);
  const [currentView, setCurrentView] = useAtom(currentViewAtom);

  const navItems = [
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'compare', label: 'Comparar', icon: '⚖️' },
    { id: 'agents', label: 'Agentes', icon: '🤖' },
    { id: 'providers', label: 'Proveedores', icon: '🔌' },
  ];

  return (
    <aside className={`${open ? 'w-64' : 'w-16'} bg-gradient-secondary border-r border-border-subtle text-text-primary transition-all duration-300 flex flex-col relative`}>
      {/* Gradient accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-primary via-accent-secondary to-accent-tertiary"></div>

      <div className="p-4 flex items-center justify-between border-b border-border-subtle">
        {open && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg glow-primary">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient">AI Orchestrator</h1>
            </div>
          </div>
        )}
        <button
          onClick={() => setOpen(!open)}
          className="p-2 hover:bg-surface/50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
          aria-label={open ? 'Contraer barra lateral' : 'Expandir barra lateral'}
        >
          <svg className={`w-5 h-5 transition-transform duration-200 ${open ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {open && (
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                currentView === item.id
                  ? 'bg-gradient-primary text-white font-medium shadow-lg glow-primary'
                  : 'hover:bg-surface/50 text-text-secondary hover:text-text-primary'
              } focus:outline-none focus:ring-2 focus:ring-accent-primary/50`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      )}

      {!open && (
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as any)}
              className={`w-full flex items-center justify-center p-3 rounded-xl transition-all duration-200 ${
                currentView === item.id
                  ? 'bg-gradient-primary text-white shadow-lg glow-primary'
                  : 'hover:bg-surface/50 text-text-secondary hover:text-text-primary'
              } focus:outline-none focus:ring-2 focus:ring-accent-primary/50`}
              title={item.label}
            >
              <span className="text-xl">{item.icon}</span>
            </button>
          ))}
        </nav>
      )}
    </aside>
  );
}
