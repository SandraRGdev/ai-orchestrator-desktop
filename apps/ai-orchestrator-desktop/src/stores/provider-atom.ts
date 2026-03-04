import { atom } from 'jotai';

export interface ProviderConfig {
  id: string;
  name: string;
  provider_type: string;
  base_url?: string;
  enabled: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  context_length?: number;
  input_cost_per_1k?: number;
  output_cost_per_1k?: number;
}

export const providersAtom = atom<ProviderConfig[]>([]);
export const selectedProviderAtom = atom<ProviderConfig | null>(null);
export const providerModelsAtom = atom<Map<string, ModelInfo[]>>(new Map());
