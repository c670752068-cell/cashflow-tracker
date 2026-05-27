import type { RiskFinding } from '../types';

interface RiskListProps {
  findings: RiskFinding[];
}

const STYLES: Record<RiskFinding['level'], string> = {
  info: 'border-sky-200 bg-sky-50/80 text-sky-900 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-100',
  warn: 'border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-100',
  critical: 'border-rose-300 bg-rose-50/80 text-rose-900 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-100',
};

const EMOJI: Record<RiskFinding['level'], string> = {
  info: '💡',
  warn: '⚠️',
  critical: '🚨',
};

const LABEL: Record<RiskFinding['level'], string> = {
  info: '提示',
  warn: '警示',
  critical: '严重',
};

export function RiskList({ findings }: RiskListProps) {
  return (
    <div className="space-y-2">
      {findings.map((f, i) => (
        <div key={i} className={`rounded-2xl border p-3 text-sm shadow-sm ${STYLES[f.level]}`}>
          <div className="flex items-center gap-2">
            <span className="text-base">{EMOJI[f.level]}</span>
            <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold dark:bg-black/30">
              {LABEL[f.level]}
            </span>
            <span className="font-semibold">{f.title}</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed opacity-90">{f.detail}</p>
        </div>
      ))}
    </div>
  );
}
