import { useEffect, useState } from 'react';
import { Sidebar } from './components/layout/sidebar';
import { ProviderList } from './components/providers';
import { tauriService } from './services/tauri-service';
import { appVersionAtom, currentViewAtom } from './stores/atoms';
import { useAtom } from 'jotai';
import './styles.css';

function App() {
  const [version, setVersion] = useAtom(appVersionAtom);
  const [currentView] = useAtom(currentViewAtom);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    tauriService.getAppVersion().then(setVersion);
  }, []);

  const handleUnlock = async () => {
    try {
      await tauriService.unlockApp(password);
      setUnlocked(true);
    } catch (e) {
      alert('Failed to unlock: ' + e);
    }
  };

  if (!unlocked) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
          <h1 className="text-2xl font-bold mb-4">AI Orchestrator v{version}</h1>
          <p className="mb-4 text-gray-400">Enter your master password to unlock</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            className="w-full px-4 py-2 bg-gray-700 rounded text-white mb-4"
            placeholder="Master password"
          />
          <button
            onClick={handleUnlock}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-900 text-white">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {currentView === 'providers' ? (
          <div className="max-w-2xl mx-auto">
            <ProviderList />
          </div>
        ) : (
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">AI Orchestrator</h1>
            <p className="text-gray-400">Version: {version}</p>
            <div className="mt-8 p-4 bg-gray-800 rounded">
              <p>Phase 02: Provider System - Add providers to get started</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
