import { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { atom } from 'jotai';
import { providersAtom, providerModelsAtom, selectedProviderAtom, type ProviderConfig, type ModelInfo } from '@/stores/provider-atom';
import { removeProvider } from '@/services/provider-service';
import { selectedModelAtom, selectedProviderForChatAtom, currentViewAtom } from '@/stores/atoms';
import { ProviderForm } from './provider-form';

const showModelsAtom = atom<Map<string, ModelInfo[]>>(new Map());

// Demo mode flag
const DEMO_MODE = true;

export function ProviderList() {
  const [providers, setProviders] = useAtom(providersAtom);
  const [providerModels] = useAtom(providerModelsAtom);
  const [selectedProvider, setSelectedProvider] = useAtom(selectedProviderAtom);
  const [showModels, setShowModels] = useAtom(showModelsAtom);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderConfig | null>(null);
  const [providerToDelete, setProviderToDelete] = useState<ProviderConfig | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const setSelectedModel = useSetAtom(selectedModelAtom);
  const setSelectedProviderForChat = useSetAtom(selectedProviderForChatAtom);
  const setCurrentView = useSetAtom(currentViewAtom);

  const handleRemoveClick = (provider: ProviderConfig) => {
    console.log('Remove clicked for provider:', provider.id);
    setProviderToDelete(provider);
  };

  const confirmRemove = async () => {
    if (!providerToDelete) return;

    console.log('Confirming removal of provider:', providerToDelete.id);
    setIsDeleting(true);
    try {
      console.log('Calling removeProvider with id:', providerToDelete.id);
      await removeProvider(providerToDelete.id);
      console.log('Provider removed successfully, reloading list');
      const updatedProviders = await import('@/services/provider-service').then(m => m.listProviders());
      console.log('Providers reloaded:', updatedProviders.length);
      setProviders(updatedProviders);
      if (selectedProvider?.id === providerToDelete.id) {
        setSelectedProvider(null);
      }
      console.log('Remove completed successfully');
      setProviderToDelete(null);
    } catch (error) {
      console.error('Failed to remove provider:', error);
      alert('Failed to remove provider: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelRemove = () => {
    console.log('Remove cancelled by user');
    setProviderToDelete(null);
  };

  const handleEdit = (provider: ProviderConfig) => {
    console.log('Edit clicked for provider:', provider.id, provider.name);
    setEditingProvider(provider);
    setShowAddForm(true);
    console.log('Edit form should now be visible');
  };

  const handleShowModels = async (provider: ProviderConfig) => {
    try {
      // In demo mode, use pre-loaded models from atom
      if (DEMO_MODE && provider.id.startsWith('demo-')) {
        const models = providerModels.get(provider.id) || [];
        setShowModels(new Map(showModels).set(provider.id, models));
        return;
      }

      // In production mode, call Tauri backend
      const { listProviderModels } = await import('@/services/provider-service');
      const models: ModelInfo[] = await listProviderModels(provider.id);
      setShowModels(new Map(showModels).set(provider.id, models));
    } catch (error) {
      console.error('Failed to load models:', error);
      // Show demo models as fallback
      const models = providerModels.get(provider.id) || [];
      setShowModels(new Map(showModels).set(provider.id, models));
    }
  };

  const handleStartChat = (providerId: string, modelId: string) => {
    setSelectedProviderForChat(providerId);
    setSelectedModel(modelId);
    setCurrentView('chat');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Providers</h2>
          <p className="text-sm text-text-secondary mt-1">Configure your AI model providers</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 bg-accent-primary hover:bg-accent-primary-hover text-white font-medium px-4 py-2.5 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:ring-offset-2 focus:ring-offset-primary"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Provider
        </button>
      </div>

      {providers.length === 0 ? (
        <div className="text-center py-16 bg-elevated rounded-2xl border border-border-subtle">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-tertiary rounded-2xl mb-4">
            <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No Providers Configured</h3>
          <p className="text-sm text-text-secondary mb-4">Add a provider to get started</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 bg-accent-primary hover:bg-accent-primary-hover text-white font-medium px-4 py-2 rounded-xl transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Your First Provider
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className={`bg-elevated rounded-2xl border transition-all duration-200 ${
                selectedProvider?.id === provider.id
                  ? 'border-accent-primary/50 shadow-lg shadow-accent-primary/5'
                  : 'border-border-subtle hover:border-border-default'
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => setSelectedProvider(provider)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {provider.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{provider.name}</div>
                        <div className="text-sm text-text-secondary capitalize flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-tertiary text-xs font-medium">
                            {provider.provider_type}
                          </span>
                        </div>
                      </div>
                    </div>
                    {provider.base_url && (
                      <div className="text-xs text-text-tertiary mt-2 font-mono bg-tertiary px-3 py-1.5 rounded-lg inline-block">
                        {provider.base_url}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleShowModels(provider)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-tertiary hover:bg-border-default rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      Models
                    </button>
                    <button
                      onClick={() => handleEdit(provider)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleRemoveClick(provider)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-accent-error/10 hover:bg-accent-error/20 text-accent-error rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-error/50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              {showModels.get(provider.id) && (
                <div className="border-t border-border-subtle p-5 bg-tertiary/30 rounded-b-2xl">
                  <div className="text-xs text-text-secondary font-medium mb-3 uppercase tracking-wide">Available Models</div>
                  <div className="space-y-2">
                    {showModels.get(provider.id)!.map((model) => (
                      <div
                        key={model.id}
                        className="flex items-center justify-between p-3 bg-elevated border border-border-subtle rounded-xl hover:border-accent-primary/50 transition-colors duration-200"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{model.name}</div>
                          {model.context_length && (
                            <div className="text-xs text-text-tertiary mt-1">
                              {model.context_length.toLocaleString()} tokens
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleStartChat(provider.id, model.id)}
                          className="ml-3 inline-flex items-center gap-1.5 px-4 py-2 bg-accent-primary hover:bg-accent-primary-hover rounded-xl text-xs font-medium text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 whitespace-nowrap"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
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
        <ProviderForm
          providerToEdit={editingProvider}
          onClose={() => {
            setShowAddForm(false);
            setEditingProvider(null);
          }}
        />
      )}

      {providerToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-elevated rounded-lg p-6 w-full max-w-md border border-border-subtle shadow-xl">
            <h3 className="text-xl font-semibold mb-2 text-text-primary">Remove Provider</h3>
            <p className="text-text-secondary mb-6">
              Are you sure you want to remove <span className="font-semibold text-text-primary">{providerToDelete.name}</span>?
              <br />
              <span className="text-sm text-text-tertiary">This action cannot be undone.</span>
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelRemove}
                disabled={isDeleting}
                className="px-4 py-2 bg-surface border border-border-subtle text-text-primary rounded-xl hover:bg-tertiary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                disabled={isDeleting}
                className="px-4 py-2 bg-accent-error hover:bg-accent-error/90 text-white rounded-xl disabled:opacity-50"
              >
                {isDeleting ? 'Removing...' : 'Remove Provider'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
