import { invoke } from '@tauri-apps/api/core';
import type { ComparisonSession, ComparisonRequest, ComparisonResult } from '../types/generated';

export const DEMO_MODE = false;

// Demo comparison responses
const DEMO_COMPARISON_RESPONSES: Record<string, { response: string; style: string }> = {
  'gpt-4o': {
    response: "🤖 **GPT-4o Analysis**\n\nThis is a comprehensive, multi-faceted response that considers various angles of the question. GPT-4o tends to provide detailed, structured answers with clear organization.\n\n**Key Points:**\n- Thorough analysis with multiple perspectives\n- Clear, structured formatting\n- Practical examples and applications\n- Balanced consideration of pros/cons",
    style: 'Comprehensive & Structured',
  },
  'claude-3-5-sonnet-20241022': {
    response: "🧠 **Claude 3.5 Sonnet Perspective**\n\nI'd approach this thoughtfully, considering both the immediate implications and longer-term considerations. My response focuses on nuanced understanding while maintaining clarity.\n\nWhat stands out here is the complexity involved - I'd recommend breaking this down into manageable components while keeping the broader context in view.",
    style: 'Thoughtful & Nuanced',
  },
  'llama3.2': {
    response: "💡 **Llama 3.2 Response**\n\nStraight to the point - here's my practical take:\n\n1. Main thing is this works well for most cases\n2. Quick implementation is possible\n3. Consider your specific use case\n\nLet me know if you need more details on any part!",
    style: 'Direct & Practical',
  },
};

async function getDemoComparisonResult(providerId: string, modelId: string): Promise<ComparisonResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  const demo = DEMO_COMPARISON_RESPONSES[modelId] || DEMO_COMPARISON_RESPONSES['gpt-4o'];
  const tokens = 100 + Math.floor(Math.random() * 300);
  const latency = 600 + Math.floor(Math.random() * 800);

  return {
    id: `result-${Date.now()}-${Math.random()}`,
    session_id: 'demo-session',
    provider_id: providerId,
    provider_name: providerId.replace('demo-', '').toUpperCase(),
    model_id: modelId,
    model_name: modelId,
    response: demo.response,
    prompt_tokens: Math.floor(tokens * 0.3),
    completion_tokens: Math.floor(tokens * 0.7),
    total_tokens: tokens,
    latency_ms: latency,
    cost_usd: (tokens / 1000) * 0.01,
    created_at: new Date().toISOString(),
  };
}

export class ComparisonService {
  async runComparison(req: ComparisonRequest): Promise<ComparisonResult[]> {
    if (DEMO_MODE) {
      const results = await Promise.all(
        req.model_configs.map(config =>
          getDemoComparisonResult(config.provider_id, config.model_id)
        )
      );
      return results;
    }
    return invoke('run_comparison', { req });
  }

  async listComparisonSessions(): Promise<ComparisonSession[]> {
    if (DEMO_MODE) {
      return [];
    }
    return invoke('list_comparison_sessions');
  }

  async getComparisonResults(sessionId: string): Promise<ComparisonResult[]> {
    if (DEMO_MODE) {
      return [];
    }
    return invoke('get_comparison_results', { sessionId });
  }

  async deleteComparisonSession(id: string): Promise<void> {
    if (DEMO_MODE) {
      return;
    }
    return invoke('delete_comparison_session', { id });
  }
}

export const comparisonService = new ComparisonService();
