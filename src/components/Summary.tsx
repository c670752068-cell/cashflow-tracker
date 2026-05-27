import type { CurrencyTotals, MonthlyAggregate } from '../types';
import { formatMoney, formatPct, formatSignedMoney } from '../format';

interface SummaryProps {
  totals: CurrencyTotals[];
  thisMonth?: MonthlyAggregate;
}

export function Summary({ totals, thisMonth }: SummaryProps) {
  const incomeClass = 'text-emerald-600';
  const expenseClass = 'text-rose-600';
  const netClass =
    !thisMonth || thisMonth.net === 0
      ? 'text-slate-500'
      : thisMonth.net > 0
        ? 'text-emerald-600'
        : 'text-rose-600';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card label="本月收入" value={thisMonth ? formatMoney(thisMonth.income, 'CNY') : '¥0.00'} valueClass={incomeClass} />
        <Card label="本月支出" value={thisMonth ? formatMoney(thisMonth.expense, 'CNY') : '¥0.00'} valueClass={expenseClass} />
        <Card
          label="本月净流入"
          value={thisMonth ? formatSignedMoney(thisMonth.net, 'CNY') : '¥0.00'}
          sub={thisMonth ? `储蓄率 ${formatPct(thisMonth.savingsRate)}` : undefined}
          valueClass={netClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {totals.length === 0 ? (
          <Card label="当前现金" value="¥0.00" sub="尚无账户数据" />
        ) : (
          totals.map((t) => (
            <Card key={t.currency} label={`${t.currency} 现金`} value={formatMoney(t.cash, t.currency)} />
          ))
        )}
      </div>
    </div>
  );
}

interface CardProps {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}

function Card({ label, value, sub, valueClass }: CardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`mt-1 text-lg font-semibold tabular-nums ${valueClass ?? ''}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 dark:text-slate-400">{sub}</div>}
    </div>
  );
}
