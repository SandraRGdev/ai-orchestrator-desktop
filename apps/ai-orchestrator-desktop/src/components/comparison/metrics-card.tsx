interface MetricsCardProps {
  label: string;
  value: string;
  highlight?: boolean;
}

export function MetricsCard({ label, value, highlight }: MetricsCardProps) {
  return (
    <div className={`bg-gray-800 rounded-lg px-3 py-2 ${highlight ? 'ring-2 ring-green-500' : ''}`}>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="font-semibold text-white">{value}</div>
    </div>
  );
}
