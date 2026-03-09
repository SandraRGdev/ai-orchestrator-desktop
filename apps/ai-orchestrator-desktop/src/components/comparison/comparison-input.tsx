import { useAtom } from 'jotai';
import { providersAtom } from '../../stores/provider-atom';
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
}

export function ComparisonInput({ onCompare }: ComparisonInputProps) {
  const [providers] = useAtom(providersAtom);
  const [prompt, setPrompt] = useAtom(comparisonPromptAtom);
  const [selectedModels, setSelectedModels] = useAtom(selectedModelsAtom);
  const [loading] = useAtom(comparisonLoadingAtom);
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Load models for all providers from backend (not cache)
  const loadModels = async () => {
    setLoadingModels(true);
    try {
      const models: AvailableModel[] = [];

      for (const provider of providers) {
        if (!provider.enabled) continue;

        try {
          console.log(`Loading models for provider: ${provider.id}`);
          // Always load models from backend
          const modelsForProvider = await listProviderModels(provider.id);

          if (modelsForProvider.length === 0) {
            console.log(`No models returned for ${provider.id}, using default`);
            models.push({
              id: `${provider.id}-default`,
              modelId: provider.id,
              providerId: provider.id,
              providerName: provider.name,
              name: `${provider.name} (Default)`,
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
            name: `${provider.name} (Default)`,
          });
        }
      }

      console.log(`Total available models: ${models.length}`);
      setAvailableModels(models);
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  // Load models when providers change
  useEffect(() => {
    loadModels();
  }, [providers]);

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

  const isDisabled = loading || loadingModels || selectedModels.length < 2 || !prompt.trim();

  return (
    <div className="border-b border-border-subtle p-6 space-y-5 bg-elevated">
      <div>
        <label className="text-sm font-medium text-text-primary block mb-2">Prompt para comparar</label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Ingresa un prompt para comparar entre modelos..."
          className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-3 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-all resize-none"
          rows={3}
          disabled={loading}
        />
      </div>

      {loadingModels ? (
        <div className="text-text-tertiary text-sm bg-tertiary/50 px-4 py-3 rounded-xl border border-border-subtle">
          Cargando modelos...
        </div>
      ) : availableModels.length > 0 ? (
        <div>
          <label className="text-sm font-medium text-text-primary block mb-3">
            Selecciona modelos para comparar <span className="text-text-tertiary">(mín 2)</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {availableModels.map(model => (
              <label
                key={model.id}
                className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  selectedModels.includes(model.id)
                    ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/25'
                    : 'bg-tertiary text-text-secondary hover:bg-border-default hover:text-text-primary border border-border-subtle'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedModels.includes(model.id)}
                  onChange={() => handleModelToggle(model.id)}
                  className="rounded"
                  disabled={loading}
                />
                <span className="text-sm font-medium">{model.name}</span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-text-tertiary text-sm bg-tertiary/50 px-4 py-3 rounded-xl border border-border-subtle">
          No hay proveedores configurados. Agrega proveedores desde la página de Proveedores primero.
        </div>
      )}

      <button
        onClick={handleCompare}
        disabled={isDisabled}
        className={`w-full font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
          isDisabled
            ? 'bg-tertiary text-text-tertiary cursor-not-allowed'
            : 'bg-accent-primary hover:bg-accent-primary-hover text-white shadow-lg shadow-accent-primary/25 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:ring-offset-2 focus:ring-offset-elevated'
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
            Comparar ({selectedModels.length} modelos)
          </>
        )}
      </button>
    </div>
  );
}
