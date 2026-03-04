import { sidebarOpenAtom } from '../../stores/atoms';
import { useAtom } from 'jotai';

export function Sidebar() {
  const [open, setOpen] = useAtom(sidebarOpenAtom);

  return (
    <aside className={`${open ? 'w-64' : 'w-16'} bg-gray-900 text-white transition-all duration-300`}>
      <div className="p-4 flex items-center justify-between">
        {open && <h1 className="text-xl font-bold">AI Orchestrator</h1>}
        <button onClick={() => setOpen(!open)} className="p-2 hover:bg-gray-800 rounded">
          {open ? '◀' : '▶'}
        </button>
      </div>
      {open && (
        <nav className="mt-4">
          <div className="px-4 py-2 hover:bg-gray-800 cursor-pointer">Chat</div>
          <div className="px-4 py-2 hover:bg-gray-800 cursor-pointer">Compare</div>
          <div className="px-4 py-2 hover:bg-gray-800 cursor-pointer">Agents</div>
          <div className="px-4 py-2 hover:bg-gray-800 cursor-pointer">Settings</div>
        </nav>
      )}
    </aside>
  );
}
