import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategoryBreakdown } from '../types';
import { formatMoney, formatPct } from '../format';

interface ExpensePieChartProps {
  data: CategoryBreakdown[];
}

const COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4',
  '#a855f7', '#84cc16', '#f43f5e', '#0ea5e9', '#eab308',
  '#14b8a6', '#f97316', '#8b5cf6', '#22c55e', '#ec4899',
];

export function ExpensePieChart({ data }: ExpensePieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        所选时间段尚无支出。
      </div>
    );
  }
  return (
    <div className="h-64 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius="45%"
            outerRadius="80%"
            paddingAngle={2}
            label={(entry) => {
              const c = entry as unknown as CategoryBreakdown;
              return `${c.category} ${formatPct(c.pct)}`;
            }}
          >
            {data.map((d, i) => (
              <Cell key={d.category} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, _name, item) => {
              const c = item.payload as CategoryBreakdown;
              const num = typeof value === 'number' ? value : Number(value);
              return [`${formatMoney(num, 'CNY')} (${formatPct(c.pct)})`, c.category];
            }}
          />
          <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
