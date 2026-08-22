interface StatusBadgeProps {
  recommendation: 'Strong Match' | 'Good Match' | 'Partial Match' | 'Weak Match' | string;
}

export default function StatusBadge({ recommendation }: StatusBadgeProps) {
  let bgClass = '';
  let textClass = '';
  let label = recommendation;

  switch (recommendation) {
    case 'Strong Match':
      bgClass = 'bg-emerald-50 border-emerald-200';
      textClass = 'text-emerald-700';
      break;
    case 'Good Match':
      bgClass = 'bg-blue-50 border-blue-200';
      textClass = 'text-blue-700';
      break;
    case 'Partial Match':
      bgClass = 'bg-amber-50 border-amber-200';
      textClass = 'text-amber-700';
      break;
    case 'Weak Match':
      bgClass = 'bg-rose-50 border-rose-200';
      textClass = 'text-rose-700';
      break;
    default:
      bgClass = 'bg-slate-50 border-slate-200';
      textClass = 'text-slate-700';
  }

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold tracking-wide ${bgClass} ${textClass}`}>
      {label}
    </span>
  );
}
