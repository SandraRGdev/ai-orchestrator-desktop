import { useEffect, useState } from 'react';
import { Sidebar } from './components/layout/sidebar';
import { ProviderList } from './components/providers';
import { ChatInterface } from './components/chat';
import { ComparisonView } from './components/comparison';
import { AgentWorkspace } from './components/agents/agent-workspace';
import { tauriService } from './services/tauri-service';
import { appVersionAtom, currentViewAtom, selectedModelAtom, selectedProviderForChatAtom } from './stores/atoms';
import { useAtom } from 'jotai';
import './styles.css';

// Demo mode - skip password for development
const DEMO_MODE = true;

function App() {
  const [version, setVersion] = useAtom(appVersionAtom);
  const [currentView] = useAtom(currentViewAtom);
  const [selectedModel] = useAtom(selectedModelAtom);
  const [selectedProviderForChat] = useAtom(selectedProviderForChatAtom);
  const [unlocked, setUnlocked] = useState(DEMO_MODE);
  const [password, setPassword] = useState('');

  useEffect(() => {
    tauriService.getAppVersion().then(setVersion);
  }, []);

  const handleUnlock = async () => {
    try {
      if (DEMO_MODE) {
        setUnlocked(true);
        return;
      }
      await tauriService.unlockApp(password);
      setUnlocked(true);
    } catch (e) {
      alert('Failed to unlock: ' + e);
    }
  };

  // Auto-unlock in demo mode
  useEffect(() => {
    if (DEMO_MODE && !unlocked) {
      setUnlocked(true);
    }
  }, [unlocked]);

  if (!unlocked) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
          <h1 className="text-2xl font-bold mb-4">AI Orchestrator v{version}</h1>
          <p className="mb-4 text-gray-400">Enter your master password to unlock</p>
          {DEMO_MODE && <p className="mb-4 text-xs text-yellow-400">DEMO MODE - Click unlock to continue</p>}
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
        ) : currentView === 'chat' ? (
          selectedModel && selectedProviderForChat ? (
            <ChatInterface
              modelId={selectedModel}
              providerId={selectedProviderForChat}
              defaultTitle="New Chat"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center p-8 bg-gray-800 rounded-lg">
                <p className="text-lg mb-2">⚠️ No model selected</p>
                <p className="text-sm mb-4">Please select a provider and model from the providers page first</p>
                {DEMO_MODE && <p className="text-xs text-yellow-400">💡 Demo providers are pre-configured - go to Providers page</p>}
              </div>
            </div>
          )
        ) : currentView === 'compare' ? (
          <div className="h-full">
            <ComparisonView />
          </div>
        ) : currentView === 'agents' ? (
          <div className="h-full">
            <AgentWorkspace />
          </div>
        ) : (
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">AI Orchestrator</h1>
            <p className="text-gray-400">Version: {version} {DEMO_MODE && '(Demo Mode)'}</p>
            <div className="mt-8 p-4 bg-gray-800 rounded">
              <p className="text-lg font-semibold mb-2">🚀 Multi-Agent AI Orchestrator</p>
              <p className="text-gray-300 mb-2">Build and execute AI workflows with multiple agents</p>
              <ul className="text-sm text-gray-400 list-disc list-inside">
                <li>💬 Chat with AI models (OpenAI, Anthropic, etc.)</li>
                <li>⚖️ Compare responses from multiple models side-by-side</li>
                <li>🤖 Build multi-agent workflows (Sequential, Parallel, Evaluator)</li>
              </ul>
              {DEMO_MODE && <p className="mt-4 text-xs text-yellow-400">💡 Demo mode: Mock responses enabled</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
