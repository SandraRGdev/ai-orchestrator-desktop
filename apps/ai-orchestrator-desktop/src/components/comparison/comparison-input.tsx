import { useAtom } from 'jotai';
import { providerModelsAtom, providersAtom } from '../../stores/provider-atom';
import { comparisonPromptAtom, selectedModelsAtom, comparisonLoadingAtom } from '../../stores/comparison-atom';
import type { ModelConfig } from '../../types/generated';
import { useState, useEffect } from 'react';
import { listProviderModels } from '../../services/provider-service';

interface ComparisonInputProps {
  onCompare: (prompt: string, models: ModelConfig[]) => void;
}

interface AvailableModel {
  id: string;
  modelId: string;
  providerId: string;
  providerName: string;
  name: string;
  inputCostPer1k?: number;
  outputCostPer1k?: number;
}

type CostStatus = 'free' | 'paid' | 'unknown';

function getCostStatus(model: Pick<AvailableModel, 'inputCostPer1k' | 'outputCostPer1k'>): CostStatus {
  const hasInput = typeof model.inputCostPer1k === 'number';
  const hasOutput = typeof model.outputCostPer1k === 'number';
  if (!hasInput && !hasOutput) return 'unknown';
  const input = model.inputCostPer1k ?? 0;
  const output = model.outputCostPer1k ?? 0;
  return input === 0 && output === 0 ? 'free' : 'paid';
}

export function ComparisonInput({ onCompare }: ComparisonInputProps) {
  const [providers] = useAtom(providersAtom);
  const [providerModels] = useAtom(providerModelsAtom);
  const [prompt, setPrompt] = useAtom(comparisonPromptAtom);
  const [selectedModels, setSelectedModels] = useAtom(selectedModelsAtom);
  const [loading] = useAtom(comparisonLoadingAtom);
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);

  // Load models for all providers from backend (not cache)
  const loadModels = async () => {
    setLoadingModels(true);
    try {
      const models: AvailableModel[] = [];

      for (const provider of providers) {
        if (!provider.enabled) continue;

        try {
          console.log(`Loading models for provider: ${provider.id}`);
          // Demo providers use local demo model catalog
          if (provider.id.startsWith('demo-')) {
            const demoModels = providerModels.get(provider.id) || [];
            for (const model of demoModels) {
              models.push({
                id: `${provider.id}-${model.id}`,
                modelId: model.id,
                providerId: provider.id,
                providerName: provider.name,
                name: model.name,
                inputCostPer1k: model.input_cost_per_1k,
                outputCostPer1k: model.output_cost_per_1k,
              });
            }
            continue;
          }

          // Real providers load models from backend
          const modelsForProvider = await listProviderModels(provider.id);

          if (modelsForProvider.length === 0) {
            console.log(`No models returned for ${provider.id}, using default`);
            models.push({
              id: `${provider.id}-default`,
              modelId: provider.id,
              providerId: provider.id,
              providerName: provider.name,
              name: `${provider.name} (Predeterminado)`,
            });
          } else {
            console.log(`Loaded ${modelsForProvider.length} models for ${provider.id}`);
            for (const model of modelsForProvider) {
              models.push({
                id: `${provider.id}-${model.id}`,
                modelId: model.id,
                providerId: provider.id,
                providerName: provider.name,
                name: model.name,
                inputCostPer1k: model.input_cost_per_1k,
                outputCostPer1k: model.output_cost_per_1k,
              });
            }
          }
        } catch (error) {
          console.error(`Failed to load models for ${provider.id}:`, error);
          // Add a default fallback
          models.push({
            id: `${provider.id}-default`,
            modelId: provider.id,
            providerId: provider.id,
            providerName: provider.name,
            name: `${provider.name} (Predeterminado)`,
          });
        }
      }

      console.log(`Total available models: ${models.length}`);
      setAvailableModels(models);
      const validIds = new Set(models.map((m) => m.id));
      setSelectedModels((prev) => prev.filter((id) => validIds.has(id)));
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  // Load models when providers change
  useEffect(() => {
    loadModels();
  }, [providers, providerModels]);

  const handleModelToggle = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      setSelectedModels(selectedModels.filter(id => id !== modelId));
    } else {
      setSelectedModels([...selectedModels, modelId]);
    }
  };

  const handleCompare = () => {
    console.log('Selected model IDs:', selectedModels);
    console.log('Available models:', availableModels);

    const models = availableModels
      .filter(m => selectedModels.includes(m.id))
      .map(m => ({
        provider_id: m.providerId,
        model_id: m.modelId
      }));

    console.log('Sending models for comparison:', models);

    if (models.length >= 2 && prompt.trim()) {
      onCompare(prompt.trim(), models);
    } else if (models.length < 2) {
      alert('Selecciona al menos 2 modelos para comparar');
    } else if (!prompt.trim()) {
      alert('Ingresa un prompt para comparar');
    }
  };

  const validSelectedCount = availableModels.filter((m) => selectedModels.includes(m.id)).length;
  const isDisabled = loading || loadingModels || validSelectedCount < 2 || !prompt.trim();
  const visibleModels = freeOnly
    ? availableModels.filter((model) => getCostStatus(model) === 'free')
    : availableModels;

  const modelsByProvider = visibleModels.reduce<Record<string, AvailableModel[]>>((acc, model) => {
    if (!acc[model.providerName]) {
      acc[model.providerName] = [];
    }
    acc[model.providerName].push(model);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col bg-elevated border-r border-border-subtle">
      <div className="p-5 border-b border-border-subtle space-y-3">
        <label className="text-sm font-semibold text-text-primary block">Prompt para comparar</label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Ingresa un prompt para comparar entre modelos..."
          className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-3 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all resize-none"
          rows={4}
          disabled={loading}
        />
        <button
          onClick={handleCompare}
          disabled={isDisabled}
          className={`w-full font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
            isDisabled
              ? 'bg-tertiary text-text-tertiary cursor-not-allowed'
              : 'bg-accent-primary hover:bg-accent-primary-hover text-white shadow-lg shadow-accent-primary/25 focus:outline-none focus:ring-2 focus:ring-accent-primary/50'
          }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Comparando...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Comparar ({validSelectedCount})
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="text-xs uppercase tracking-wider text-text-tertiary">
            Modelos disponibles (min 2)
          </div>
          <label className="inline-flex items-center gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={freeOnly}
              onChange={(e) => setFreeOnly(e.target.checked)}
              className="rounded"
            />
            Solo gratuitos
          </label>
        </div>
        {loadingModels ? (
          <div className="text-text-tertiary text-sm bg-tertiary/50 px-4 py-3 rounded-xl border border-border-subtle">
            Cargando modelos...
          </div>
        ) : availableModels.length > 0 ? (
          <div className="space-y-4">
            {Object.entries(modelsByProvider).map(([providerName, models]) => (
              <div key={providerName} className="space-y-2">
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide px-1">
                  {providerName}
                </h4>
                <div className="space-y-1.5">
                  {models.map((model) => (
                    <div
                      key={model.id}
                      className={`p-2.5 rounded-lg transition-all duration-200 border ${
                        selectedModels.includes(model.id)
                          ? 'bg-accent-primary/15 border-accent-primary/50 text-text-primary'
                          : 'bg-tertiary/60 border-border-subtle text-text-secondary hover:bg-tertiary hover:text-text-primary'
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedModels.includes(model.id)}
                          onChange={() => handleModelToggle(model.id)}
                          className="rounded"
                          disabled={loading}
                        />
                        <span className="text-sm truncate">{model.name}</span>
                      </label>
                      <div className="mt-2 pl-6">
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
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-text-tertiary text-sm bg-tertiary/50 px-4 py-3 rounded-xl border border-border-subtle">
            No hay proveedores configurados. Agrega proveedores desde la página de Proveedores primero.
          </div>
        )}
      </div>
    </div>
  );
}
