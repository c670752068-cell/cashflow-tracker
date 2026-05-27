import { useState } from 'react';
import type { Account, AccountBalance, AccountType, Currency } from '../types';
import { formatMoney } from '../format';
import { isoToday } from '../metrics';

interface AccountsPanelProps {
  balances: AccountBalance[];
  onAdd: (a: Omit<Account, 'id'>) => void;
  onUpdate: (id: string, patch: Partial<Account>) => void;
  onDelete: (id: string) => void;
}

const TYPES: { value: AccountType; label: string }[] = [
  { value: 'cash', label: '💵 现金' },
  { value: 'bank', label: '🏦 银行' },
  { value: 'wallet', label: '📱 钱包' },
  { value: 'broker', label: '📈 证券' },
  { value: 'other', label: '✨ 其他' },
];

const CURRENCIES: Currency[] = ['CNY', 'USD', 'HKD'];

const emptyDraft: Omit<Account, 'id'> = {
  name: '',
  type: 'bank',
  currency: 'CNY',
  openingBalance: 0,
  openingDate: isoToday(),
};

export function AccountsPanel({ balances, onAdd, onUpdate, onDelete }: AccountsPanelProps) {
  const [draft, setDraft] = useState<Omit<Account, 'id'>>(emptyDraft);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return;
    onAdd({ ...draft, name: draft.name.trim() });
    setDraft(emptyDraft);
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={submit}
        className="grid grid-cols-2 gap-2 rounded-2xl border border-white/60 bg-white/80 p-3 shadow-md shadow-rose-100/50 backdrop-blur dark:border-slate-700/60 dark:bg-slate-800/80 sm:grid-cols-6"
      >
        <input
          required
          placeholder="账户名"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          className={inputCls + ' sm:col-span-2'}
        />
        <select
          value={draft.type}
          onChange={(e) => setDraft({ ...draft, type: e.target.value as AccountType })}
          className={inputCls}
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          value={draft.currency}
          onChange={(e) => setDraft({ ...draft, currency: e.target.value as Currency })}
          className={inputCls}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="number"
          step="any"
          placeholder="期初余额"
          value={draft.openingBalance || ''}
          onChange={(e) => setDraft({ ...draft, openingBalance: Number(e.target.value) })}
          className={inputCls}
        />
        <button
          type="submit"
          className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-rose-300/50 hover:shadow-lg"
        >
          ✨ 添加
        </button>
      </form>

      {balances.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-rose-300 bg-white/60 p-6 text-center text-sm text-rose-500 dark:border-slate-700 dark:bg-slate-800/60">
          🌱 还没有账户～
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <Th>名称</Th>
                <Th>类型</Th>
                <Th>币种</Th>
                <Th className="text-right">期初</Th>
                <Th>期初日期</Th>
                <Th className="text-right">当前余额</Th>
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {balances.map((b) => (
                <Row key={b.account.id} ab={b} onUpdate={onUpdate} onDelete={onDelete} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const inputCls =
  'rounded-xl border border-rose-200/70 bg-white/80 px-2.5 py-1.5 text-sm placeholder:text-slate-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200 dark:border-slate-600 dark:bg-slate-900';

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-left ${className ?? ''}`}>{children}</th>;
}

interface RowProps {
  ab: AccountBalance;
  onUpdate: (id: string, patch: Partial<Account>) => void;
  onDelete: (id: string) => void;
}

function Row({ ab, onUpdate, onDelete }: RowProps) {
  const a = ab.account;
  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
      <td className="px-3 py-2">
        <input
          value={a.name}
          onChange={(e) => onUpdate(a.id, { name: e.target.value })}
          className="w-full bg-transparent focus:outline-none"
        />
      </td>
      <td className="px-3 py-2">
        <select
          value={a.type}
          onChange={(e) => onUpdate(a.id, { type: e.target.value as AccountType })}
          className="bg-transparent focus:outline-none"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <select
          value={a.currency}
          onChange={(e) => onUpdate(a.id, { currency: e.target.value as Currency })}
          className="bg-transparent focus:outline-none"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2 text-right tabular-nums">
        <input
          type="number"
          step="any"
          value={a.openingBalance}
          onChange={(e) => onUpdate(a.id, { openingBalance: Number(e.target.value) })}
          className="w-24 bg-transparent text-right tabular-nums focus:outline-none"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="date"
          value={a.openingDate}
          onChange={(e) => onUpdate(a.id, { openingDate: e.target.value })}
          className="bg-transparent focus:outline-none"
        />
      </td>
      <td className="px-3 py-2 text-right tabular-nums font-medium">
        {formatMoney(ab.balance, a.currency)}
      </td>
      <td className="px-3 py-2 text-right">
        <button
          onClick={() => {
            if (confirm(`删除账户「${a.name}」？该账户的流水将变成孤立记录。`)) onDelete(a.id);
          }}
          className="text-xs text-rose-600 hover:underline"
        >
          删除
        </button>
      </td>
    </tr>
  );
}
