import { useAtom, useSetAtom } from 'jotai';
import { ComparisonInput } from './comparison-input';
import { ResultPanel } from './result-panel';
import { comparisonResultsAtom, comparisonLoadingAtom, runComparisonAtom } from '../../stores/comparison-atom';
import type { ModelConfig } from '../../types/generated';

export function ComparisonView() {
  const [results, setResults] = useAtom(comparisonResultsAtom);
  const [loading] = useAtom(comparisonLoadingAtom);
  const runComparison = useSetAtom(runComparisonAtom);

  const handleCompare = async (prompt: string, models: ModelConfig[]) => {
    try {
      const comparisonResults = await runComparison({ prompt, modelConfigs: models });
      if (comparisonResults) {
        setResults(comparisonResults);
      }
    } catch (error) {
      console.error('Comparison failed:', error);
      alert('Comparison failed: ' + (error as Error).message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-primary text-text-primary">
      <ComparisonInput onCompare={handleCompare} />

      {loading && results.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-text-secondary">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin"></div>
            <p className="text-sm">Running comparison across models...</p>
          </div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="flex-1 p-6 overflow-auto">
          <div className="mb-6 flex items-center gap-3">
            <div className="inline-flex items-center gap-2 bg-elevated border border-border-subtle px-4 py-2 rounded-xl text-sm">
              <svg className="w-4 h-4 text-accent-success" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{results.length}</span>
              <span className="text-text-secondary">result{results.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="text-xs text-text-tertiary">Sorted by latency</div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {results.map((result) => (
              <ResultPanel key={result.id} result={result} />
            ))}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-text-secondary">
          <div className="text-center p-8 bg-elevated rounded-2xl border border-border-subtle max-w-md mx-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-tertiary rounded-2xl mb-4">
              <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Comparisons Yet</h3>
            <p className="text-sm text-text-secondary">Select 2+ models and enter a prompt above to compare responses</p>
          </div>
        </div>
      )}
    </div>
  );
}
