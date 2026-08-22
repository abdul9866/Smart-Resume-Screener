import { ScoreBreakdown } from '../types/index.js';

interface ScoreBreakdownCardProps {
  breakdown: ScoreBreakdown;
  score: number;
  recommendation: string;
}

export default function ScoreBreakdownCard({ breakdown, score, recommendation }: ScoreBreakdownCardProps) {
  const items = [
    { label: 'Skills Match', value: breakdown.skills, max: 45, color: 'bg-blue-600' },
    { label: 'Experience Longevity', value: breakdown.experience, max: 30, color: 'bg-emerald-600' },
    { label: 'Education Quality', value: breakdown.education, max: 10, color: 'bg-violet-600' },
    { label: 'Domain & Role Alignment', value: breakdown.alignment, max: 15, color: 'bg-amber-600' },
  ];

  // Helper to color overall score text
  let overallColor = 'text-slate-900';
  let overallBg = 'bg-slate-50 border-slate-200';
  if (score >= 85) {
    overallColor = 'text-emerald-700';
    overallBg = 'bg-emerald-50 border-emerald-200';
  } else if (score >= 70) {
    overallColor = 'text-blue-700';
    overallBg = 'bg-blue-50 border-blue-200';
  } else if (score >= 50) {
    overallColor = 'text-amber-700';
    overallBg = 'bg-amber-50 border-amber-200';
  } else {
    overallColor = 'text-rose-700';
    overallBg = 'bg-rose-50 border-rose-200';
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Candidate Score</h4>
          <span className="text-xs text-slate-400">Weighted screening framework evaluation</span>
        </div>
        <div className={`mt-2 sm:mt-0 flex items-center space-x-3 rounded-lg border px-3 py-1.5 ${overallBg}`}>
          <span className="text-2xl font-bold tracking-tight text-slate-950">{score}<span className="text-sm font-normal text-slate-400">/100</span></span>
          <span className={`text-xs font-semibold uppercase tracking-wider ${overallColor}`}>{recommendation}</span>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const percentage = (item.value / item.max) * 100;
          return (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">{item.label}</span>
                <span className="font-semibold text-slate-900">
                  {item.value} <span className="text-slate-400 font-normal">/ {item.max}</span>
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
