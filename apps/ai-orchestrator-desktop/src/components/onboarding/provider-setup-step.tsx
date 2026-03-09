import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface ProviderSetupStepProps {
  onNext: (configuredProviders: any[]) => void;
  onBack: () => void;
}

export function ProviderSetupStep({ onNext, onBack }: ProviderSetupStepProps) {
  const [providers, setProviders] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleProviderChange = (providerType: string, apiKey: string) => {
    setProviders(prev => ({
      ...prev,
      [providerType]: apiKey
    }));
    setError('');
  };

  const handleValidateProvider = async (providerType: string, apiKey: string) => {
    if (!apiKey) return false;

    try {
      await invoke('validate_provider_api_key', {
        providerType,
        apiKey
      });
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const configuredProviders = [];

      // Try to add each provider with an API key
      for (const [providerType, apiKey] of Object.entries(providers)) {
        if (apiKey.trim()) {
          const isValid = await handleValidateProvider(providerType, apiKey);
          if (isValid) {
            await invoke('add_provider', {
              id: `${providerType}-${Date.now()}`,
              name: providerType.charAt(0).toUpperCase() + providerType.slice(1),
              providerType,
              apiKey,
              baseUrl: null
            });
            configuredProviders.push({ providerType, configured: true });
          }
        }
      }

      // Even if no providers configured, allow continuing
      onNext(configuredProviders);
    } catch (err: any) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Configurar Proveedores de IA
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Agrega tus claves de API de proveedores de IA para comenzar. Puedes agregar más tarde.
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <span className="text-2xl mr-3">💡</span>
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Opcional:</strong> Puedes omitir este paso y agregar proveedores más tarde en el menú Configuración.
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="openai-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Clave API de OpenAI (Opcional)
          </label>
          <input
            id="openai-key"
            type="password"
            value={providers.openai || ''}
            onChange={e => handleProviderChange('openai', e.target.value)}
            placeholder="sk-..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white font-mono text-sm"
          />
        </div>

        <div>
          <label htmlFor="anthropic-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Clave API de Anthropic (Opcional)
          </label>
          <input
            id="anthropic-key"
            type="password"
            value={providers.anthropic || ''}
            onChange={e => handleProviderChange('anthropic', e.target.value)}
            placeholder="sk-ant-..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white font-mono text-sm"
          />
        </div>

        <div>
          <label htmlFor="google-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Clave API de Google AI (Opcional)
          </label>
          <input
            id="google-key"
            type="password"
            value={providers.google || ''}
            onChange={e => handleProviderChange('google', e.target.value)}
            placeholder="AIza..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white font-mono text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-xl mr-2">❌</span>
            <span className="text-sm text-red-800 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Atrás
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Configurando...' : 'Continuar'}
        </button>
      </div>
    </form>
  );
}
