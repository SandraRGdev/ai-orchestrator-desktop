import { useEffect, useState } from 'react';
import { Sidebar } from './components/layout/sidebar';
import { ProviderList } from './components/providers';
import { ChatInterface } from './components/chat';
import { ComparisonView } from './components/comparison';
import { AgentWorkspace } from './components/agents/agent-workspace';
import { ErrorBoundary } from './components/ui/error-boundary';
import { OnboardingWizard } from './components/onboarding/onboarding-wizard';
import { CommandPalette } from './components/layout/command-palette';
import { useOnboarding } from './hooks/use-onboarding';
import { tauriService } from './services/tauri-service';
import { appVersionAtom, currentViewAtom, selectedModelAtom, selectedProviderForChatAtom } from './stores/atoms';
import { providerModelsAtom, providersAtom, type ModelInfo } from './stores/provider-atom';
import { currentConversationAtom, messagesAtom } from './stores/chat-atom';
import { listProviderModels, listProviders } from './services/provider-service';
import { useAtom, useSetAtom } from 'jotai';
import './styles.css';

// Demo mode - skip password for development
const DEMO_MODE = true;

type CostStatus = 'free' | 'paid' | 'unknown';

function getCostStatus(model: Pick<ModelInfo, 'input_cost_per_1k' | 'output_cost_per_1k'>): CostStatus {
  const hasInput = typeof model.input_cost_per_1k === 'number';
  const hasOutput = typeof model.output_cost_per_1k === 'number';
  if (!hasInput && !hasOutput) return 'unknown';
  const input = model.input_cost_per_1k ?? 0;
  const output = model.output_cost_per_1k ?? 0;
  return input === 0 && output === 0 ? 'free' : 'paid';
}

function App() {
  const [version, setVersion] = useAtom(appVersionAtom);
  const [currentView] = useAtom(currentViewAtom);
  const [selectedModel] = useAtom(selectedModelAtom);
  const [selectedProviderForChat] = useAtom(selectedProviderForChatAtom);
  const setSelectedModel = useSetAtom(selectedModelAtom);
  const setSelectedProviderForChat = useSetAtom(selectedProviderForChatAtom);
  const setCurrentConversation = useSetAtom(currentConversationAtom);
  const setMessages = useSetAtom(messagesAtom);
  const [providers] = useAtom(providersAtom);
  const setProviders = useSetAtom(providersAtom);
  const [providerModels] = useAtom(providerModelsAtom);
  const [unlocked, setUnlocked] = useState(DEMO_MODE);
  const [password, setPassword] = useState('');
  const [chatProviderChoice, setChatProviderChoice] = useState<string>('');
  const [chatModelChoice, setChatModelChoice] = useState<string>('');
  const [chatModelOptions, setChatModelOptions] = useState<ModelInfo[]>([]);
  const [chatFreeOnly, setChatFreeOnly] = useState(false);
  const [chatModelsLoading, setChatModelsLoading] = useState(false);

  // Onboarding hook
  const { isLoading: onboardingLoading, needsOnboarding, completeOnboarding } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    tauriService.getAppVersion().then(setVersion);
  }, []);

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const configuredProviders = await listProviders();
        setProviders(configuredProviders);
      } catch (error) {
        console.error('Failed to load providers from backend:', error);
      }
    };
    loadProviders();
  }, [setProviders]);

  useEffect(() => {
    setShowOnboarding(needsOnboarding);
  }, [needsOnboarding]);

  const handleOnboardingComplete = async () => {
    try {
      await completeOnboarding();
      setShowOnboarding(false);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const handleUnlock = async () => {
    try {
      if (DEMO_MODE) {
        setUnlocked(true);
        return;
      }
      await tauriService.unlockApp(password);
      setUnlocked(true);
    } catch (e) {
      alert('No se pudo desbloquear: ' + e);
    }
  };

  // Auto-unlock in demo mode
  useEffect(() => {
    if (DEMO_MODE && !unlocked) {
      setUnlocked(true);
    }
  }, [unlocked]);

  useEffect(() => {
    if (currentView !== 'chat') return;
    if (chatProviderChoice) return;

    const firstProviderId = selectedProviderForChat
      ?? providers.find((p) => p.enabled && !p.id.startsWith('demo-'))?.id
      ?? providers.find((p) => p.enabled)?.id
      ?? '';

    if (firstProviderId) {
      setChatProviderChoice(firstProviderId);
    }
  }, [currentView, chatProviderChoice, providers, selectedProviderForChat]);

  useEffect(() => {
    if (currentView !== 'chat' || !chatProviderChoice) {
      setChatModelOptions([]);
      setChatModelChoice('');
      return;
    }

    let isCancelled = false;
    const loadModels = async () => {
      setChatModelsLoading(true);
      try {
        let models: ModelInfo[] = [];

        if (chatProviderChoice.startsWith('demo-')) {
          const demoModels = providerModels.get(chatProviderChoice) ?? [];
          models = demoModels;
        } else {
          const remoteModels = await listProviderModels(chatProviderChoice);
          models = remoteModels;
        }

        models = [...models].sort((a, b) => {
          const aRank = getCostStatus(a) === 'free' ? 0 : getCostStatus(a) === 'paid' ? 1 : 2;
          const bRank = getCostStatus(b) === 'free' ? 0 : getCostStatus(b) === 'paid' ? 1 : 2;
          if (aRank !== bRank) return aRank - bRank;
          return a.name.localeCompare(b.name);
        });

        if (!isCancelled) {
          setChatModelOptions(models);
          setChatModelChoice((prev) => {
            if (prev && models.some((m) => m.id === prev)) {
              return prev;
            }
            if (selectedModel && models.some((m) => m.id === selectedModel)) {
              return selectedModel;
            }
            return models[0]?.id ?? '';
          });
        }
      } catch (error) {
        console.error('Failed to load chat models:', error);
        if (!isCancelled) {
          setChatModelOptions([]);
          setChatModelChoice('');
        }
      } finally {
        if (!isCancelled) {
          setChatModelsLoading(false);
        }
      }
    };

    loadModels();
    return () => {
      isCancelled = true;
    };
  }, [currentView, chatProviderChoice, providerModels, selectedModel]);

  useEffect(() => {
    if (!chatFreeOnly) return;
    const freeModels = chatModelOptions.filter((m) => getCostStatus(m) === 'free');
    if (freeModels.length === 0) {
      setChatModelChoice('');
      return;
    }
    if (!freeModels.some((m) => m.id === chatModelChoice)) {
      setChatModelChoice(freeModels[0].id);
    }
  }, [chatFreeOnly, chatModelOptions, chatModelChoice]);

  useEffect(() => {
    if (currentView !== 'chat') return;
    if (selectedProviderForChat || selectedModel) return;
    if (!chatProviderChoice || !chatModelChoice) return;
    if (chatProviderChoice.startsWith('demo-')) return;

    setSelectedProviderForChat(chatProviderChoice);
    setSelectedModel(chatModelChoice);
  }, [
    currentView,
    selectedProviderForChat,
    selectedModel,
    chatProviderChoice,
    chatModelChoice,
    setSelectedProviderForChat,
    setSelectedModel,
  ]);

  const applyChatModelSelection = () => {
    if (!chatProviderChoice || !chatModelChoice) return;
    setCurrentConversation(null);
    setMessages([]);
    setSelectedProviderForChat(chatProviderChoice);
    setSelectedModel(chatModelChoice);
  };

  // Command palette commands
  const commands = [
    {
      id: 'new-chat',
      label: 'Nueva Conversación',
      icon: '💬',
      category: 'Conversación',
      action: () => {
        // Navigate to chat view
        window.location.href = '#/chat';
      },
    },
    {
      id: 'compare',
      label: 'Comparar Modelos',
      icon: '⚖️',
      category: 'Comparación',
      action: () => {
        window.location.href = '#/compare';
      },
    },
    {
      id: 'agents',
      label: 'Abrir Espacio de Agentes',
      icon: '🤖',
      category: 'Agentes',
      action: () => {
        window.location.href = '#/agents';
      },
    },
    {
      id: 'providers',
      label: 'Administrar Proveedores',
      icon: '⚙️',
      category: 'Configuración',
      action: () => {
        window.location.href = '#/providers';
      },
    },
  ];

  // Show loading state while checking onboarding
  if (onboardingLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-text-primary bg-primary">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 shadow-lg animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-text-secondary">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <ErrorBoundary>
        <div className="h-screen flex items-center justify-center text-text-primary relative overflow-hidden">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-primary opacity-50"></div>
          <div className="absolute inset-0 bg-gradient-secondary animate-pulse"></div>

          <div className="glass p-8 rounded-3xl shadow-2xl border border-border-accent w-full max-w-md mx-4 animate-fade-in relative z-10 glow-primary">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-3xl mb-4 shadow-lg glow-primary">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-2 text-gradient">AI Orchestrator</h1>
              <p className="text-text-secondary text-sm">Versión {version}</p>
            </div>

            <p className="mb-6 text-text-secondary text-center text-sm">Ingresa tu contraseña maestra para desbloquear</p>
            {DEMO_MODE && (
              <div className="mb-4 flex items-center justify-center gap-2 text-xs bg-accent-primary/10 text-accent-primary-light px-4 py-3 rounded-xl border border-accent-primary/20">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Modo Demo - Haz clic en desbloquear para continuar
              </div>
            )}

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              className="w-full bg-surface/50 border border-border-subtle rounded-xl px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all mb-4 backdrop-blur-sm"
              placeholder="Contraseña maestra"
            />
            <button
              onClick={handleUnlock}
              className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:ring-offset-2 focus:ring-offset-primary shadow-lg glow-primary hover:shadow-xl"
            >
              Desbloquear
            </button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      {/* Show onboarding wizard if needed */}
      {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}

      <CommandPalette commands={commands} />
      <div className="h-screen flex text-text-primary relative">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-primary opacity-30 pointer-events-none"></div>

        <Sidebar />
        <main className="flex-1 overflow-auto relative z-10">
          {currentView === 'providers' ? (
            <div className="max-w-4xl mx-auto">
              <ProviderList />
            </div>
          ) : currentView === 'chat' ? (
            <div className="h-full flex flex-col">
              <div className="border-b border-border-subtle bg-elevated/90 backdrop-blur-sm">
                <div className="px-4 py-3 md:px-6">
                  <div className="rounded-2xl border border-border-subtle bg-surface/50 p-3 md:p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,1fr)_minmax(320px,2fr)_auto] gap-3 items-end">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium uppercase tracking-wide text-text-tertiary">Proveedor</label>
                        <select
                          value={chatProviderChoice}
                          onChange={(e) => {
                            setChatProviderChoice(e.target.value);
                            setChatModelChoice('');
                          }}
                          className="h-10 w-full bg-surface border border-border-subtle text-text-primary rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                        >
                          <option value="">Selecciona proveedor...</option>
                          {providers.filter((p) => p.enabled && !p.id.startsWith('demo-')).map((provider) => (
                            <option key={provider.id} value={provider.id}>
                              {provider.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium uppercase tracking-wide text-text-tertiary">Modelo</label>
                        <select
                          value={chatModelChoice}
                          onChange={(e) => setChatModelChoice(e.target.value)}
                          disabled={!chatProviderChoice || chatModelsLoading}
                          className="h-10 w-full bg-surface border border-border-subtle text-text-primary rounded-xl px-3 text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                        >
                          {!chatProviderChoice ? (
                            <option value="">Selecciona proveedor primero...</option>
                          ) : chatModelsLoading ? (
                            <option value="">Cargando modelos...</option>
                          ) : (chatFreeOnly
                            ? chatModelOptions.filter((m) => getCostStatus(m) === 'free')
                            : chatModelOptions).length === 0 ? (
                            <option value="">No hay modelos disponibles</option>
                          ) : (
                            (chatFreeOnly
                              ? chatModelOptions.filter((m) => getCostStatus(m) === 'free')
                              : chatModelOptions).map((model) => (
                                <option key={model.id} value={model.id}>
                                  {model.name}
                                </option>
                              ))
                          )}
                        </select>
                      </div>

                      <button
                        onClick={applyChatModelSelection}
                        disabled={!chatProviderChoice || !chatModelChoice}
                        className="h-10 inline-flex items-center justify-center gap-2 bg-accent-primary hover:bg-accent-primary-hover disabled:bg-tertiary disabled:text-text-tertiary text-white text-sm font-semibold px-4 rounded-xl transition-colors whitespace-nowrap"
                      >
                        {selectedModel && selectedProviderForChat ? 'Cambiar modelo' : 'Empezar chat'}
                      </button>
                    </div>

                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="text-xs text-text-tertiary">
                        Elige proveedor y modelo para iniciar una conversación nueva.
                      </div>
                      <label className="inline-flex items-center gap-2 text-xs text-text-secondary">
                        <input
                          type="checkbox"
                          checked={chatFreeOnly}
                          onChange={(e) => setChatFreeOnly(e.target.checked)}
                          className="rounded"
                        />
                        Solo gratuitos
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {selectedModel && selectedProviderForChat ? (
                <ChatInterface
                  key={`${selectedProviderForChat}:${selectedModel}`}
                  modelId={selectedModel}
                  providerId={selectedProviderForChat}
                  defaultTitle="Nuevo chat"
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-text-secondary">
                  <div className="text-center p-8 bg-elevated rounded-2xl border border-border-subtle max-w-md mx-4">
                    <h3 className="text-lg font-semibold mb-2">Selecciona modelo para comenzar</h3>
                    <p className="text-sm text-text-secondary">Elige proveedor y modelo en la barra superior del chat.</p>
                  </div>
                </div>
              )}
            </div>
          ) : currentView === 'compare' ? (
            <div className="h-full">
              <ComparisonView />
            </div>
          ) : currentView === 'agents' ? (
            <div className="h-full">
              <AgentWorkspace />
            </div>
          ) : (
            <div className="p-8 max-w-4xl mx-auto">
              <div className="text-center mb-12 animate-fade-in">
                <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
                  AI Orchestrator
                </h1>
                <p className="text-text-secondary">Versión {version}</p>
                {DEMO_MODE && (
                  <div className="inline-flex items-center gap-2 text-xs bg-accent-warning/10 text-accent-warning px-3 py-1.5 rounded-full border border-accent-warning/20 mt-3">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    Modo Demo
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
                <div className="bg-elevated rounded-2xl border border-border-subtle p-6 hover:border-accent-primary/50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-accent-primary/10 rounded-xl mb-4">
                    <svg className="w-6 h-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Conversación</h3>
                  <p className="text-sm text-text-secondary">Chatea con modelos de IA de OpenAI, Anthropic y más</p>
                </div>

                <div className="bg-elevated rounded-2xl border border-border-subtle p-6 hover:border-accent-secondary/50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-accent-secondary/10 rounded-xl mb-4">
                    <svg className="w-6 h-6 text-accent-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Comparar</h3>
                  <p className="text-sm text-text-secondary">Compara respuestas de múltiples modelos simultáneamente</p>
                </div>

                <div className="bg-elevated rounded-2xl border border-border-subtle p-6 hover:border-accent-success/50 transition-colors duration-200">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-accent-success/10 rounded-xl mb-4">
                    <svg className="w-6 h-6 text-accent-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Flujos de Trabajo</h3>
                  <p className="text-sm text-text-secondary">Construye flujos de trabajo multi-agente con patrones secuenciales, paralelos y de evaluación</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
