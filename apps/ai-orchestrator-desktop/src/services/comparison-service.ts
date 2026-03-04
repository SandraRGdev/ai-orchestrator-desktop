import { invoke } from '@tauri-apps/api/core';
import type { ComparisonSession, ComparisonRequest, ComparisonResult } from '../types/generated';

export class ComparisonService {
  async runComparison(req: ComparisonRequest): Promise<ComparisonResult[]> {
    return invoke('run_comparison', { req });
  }

  async listComparisonSessions(): Promise<ComparisonSession[]> {
    return invoke('list_comparison_sessions');
  }

  async getComparisonResults(sessionId: string): Promise<ComparisonResult[]> {
    return invoke('get_comparison_results', { sessionId });
  }

  async deleteComparisonSession(id: string): Promise<void> {
    return invoke('delete_comparison_session', { id });
  }
}

export const comparisonService = new ComparisonService();
