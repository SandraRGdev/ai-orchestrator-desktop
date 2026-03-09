import { useState, FormEvent, useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { providersAtom, type ProviderConfig } from '@/stores/provider-atom';
import { addProvider, updateProvider, validateApiKey } from '@/services/provider-service';

interface ProviderFormProps {
  onClose: () => void;
  providerToEdit?: ProviderConfig | null;
}

export function ProviderForm({ onClose, providerToEdit }: ProviderFormProps) {
  const [providerType, setProviderType] = useState<'openai' | 'anthropic' | 'google' | 'groq' | 'openrouter'>('openai');
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setProviders = useSetAtom(providersAtom);

  useEffect(() => {
    if (providerToEdit) {
      setProviderType(providerToEdit.provider_type as 'openai' | 'anthropic' | 'google' | 'groq' | 'openrouter');
      setName(providerToEdit.name);
      setBaseUrl(providerToEdit.base_url || '');
      // Don't pre-fill API key for security - user must enter it again
      setApiKey('');
    }
  }, [providerToEdit]);

  const handleValidate = async () => {
    if (!apiKey) return;
    setIsValidating(true);
    try {
      const valid = await validateApiKey(providerType, apiKey);
      setIsValid(valid);
    } catch {
      setIsValid(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log('Form submitted, providerToEdit:', providerToEdit?.id, 'name:', name, 'type:', providerType);

    // Validation
    if (!name) {
      console.log('Validation failed: name is empty');
      alert('Name is required');
      return;
    }

    // For new providers, API key is required
    if (!providerToEdit && !apiKey) {
      console.log('Validation failed: new provider without API key');
      alert('API Key is required for new providers');
      return;
    }

    // For editing, API key is required (we can't retrieve the existing one)
    if (providerToEdit && !apiKey) {
      console.log('Validation failed: edit without API key');
      alert('Please enter the API Key to update this provider');
      return;
    }

    console.log('Validation passed, starting submission');
    setIsSubmitting(true);
    try {
      if (providerToEdit) {
        // Update existing provider
        console.log('Updating provider:', {
          id: providerToEdit.id,
          name,
          providerType,
          baseUrl: baseUrl || undefined,
          hasApiKey: !!apiKey
        });
        await updateProvider(
          providerToEdit.id,
          name,
          providerType,
          apiKey,
          baseUrl || undefined
        );
        console.log('Provider updated successfully');
      } else {
        // Add new provider
        console.log('Adding new provider:', { name, providerType, baseUrl: baseUrl || undefined, hasApiKey: !!apiKey });
        await addProvider(
          name,
          providerType,
          apiKey,
          baseUrl || undefined
        );
        console.log('Provider added successfully');
      }

      console.log('Reloading providers list');
      // Reload providers list
      const providers = await import('@/services/provider-service').then(m => m.listProviders());
      console.log('Providers reloaded:', providers.length, 'providers');
      setProviders(providers);
      console.log('Calling onClose to close form');
      onClose();
    } catch (error) {
      console.error('Failed to save provider:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      alert('Failed to save provider: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      console.log('Setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md border border-zinc-700">
        <h2 className="text-xl font-semibold mb-4">{providerToEdit ? 'Editar Proveedor' : 'Agregar Proveedor'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Tipo de Proveedor</label>
            <select
              value={providerType}
              onChange={(e) => {
                setProviderType(e.target.value as 'openai' | 'anthropic' | 'google' | 'groq' | 'openrouter');
                setIsValid(null);
              }}
              className="w-full bg-surface border border-border-subtle text-text-primary rounded-xl px-3 py-2 placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 [&>option]:bg-tertiary [&>option]:text-text-primary"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google (Gemini)</option>
              <option value="groq">Groq</option>
              <option value="openrouter">OpenRouter</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mi cuenta OpenAI"
              className="w-full bg-surface border border-border-subtle text-text-primary rounded-xl px-3 py-2 placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">API Key</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setIsValid(null);
                }}
                placeholder={
                  providerType === 'openai' ? 'sk-...' :
                  providerType === 'anthropic' ? 'sk-ant-...' :
                  providerType === 'google' ? 'AIza...' :
                  providerType === 'openrouter' ? 'sk-or-...' :
                  'gsk_...'
                }
                className="flex-1 bg-surface border border-border-subtle text-text-primary rounded-xl px-3 py-2 placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                required
              />
              <button
                type="button"
                onClick={handleValidate}
                disabled={!apiKey || isValidating}
                className="px-3 py-2 bg-surface border border-border-subtle text-text-primary rounded-xl hover:bg-tertiary disabled:opacity-50"
              >
                {isValidating ? '...' : isValid === true ? '✓' : isValid === false ? '✗' : 'Probar'}
              </button>
            </div>
          </div>

          {(providerType === 'openai' || providerType === 'openrouter') && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Base URL (opcional)</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={providerType === 'openrouter' ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1'}
                className="w-full bg-surface border border-border-subtle text-text-primary rounded-xl px-3 py-2 placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
              />
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-surface border border-border-subtle text-text-primary rounded-xl hover:bg-tertiary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name || (!apiKey && !providerToEdit) || isSubmitting || isValid === false}
              className="px-4 py-2 bg-accent-primary rounded hover:bg-accent-primary-hover disabled:opacity-50"
            >
              {isSubmitting ? (providerToEdit ? 'Actualizando...' : 'Agregando...') : (providerToEdit ? 'Actualizar Proveedor' : 'Agregar Proveedor')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
