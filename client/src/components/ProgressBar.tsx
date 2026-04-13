interface Props {
  collected: number;
  total: number;
  showLabel?: boolean;
  label?: string;
}

export default function ProgressBar({ collected, total, showLabel = true, label = 'collected' }: Props) {
  const pct = total > 0 ? Math.min(100, (collected / total) * 100) : 0;

  return (
    <div>
      {showLabel && (
        <div className="flex justify-between text-[11px] text-zinc-400 mb-1.5">
          <span>${collected.toFixed(2)} {label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div className="w-full bg-[#e2e0db] rounded-full h-1">
        <div
          className="h-1 rounded-full bg-[#2ba572] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
