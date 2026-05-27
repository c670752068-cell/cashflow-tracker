import type { CurrencyTotals, MonthlyAggregate } from '../types';
import { formatMoney, formatPct, formatSignedMoney } from '../format';

interface SummaryProps {
  totals: CurrencyTotals[];
  thisMonth?: MonthlyAggregate;
}

const CURRENCY_EMOJI: Record<string, string> = {
  CNY: '🇨🇳',
  USD: '🇺🇸',
  HKD: '🇭🇰',
};

export function Summary({ totals, thisMonth }: SummaryProps) {
  const netPositive = !thisMonth || thisMonth.net >= 0;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card
          emoji="💚"
          label="本月收入"
          value={thisMonth ? formatMoney(thisMonth.income, 'CNY') : '¥0.00'}
          gradient="from-emerald-100 to-teal-100"
          accent="text-emerald-700"
        />
        <Card
          emoji="🛒"
          label="本月支出"
          value={thisMonth ? formatMoney(thisMonth.expense, 'CNY') : '¥0.00'}
          gradient="from-rose-100 to-pink-100"
          accent="text-rose-600"
        />
        <Card
          emoji={netPositive ? '✨' : '⚠️'}
          label="本月净流入"
          value={thisMonth ? formatSignedMoney(thisMonth.net, 'CNY') : '¥0.00'}
          sub={thisMonth ? `储蓄率 ${formatPct(thisMonth.savingsRate)}` : undefined}
          gradient={netPositive ? 'from-amber-100 to-yellow-100' : 'from-rose-100 to-orange-100'}
          accent={netPositive ? 'text-amber-700' : 'text-rose-600'}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {totals.length === 0 ? (
          <Card emoji="🐷" label="当前现金" value="¥0.00" sub="尚无账户数据" gradient="from-slate-100 to-slate-200" accent="text-slate-600" />
        ) : (
          totals.map((t) => (
            <Card
              key={t.currency}
              emoji={CURRENCY_EMOJI[t.currency] ?? '💵'}
              label={`${t.currency} 现金`}
              value={formatMoney(t.cash, t.currency)}
              gradient="from-sky-100 to-indigo-100"
              accent="text-indigo-700"
            />
          ))
        )}
      </div>
    </div>
  );
}

interface CardProps {
  emoji: string;
  label: string;
  value: string;
  sub?: string;
  gradient: string;
  accent: string;
}

function Card({ emoji, label, value, sub, gradient, accent }: CardProps) {
  return (
    <div className={`rounded-2xl border border-white/60 bg-gradient-to-br ${gradient} p-3 shadow-sm dark:border-slate-700/60 dark:from-slate-800 dark:to-slate-800`}>
      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
        <span className="text-base">{emoji}</span>
        <span>{label}</span>
      </div>
      <div className={`mt-1 text-lg font-semibold tabular-nums ${accent} dark:text-white`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 dark:text-slate-400">{sub}</div>}
    </div>
  );
}
