import { atom } from 'jotai';
import type { ComparisonSession, ComparisonResult, ModelConfig } from '../types/generated';

// Current comparison state
export const comparisonResultsAtom = atom<ComparisonResult[]>([]);
export const comparisonLoadingAtom = atom(false);
export const currentComparisonSessionAtom = atom<ComparisonSession | null>(null);

// Comparison sessions list
export const comparisonSessionsAtom = atom<ComparisonSession[]>([]);
export const comparisonSessionsLoadingAtom = atom(false);

// Input state
export const comparisonPromptAtom = atom('');
export const selectedModelsAtom = atom<string[]>([]);

// Derived atom for running comparison
export const runComparisonAtom = atom(
  null,
  async (_get, set, { prompt, modelConfigs }: { prompt: string; modelConfigs: ModelConfig[] }) => {
    set(comparisonLoadingAtom, true);
    try {
      const { comparisonService } = await import('../services/comparison-service');
      const results = await comparisonService.runComparison({
        prompt,
        model_configs: modelConfigs,
      });
      set(comparisonResultsAtom, results);
      return results;
    } finally {
      set(comparisonLoadingAtom, false);
    }
  }
);

// Derived atom for loading comparison sessions
export const loadComparisonSessionsAtom = atom(
  null,
  async (_get, set) => {
    set(comparisonSessionsLoadingAtom, true);
    try {
      const { comparisonService } = await import('../services/comparison-service');
      const sessions = await comparisonService.listComparisonSessions();
      set(comparisonSessionsAtom, sessions);
    } finally {
      set(comparisonSessionsLoadingAtom, false);
    }
  }
);

// Derived atom for getting results for a session
export const loadComparisonResultsAtom = atom(
  null,
  async (_get, set, sessionId: string) => {
    set(comparisonLoadingAtom, true);
    try {
      const { comparisonService } = await import('../services/comparison-service');
      const results = await comparisonService.getComparisonResults(sessionId);
      set(comparisonResultsAtom, results);
    } finally {
      set(comparisonLoadingAtom, false);
    }
  }
);
