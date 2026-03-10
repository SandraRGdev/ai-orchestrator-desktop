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

// Demo providers for testing without API keys
export const DEMO_PROVIDERS: ProviderConfig[] = [
  {
    id: 'demo-openrouter',
    name: 'OpenRouter (Demo)',
    provider_type: 'openrouter',
    enabled: true,
  },
  {
    id: 'demo-claude',
    name: 'Claude (Demo)',
    provider_type: 'anthropic',
    enabled: true,
  },
  {
    id: 'demo-zai',
    name: 'Z.AI (Demo)',
    provider_type: 'openai',
    base_url: 'https://api.z.ai/api/paas/v4',
    enabled: true,
  },
];

export const DEMO_MODELS: Record<string, ModelInfo[]> = {
  'demo-openrouter': [
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (OpenRouter)', context_length: 128000, input_cost_per_1k: 0.00015, output_cost_per_1k: 0.0006 },
    { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B (OpenRouter)', context_length: 131072, input_cost_per_1k: 0.00059, output_cost_per_1k: 0.00079 },
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Gratis)', context_length: 1000000, input_cost_per_1k: 0, output_cost_per_1k: 0 },
  ],
  'demo-claude': [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', context_length: 200000, input_cost_per_1k: 0.003, output_cost_per_1k: 0.015 },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', context_length: 200000, input_cost_per_1k: 0.0008, output_cost_per_1k: 0.004 },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', context_length: 200000, input_cost_per_1k: 0.015, output_cost_per_1k: 0.075 },
  ],
  'demo-zai': [
    { id: 'glm-4.5-air', name: 'GLM-4.5 Air', context_length: 128000, input_cost_per_1k: 0.0005, output_cost_per_1k: 0.0015 },
    { id: 'glm-4.5', name: 'GLM-4.5', context_length: 128000, input_cost_per_1k: 0.001, output_cost_per_1k: 0.003 },
  ],
};

export const providersAtom = atom<ProviderConfig[]>(DEMO_PROVIDERS);
export const selectedProviderAtom = atom<ProviderConfig | null>(null);
export const providerModelsAtom = atom<Map<string, ModelInfo[]>>(new Map(Object.entries(DEMO_MODELS)));
