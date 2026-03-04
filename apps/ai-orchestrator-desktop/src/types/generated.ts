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

export type MessageRole = 'System' | 'User' | 'Assistant';

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  tokens?: number | null;
  latency_ms?: number | null;
  created_at: string;
}

export interface CreateMessage {
  conversation_id: string;
  role: MessageRole;
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  model_id: string;
  provider_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateConversation {
  title: string;
  model_id: string;
  provider_id: string;
}

export interface SendMessageRequest {
  conversation_id: string;
  content: string;
}

