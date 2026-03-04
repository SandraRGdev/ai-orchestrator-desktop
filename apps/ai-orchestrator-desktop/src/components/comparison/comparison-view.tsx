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
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <ComparisonInput onCompare={handleCompare} />

      {loading && results.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="animate-pulse">Running comparison across models...</div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="flex-1 p-4 overflow-auto">
          <div className="mb-4 text-sm text-gray-400">
            {results.length} result{results.length !== 1 ? 's' : ''} • Sorted by latency
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((result) => (
              <ResultPanel key={result.id} result={result} />
            ))}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center p-8 bg-gray-800 rounded-lg">
            <p className="text-lg mb-2">No comparisons yet</p>
            <p className="text-sm">Select 2+ models and enter a prompt above to compare</p>
          </div>
        </div>
      )}
    </div>
  );
}
