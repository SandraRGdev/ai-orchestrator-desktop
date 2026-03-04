import { useAtom } from 'jotai';
import { providersAtom } from '../../stores/provider-atom';
import { comparisonPromptAtom, selectedModelsAtom, comparisonLoadingAtom } from '../../stores/comparison-atom';
import type { ModelConfig } from '../../types/generated';

interface ComparisonInputProps {
  onCompare: (prompt: string, models: ModelConfig[]) => void;
}

export function ComparisonInput({ onCompare }: ComparisonInputProps) {
  const [providers] = useAtom(providersAtom);
  const [prompt, setPrompt] = useAtom(comparisonPromptAtom);
  const [selectedModels, setSelectedModels] = useAtom(selectedModelsAtom);
  const [loading] = useAtom(comparisonLoadingAtom);

  // Flatten all models from providers with their provider info
  const availableModels = providers.flatMap(p =>
    p.enabled ? [{
      id: `${p.id}-${p.name}`,
      modelId: p.id, // Use provider.id as the model identifier for now
      providerId: p.id,
      providerName: p.name,
      name: `${p.name} (Default)`,
    }] : []
  );

  const handleModelToggle = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      setSelectedModels(selectedModels.filter(id => id !== modelId));
    } else {
      setSelectedModels([...selectedModels, modelId]);
    }
  };

  const handleCompare = () => {
    const models = availableModels
      .filter(m => selectedModels.includes(m.id))
      .map(m => ({ provider_id: m.providerId, model_id: m.modelId }));

    if (models.length >= 2 && prompt.trim()) {
      onCompare(prompt.trim(), models);
    }
  };

  const isDisabled = loading || selectedModels.length < 2 || !prompt.trim();

  return (
    <div className="border-b border-gray-700 p-4 space-y-4 bg-gray-800">
      <div>
        <label className="text-sm font-medium text-gray-300 block mb-2">Prompt to compare:</label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Enter a prompt to compare across models..."
          className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
          disabled={loading}
        />
      </div>

      {availableModels.length > 0 ? (
        <div>
          <label className="text-sm font-medium text-gray-300 block mb-2">
            Select models to compare (min 2):
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {availableModels.map(model => (
              <label
                key={model.id}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                  selectedModels.includes(model.id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedModels.includes(model.id)}
                  onChange={() => handleModelToggle(model.id)}
                  className="rounded"
                  disabled={loading}
                />
                <span className="text-sm">{model.name}</span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-gray-500 text-sm">
          No providers configured. Add providers from the Providers page first.
        </div>
      )}

      <button
        onClick={handleCompare}
        disabled={isDisabled}
        className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors ${
          isDisabled
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? 'Comparing...' : `Compare (${selectedModels.length} models)`}
      </button>
    </div>
  );
}
