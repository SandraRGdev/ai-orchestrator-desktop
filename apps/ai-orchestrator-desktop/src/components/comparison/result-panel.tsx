import { ComparisonResult } from '../../types/generated';
import { MetricsCard } from './metrics-card';

interface ResultPanelProps {
  result: ComparisonResult;
}

export function ResultPanel({ result }: ResultPanelProps) {
  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatCost = (cost: number) => {
    if (cost < 0.01) return '<$0.01';
    return `$${cost.toFixed(4)}`;
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
      <div className="bg-gray-700 px-4 py-3 border-b border-gray-600">
        <div className="font-semibold text-white">{result.provider_name}</div>
        <div className="text-sm text-gray-400">{result.model_name}</div>
      </div>

      <div className="p-4">
        <div className="prose prose-invert max-w-none mb-4 whitespace-pre-wrap text-gray-200">
          {result.response}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <MetricsCard label="Latency" value={formatLatency(result.latency_ms)} />
          <MetricsCard label="Tokens" value={result.total_tokens.toString()} />
          <MetricsCard label="Prompt" value={result.prompt_tokens.toString()} />
          <MetricsCard label="Completion" value={result.completion_tokens.toString()} />
        </div>

        {result.cost_usd > 0 && (
          <div className="mt-3 text-sm text-green-400">
            Cost: {formatCost(result.cost_usd)}
          </div>
        )}
      </div>
    </div>
  );
}
