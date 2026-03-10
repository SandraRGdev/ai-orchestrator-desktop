import { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { atom } from 'jotai';
import { providersAtom, providerModelsAtom, selectedProviderAtom, type ProviderConfig, type ModelInfo } from '@/stores/provider-atom';
import { removeProvider } from '@/services/provider-service';
import { selectedModelAtom, selectedProviderForChatAtom, currentViewAtom } from '@/stores/atoms';
import { ProviderForm } from './provider-form';

const showModelsAtom = atom<Map<string, ModelInfo[]>>(new Map());
const modelFiltersAtom = atom<Map<string, { search: string; freeOnly: boolean }>>(new Map());

// Demo mode flag
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

function getCostRank(model: Pick<ModelInfo, 'input_cost_per_1k' | 'output_cost_per_1k'>): number {
  const status = getCostStatus(model);
  if (status === 'free') return 0;
  if (status === 'paid') return 1;
  return 2;
}

function sortModelsByCostAndName(models: ModelInfo[]): ModelInfo[] {
  return [...models].sort((a, b) => {
    const rankDiff = getCostRank(a) - getCostRank(b);
    if (rankDiff !== 0) return rankDiff;
    return a.name.localeCompare(b.name);
  });
}

export function ProviderList() {
  const [providers, setProviders] = useAtom(providersAtom);
  const [providerModels] = useAtom(providerModelsAtom);
  const [selectedProvider, setSelectedProvider] = useAtom(selectedProviderAtom);
  const [showModels, setShowModels] = useAtom(showModelsAtom);
  const [modelFilters, setModelFilters] = useAtom(modelFiltersAtom);
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
      alert('No se pudo eliminar el proveedor: ' + (error instanceof Error ? error.message : 'Error desconocido'));
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
    if (showModels.has(provider.id)) {
      const next = new Map(showModels);
      next.delete(provider.id);
      setShowModels(next);
      return;
    }

    try {
      // In demo mode, use pre-loaded models from atom
      if (DEMO_MODE && provider.id.startsWith('demo-')) {
        const models = sortModelsByCostAndName(providerModels.get(provider.id) || []);
        setShowModels(new Map(showModels).set(provider.id, models));
        setModelFilters(new Map(modelFilters).set(provider.id, { search: '', freeOnly: false }));
        return;
      }

      // In production mode, call Tauri backend
      const { listProviderModels } = await import('@/services/provider-service');
      const models: ModelInfo[] = sortModelsByCostAndName(await listProviderModels(provider.id));
      setShowModels(new Map(showModels).set(provider.id, models));
      setModelFilters(new Map(modelFilters).set(provider.id, { search: '', freeOnly: false }));
    } catch (error) {
      console.error('Failed to load models:', error);
      // Show demo models as fallback
      const models = sortModelsByCostAndName(providerModels.get(provider.id) || []);
      setShowModels(new Map(showModels).set(provider.id, models));
      setModelFilters(new Map(modelFilters).set(provider.id, { search: '', freeOnly: false }));
    }
  };

  const updateFilter = (providerId: string, patch: Partial<{ search: string; freeOnly: boolean }>) => {
    const current = modelFilters.get(providerId) ?? { search: '', freeOnly: false };
    setModelFilters(new Map(modelFilters).set(providerId, { ...current, ...patch }));
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
          <h2 className="text-2xl font-bold">Proveedores</h2>
          <p className="text-sm text-text-secondary mt-1">Configura tus proveedores de modelos de IA</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 bg-accent-primary hover:bg-accent-primary-hover text-white font-medium px-4 py-2.5 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:ring-offset-2 focus:ring-offset-primary"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar proveedor
        </button>
      </div>

      {providers.length === 0 ? (
        <div className="text-center py-16 bg-elevated rounded-2xl border border-border-subtle">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-tertiary rounded-2xl mb-4">
            <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">No hay proveedores configurados</h3>
          <p className="text-sm text-text-secondary mb-4">Agrega un proveedor para empezar</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 bg-accent-primary hover:bg-accent-primary-hover text-white font-medium px-4 py-2 rounded-xl transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agrega tu primer proveedor
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
                      {showModels.has(provider.id) ? 'Ocultar' : 'Modelos'}
                    </button>
                    <button
                      onClick={() => handleEdit(provider)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={() => handleRemoveClick(provider)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-accent-error/10 hover:bg-accent-error/20 text-accent-error rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-error/50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>

              {showModels.get(provider.id) && (
                <div className="border-t border-border-subtle p-5 bg-tertiary/30 rounded-b-2xl">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                    <div className="text-xs text-text-secondary font-medium uppercase tracking-wide">Modelos disponibles</div>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={modelFilters.get(provider.id)?.search ?? ''}
                        onChange={(e) => updateFilter(provider.id, { search: e.target.value })}
                        placeholder="Filtrar modelos..."
                        className="w-48 bg-surface border border-border-subtle rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                      />
                      <label className="inline-flex items-center gap-2 text-xs text-text-secondary">
                        <input
                          type="checkbox"
                          checked={modelFilters.get(provider.id)?.freeOnly ?? false}
                          onChange={(e) => updateFilter(provider.id, { freeOnly: e.target.checked })}
                          className="rounded"
                        />
                        Solo gratuitos
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {showModels.get(provider.id)!
                      .filter((model) => {
                        const filter = modelFilters.get(provider.id) ?? { search: '', freeOnly: false };
                        const bySearch = model.name.toLowerCase().includes(filter.search.trim().toLowerCase());
                        const byFree = !filter.freeOnly || getCostStatus(model) === 'free';
                        return bySearch && byFree;
                      })
                      .map((model) => (
                      <div
                        key={model.id}
                        className="flex items-center justify-between p-3 bg-elevated border border-border-subtle rounded-xl hover:border-accent-primary/50 transition-colors duration-200"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{model.name}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {model.context_length && (
                              <span className="text-xs text-text-tertiary">
                                {model.context_length.toLocaleString()} tokens
                              </span>
                            )}
                            {getCostStatus(model) === 'free' && (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-accent-success/15 text-accent-success border border-accent-success/30">
                                Gratis
                              </span>
                            )}
                            {getCostStatus(model) === 'paid' && (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-accent-warning/15 text-accent-warning border border-accent-warning/30">
                                De pago
                              </span>
                            )}
                            {getCostStatus(model) === 'unknown' && (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-tertiary text-text-tertiary border border-border-subtle">
                                Costo no disponible
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleStartChat(provider.id, model.id)}
                          className="ml-3 inline-flex items-center gap-1.5 px-4 py-2 bg-accent-primary hover:bg-accent-primary-hover rounded-xl text-xs font-medium text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 whitespace-nowrap"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          Iniciar chat
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
            <h3 className="text-xl font-semibold mb-2 text-text-primary">Eliminar proveedor</h3>
            <p className="text-text-secondary mb-6">
              ¿Seguro que quieres eliminar <span className="font-semibold text-text-primary">{providerToDelete.name}</span>?
              <br />
              <span className="text-sm text-text-tertiary">Esta acción no se puede deshacer.</span>
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelRemove}
                disabled={isDeleting}
                className="px-4 py-2 bg-surface border border-border-subtle text-text-primary rounded-xl hover:bg-tertiary disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmRemove}
                disabled={isDeleting}
                className="px-4 py-2 bg-accent-error hover:bg-accent-error/90 text-white rounded-xl disabled:opacity-50"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar proveedor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
