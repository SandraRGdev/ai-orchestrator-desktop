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
    id: 'demo-openai',
    name: 'OpenAI (Demo)',
    provider_type: 'openai',
    enabled: true,
  },
  {
    id: 'demo-anthropic',
    name: 'Anthropic (Demo)',
    provider_type: 'anthropic',
    enabled: true,
  },
  {
    id: 'demo-local',
    name: 'Local LLM (Demo)',
    provider_type: 'ollama',
    base_url: 'http://localhost:11434',
    enabled: true,
  },
];

export const DEMO_MODELS: Record<string, ModelInfo[]> = {
  'demo-openai': [
    { id: 'gpt-4o', name: 'GPT-4o', context_length: 128000, input_cost_per_1k: 0.005, output_cost_per_1k: 0.015 },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', context_length: 128000, input_cost_per_1k: 0.00015, output_cost_per_1k: 0.0006 },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', context_length: 128000, input_cost_per_1k: 0.01, output_cost_per_1k: 0.03 },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', context_length: 16385, input_cost_per_1k: 0.0005, output_cost_per_1k: 0.0015 },
  ],
  'demo-anthropic': [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', context_length: 200000, input_cost_per_1k: 0.003, output_cost_per_1k: 0.015 },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', context_length: 200000, input_cost_per_1k: 0.0008, output_cost_per_1k: 0.004 },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', context_length: 200000, input_cost_per_1k: 0.015, output_cost_per_1k: 0.075 },
  ],
  'demo-local': [
    { id: 'llama3.2', name: 'Llama 3.2', context_length: 128000 },
    { id: 'llama3.1', name: 'Llama 3.1', context_length: 128000 },
    { id: 'mistral', name: 'Mistral 7B', context_length: 32768 },
  ],
};

export const providersAtom = atom<ProviderConfig[]>(DEMO_PROVIDERS);
export const selectedProviderAtom = atom<ProviderConfig | null>(null);
export const providerModelsAtom = atom<Map<string, ModelInfo[]>>(new Map(Object.entries(DEMO_MODELS)));
