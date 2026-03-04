export interface ProviderConfig {
  id: string;
  name: string;
  provider_type: 'OpenAI' | 'Anthropic' | 'Ollama' | 'Custom';
  api_key_encrypted?: string;
  base_url?: string;
  enabled: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider_id: string;
  context_length?: number;
  input_cost_per_1k?: number;
  output_cost_per_1k?: number;
}

export interface AppError {
  code: string;
  message: string;
}
