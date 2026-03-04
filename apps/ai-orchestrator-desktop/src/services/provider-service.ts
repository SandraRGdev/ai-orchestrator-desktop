import { invoke } from '@tauri-apps/api/core';
import type { ProviderConfig, ModelInfo } from '@/stores/provider-atom';

export async function addProvider(
  name: string,
  providerType: 'openai' | 'anthropic',
  apiKey: string,
  baseUrl?: string
): Promise<void> {
  const id = crypto.randomUUID();
  await invoke('add_provider', {
    id,
    name,
    providerType,
    apiKey,
    baseUrl: baseUrl || null,
  });
}

export async function removeProvider(id: string): Promise<void> {
  await invoke('remove_provider', { id });
}

export async function listProviders(): Promise<ProviderConfig[]> {
  return await invoke('list_providers');
}

export async function listProviderModels(providerId: string): Promise<ModelInfo[]> {
  return await invoke('list_provider_models', { providerId });
}

export async function validateApiKey(
  providerType: 'openai' | 'anthropic',
  apiKey: string
): Promise<boolean> {
  return await invoke('validate_provider_api_key', { providerType, apiKey });
}
