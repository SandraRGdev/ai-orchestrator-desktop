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
    <div className="bg-elevated rounded-2xl overflow-hidden border border-border-subtle hover:border-accent-primary/50 transition-colors duration-200">
      <div className="bg-tertiary px-5 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-xl flex items-center justify-center text-white font-bold">
            {result.provider_name.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-text-primary">{result.provider_name}</div>
            <div className="text-sm text-text-secondary">{result.model_name}</div>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="prose prose-invert max-w-none mb-5 whitespace-pre-wrap text-text-primary text-sm leading-relaxed">
          {result.response}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MetricsCard label="Latency" value={formatLatency(result.latency_ms)} />
          <MetricsCard label="Tokens" value={result.total_tokens.toString()} />
          <MetricsCard label="Prompt" value={result.prompt_tokens.toString()} />
          <MetricsCard label="Completion" value={result.completion_tokens.toString()} />
        </div>

        {result.cost_usd > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 bg-accent-success/10 text-accent-success px-3 py-2 rounded-lg text-sm font-medium">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
            Cost: {formatCost(result.cost_usd)}
          </div>
        )}
      </div>
    </div>
  );
}
