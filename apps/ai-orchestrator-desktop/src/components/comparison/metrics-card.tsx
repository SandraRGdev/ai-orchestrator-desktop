interface MetricsCardProps {
  label: string;
  value: string;
  highlight?: boolean;
}

export function MetricsCard({ label, value, highlight }: MetricsCardProps) {
  return (
    <div className={`bg-tertiary rounded-xl px-4 py-3 border border-border-subtle ${highlight ? 'ring-2 ring-accent-success' : ''}`}>
      <div className="text-xs text-text-tertiary uppercase tracking-wide font-medium mb-1">{label}</div>
      <div className="font-semibold text-text-primary">{value}</div>
    </div>
  );
}
