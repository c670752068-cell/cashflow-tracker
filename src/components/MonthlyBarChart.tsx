import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MonthlyAggregate } from '../types';
import { formatMoney } from '../format';

interface MonthlyBarChartProps {
  data: MonthlyAggregate[];
}

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 0 })} />
          <Tooltip
            formatter={(value, name) => {
              const num = typeof value === 'number' ? value : Number(value);
              return [formatMoney(num, 'CNY'), name];
            }}
          />
          <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
          <Bar dataKey="income" fill="#10b981" name="收入" />
          <Bar dataKey="expense" fill="#ef4444" name="支出" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
