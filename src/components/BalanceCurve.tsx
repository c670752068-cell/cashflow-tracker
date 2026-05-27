import { useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AppState, Currency, CurvePoint } from '../types';
import { balanceCurve } from '../metrics';
import { formatMoney } from '../format';

interface BalanceCurveProps {
  state: AppState;
}

const RANGES: { label: string; days: number }[] = [
  { label: '30 天', days: 30 },
  { label: '90 天', days: 90 },
  { label: '180 天', days: 180 },
  { label: '365 天', days: 365 },
];

const COLORS: Record<Currency, string> = {
  CNY: '#6366f1',
  USD: '#10b981',
  HKD: '#f59e0b',
};

export function BalanceCurve({ state }: BalanceCurveProps) {
  const [days, setDays] = useState(90);
  const points = balanceCurve(state, { days });
  const usedCurrencies: Currency[] = [];
  for (const c of ['CNY', 'USD', 'HKD'] as Currency[]) {
    if (points.some((p) => p[c] !== undefined)) usedCurrencies.push(c);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold">现金余额曲线</div>
        <div className="ml-auto flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`rounded px-2 py-1 text-xs ${
                days === r.days
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-72 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickFormatter={(d: string) => d.slice(5)}
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            />
            <Tooltip
              formatter={(value, name) => {
                const num = typeof value === 'number' ? value : Number(value);
                return [formatMoney(num, name as Currency), name];
              }}
              labelFormatter={(label) => String(label ?? '')}
            />
            <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
            {usedCurrencies.map((c) => (
              <Line
                key={c}
                type="monotone"
                dataKey={c}
                stroke={COLORS[c]}
                dot={false}
                strokeWidth={2}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {usedCurrencies.length === 0 && (
        <p className="text-center text-xs text-slate-500">
          添加账户和流水后，余额曲线会显示在此。
        </p>
      )}
    </div>
  );
}

// Keep CurvePoint export so consumers can type if needed.
export type { CurvePoint };
