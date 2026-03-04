import { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { atom } from 'jotai';
import { providersAtom, selectedProviderAtom, type ProviderConfig, type ModelInfo } from '@/stores/provider-atom';
import { removeProvider, listProviderModels } from '@/services/provider-service';
import { selectedModelAtom, selectedProviderForChatAtom, currentViewAtom } from '@/stores/atoms';
import { ProviderForm } from './provider-form';

const showModelsAtom = atom<Map<string, ModelInfo[]>>(new Map());

export function ProviderList() {
  const [providers, setProviders] = useAtom(providersAtom);
  const [selectedProvider, setSelectedProvider] = useAtom(selectedProviderAtom);
  const [showModels, setShowModels] = useAtom(showModelsAtom);
  const [showAddForm, setShowAddForm] = useState(false);
  const setSelectedModel = useSetAtom(selectedModelAtom);
  const setSelectedProviderForChat = useSetAtom(selectedProviderForChatAtom);
  const setCurrentView = useSetAtom(currentViewAtom);

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this provider?')) return;
    try {
      await removeProvider(id);
      setProviders(providers.filter((p) => p.id !== id));
      if (selectedProvider?.id === id) {
        setSelectedProvider(null);
      }
    } catch (error) {
      console.error('Failed to remove provider:', error);
    }
  };

  const handleShowModels = async (provider: ProviderConfig) => {
    try {
      const models: ModelInfo[] = await listProviderModels(provider.id);
      setShowModels(new Map(showModels).set(provider.id, models));
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const handleStartChat = (providerId: string, modelId: string) => {
    setSelectedProviderForChat(providerId);
    setSelectedModel(modelId);
    setCurrentView('chat');
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Providers</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 text-sm"
        >
          + Add Provider
        </button>
      </div>

      {providers.length === 0 ? (
        <div className="text-center text-zinc-500 py-8">
          <p>No providers configured</p>
          <p className="text-sm mt-1">Add a provider to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className={`p-3 rounded border ${
                selectedProvider?.id === provider.id
                  ? 'border-blue-500 bg-zinc-800'
                  : 'border-zinc-700 bg-zinc-900'
              }`}
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => setSelectedProvider(provider)}
                >
                  <div className="font-medium">{provider.name}</div>
                  <div className="text-sm text-zinc-400 capitalize">
                    {provider.provider_type}
                  </div>
                  {provider.base_url && (
                    <div className="text-xs text-zinc-500 mt-1">
                      {provider.base_url}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleShowModels(provider)}
                    className="px-2 py-1 text-xs bg-zinc-700 rounded hover:bg-zinc-600"
                  >
                    Models
                  </button>
                  <button
                    onClick={() => handleRemove(provider.id)}
                    className="px-2 py-1 text-xs bg-red-900/50 rounded hover:bg-red-900"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {showModels.get(provider.id) && (
                <div className="mt-2 pt-2 border-t border-zinc-700">
                  <div className="text-xs text-zinc-400 mb-2">Available Models:</div>
                  <div className="space-y-1">
                    {showModels.get(provider.id)!.map((model) => (
                      <div
                        key={model.id}
                        className="flex items-center justify-between p-2 bg-zinc-800 rounded"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{model.name}</div>
                          {model.context_length && (
                            <div className="text-xs text-zinc-500">
                              Context: {model.context_length.toLocaleString()} tokens
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleStartChat(provider.id, model.id)}
                          className="ml-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium"
                        >
                          Start Chat
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddForm && (
        <ProviderForm onClose={() => setShowAddForm(false)} />
      )}
    </div>
  );
}
