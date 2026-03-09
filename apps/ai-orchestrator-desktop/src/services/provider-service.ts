import { invoke } from '@tauri-apps/api/core';
import type { ProviderConfig, ModelInfo } from '@/stores/provider-atom';

export async function addProvider(
  name: string,
  providerType: 'openai' | 'anthropic' | 'google' | 'groq',
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

export async function updateProvider(
  id: string,
  name: string,
  providerType: 'openai' | 'anthropic' | 'google' | 'groq',
  apiKey: string,
  baseUrl?: string
): Promise<void> {
  console.log('provider-service: updateProvider called with:', { id, name, providerType, hasBaseUrl: !!baseUrl });
  try {
    await invoke('update_provider', {
      id,
      name,
      providerType,
      apiKey,
      baseUrl: baseUrl || null,
    });
    console.log('provider-service: updateProvider completed successfully');
  } catch (error) {
    console.error('provider-service: updateProvider failed:', error);
    throw error;
  }
}

export async function removeProvider(id: string): Promise<void> {
  console.log('provider-service: removeProvider called with:', { id });
  try {
    await invoke('remove_provider', { id });
    console.log('provider-service: removeProvider completed successfully');
  } catch (error) {
    console.error('provider-service: removeProvider failed:', error);
    throw error;
  }
}

export async function listProviders(): Promise<ProviderConfig[]> {
  return await invoke('list_providers');
}

export async function listProviderModels(providerId: string): Promise<ModelInfo[]> {
  return await invoke('list_provider_models', { providerId });
}

export async function validateApiKey(
  providerType: 'openai' | 'anthropic' | 'google' | 'groq',
  apiKey: string
): Promise<boolean> {
  return await invoke('validate_provider_api_key', { providerType, apiKey });
}
