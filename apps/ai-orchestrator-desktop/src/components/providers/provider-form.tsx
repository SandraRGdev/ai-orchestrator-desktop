import { useState, FormEvent } from 'react';
import { useSetAtom } from 'jotai';
import { providersAtom } from '@/stores/provider-atom';
import { addProvider, validateApiKey } from '@/services/provider-service';

interface ProviderFormProps {
  onClose: () => void;
}

export function ProviderForm({ onClose }: ProviderFormProps) {
  const [providerType, setProviderType] = useState<'openai' | 'anthropic'>('openai');
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setProviders = useSetAtom(providersAtom);

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
    if (!name || !apiKey) return;

    setIsSubmitting(true);
    try {
      await addProvider(
        name,
        providerType,
        apiKey,
        baseUrl || undefined
      );

      const providers = await import('@/services/provider-service').then(m => m.listProviders());
      setProviders(providers);
      onClose();
    } catch (error) {
      console.error('Failed to add provider:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md border border-zinc-700">
        <h2 className="text-xl font-semibold mb-4">Add Provider</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Provider Type</label>
            <select
              value={providerType}
              onChange={(e) => {
                setProviderType(e.target.value as 'openai' | 'anthropic');
                setIsValid(null);
              }}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My OpenAI Account"
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">API Key</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setIsValid(null);
                }}
                placeholder="sk-... or sk-ant-..."
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2"
                required
              />
              <button
                type="button"
                onClick={handleValidate}
                disabled={!apiKey || isValidating}
                className="px-3 py-2 bg-zinc-700 rounded hover:bg-zinc-600 disabled:opacity-50"
              >
                {isValidating ? '...' : isValid === true ? '✓' : isValid === false ? '✗' : 'Test'}
              </button>
            </div>
          </div>

          {providerType === 'openai' && (
            <div>
              <label className="block text-sm font-medium mb-1">Base URL (optional)</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2"
              />
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-700 rounded hover:bg-zinc-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name || !apiKey || isSubmitting || isValid === false}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Provider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
