import { useMemo, useState } from 'react';
import type { Account, Category, Transaction, TxType } from '../types';
import { formatMoney } from '../format';
import { isoToday } from '../metrics';

interface TransactionsTableProps {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onUpdate: (id: string, patch: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
}

const TYPE_OPTIONS: { value: TxType; label: string }[] = [
  { value: 'income', label: '收入' },
  { value: 'expense', label: '支出' },
  { value: 'transfer', label: '转账' },
  { value: 'invest_buy', label: '投资买入' },
  { value: 'invest_sell', label: '投资卖出' },
];

const SIGN_CLASS: Record<TxType, string> = {
  income: 'text-emerald-600',
  expense: 'text-rose-600',
  transfer: 'text-slate-500',
  invest_buy: 'text-amber-600',
  invest_sell: 'text-cyan-600',
};

function categoryGroupForType(t: TxType): Category['group'] | null {
  if (t === 'income') return 'income';
  if (t === 'expense') return 'expense';
  if (t === 'invest_buy' || t === 'invest_sell') return 'invest';
  return null;
}

function defaultDraft(accountId: string): Omit<Transaction, 'id'> {
  return {
    date: isoToday(),
    accountId,
    type: 'expense',
    amount: 0,
    category: '',
    note: '',
  };
}

export function TransactionsTable({
  accounts,
  categories,
  transactions,
  onAdd,
  onUpdate,
  onDelete,
}: TransactionsTableProps) {
  const [draft, setDraft] = useState<Omit<Transaction, 'id'>>(
    defaultDraft(accounts[0]?.id ?? ''),
  );
  const [filterType, setFilterType] = useState<TxType | 'all'>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [search, setSearch] = useState('');

  const accountById = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts],
  );

  const filtered = useMemo(() => {
    return [...transactions]
      .filter((t) => filterType === 'all' || t.type === filterType)
      .filter((t) => filterAccount === 'all' || t.accountId === filterAccount)
      .filter((t) =>
        search.trim() === ''
          ? true
          : `${t.category}${t.note ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, filterType, filterAccount, search]);

  const draftCategoryGroup = categoryGroupForType(draft.type);
  const draftCategoryOptions = draftCategoryGroup
    ? categories.filter((c) => c.group === draftCategoryGroup)
    : [];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.accountId || draft.amount <= 0) return;
    if (draft.type === 'transfer' && !draft.counterpartyAccountId) {
      alert('转账需选择目标账户');
      return;
    }
    if (draft.type === 'transfer' && draft.counterpartyAccountId) {
      const src = accountById.get(draft.accountId);
      const dst = accountById.get(draft.counterpartyAccountId);
      if (src && dst && src.currency !== dst.currency) {
        alert('当前版本仅支持同币种转账');
        return;
      }
    }
    onAdd({ ...draft });
    setDraft(defaultDraft(draft.accountId));
  }

  if (accounts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
        请先在「账户」标签创建至少一个账户。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={submit}
        className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800 sm:grid-cols-7"
      >
        <input
          type="date"
          value={draft.date}
          onChange={(e) => setDraft({ ...draft, date: e.target.value })}
          className={inputCls}
        />
        <select
          value={draft.type}
          onChange={(e) =>
            setDraft({
              ...draft,
              type: e.target.value as TxType,
              category: '',
              counterpartyAccountId: undefined,
            })
          }
          className={inputCls}
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={draft.accountId}
          onChange={(e) => setDraft({ ...draft, accountId: e.target.value })}
          className={inputCls}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
          ))}
        </select>
        <input
          type="number"
          step="any"
          min={0}
          placeholder="金额"
          value={draft.amount || ''}
          onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value) })}
          className={inputCls}
        />
        {draft.type === 'transfer' ? (
          <select
            value={draft.counterpartyAccountId ?? ''}
            onChange={(e) =>
              setDraft({ ...draft, counterpartyAccountId: e.target.value || undefined })
            }
            className={inputCls}
          >
            <option value="">转入账户</option>
            {accounts
              .filter((a) => a.id !== draft.accountId)
              .map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
              ))}
          </select>
        ) : (
          <select
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            className={inputCls}
          >
            <option value="">分类</option>
            {draftCategoryOptions.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        )}
        <input
          placeholder="备注"
          value={draft.note ?? ''}
          onChange={(e) => setDraft({ ...draft, note: e.target.value })}
          className={inputCls}
        />
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          添加
        </button>
      </form>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as TxType | 'all')}
          className={inputCls}
        >
          <option value="all">全部类型</option>
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={filterAccount}
          onChange={(e) => setFilterAccount(e.target.value)}
          className={inputCls}
        >
          <option value="all">全部账户</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <input
          placeholder="搜索分类 / 备注"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputCls + ' sm:col-span-2'}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
          没有匹配的流水。
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <Th>日期</Th>
                <Th>类型</Th>
                <Th>账户</Th>
                <Th className="text-right">金额</Th>
                <Th>分类 / 目标</Th>
                <Th>备注</Th>
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.map((t) => {
                const a = accountById.get(t.accountId);
                const dst = t.counterpartyAccountId ? accountById.get(t.counterpartyAccountId) : undefined;
                return (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        value={t.date}
                        onChange={(e) => onUpdate(t.id, { date: e.target.value })}
                        className="bg-transparent focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-1.5 py-0.5 text-xs ${SIGN_CLASS[t.type]} bg-slate-100 dark:bg-slate-700`}>
                        {TYPE_OPTIONS.find((o) => o.value === t.type)?.label}
                      </span>
                    </td>
                    <td className="px-3 py-2">{a?.name ?? '(已删账户)'}</td>
                    <td className={`px-3 py-2 text-right tabular-nums ${SIGN_CLASS[t.type]}`}>
                      <input
                        type="number"
                        step="any"
                        value={t.amount}
                        onChange={(e) => onUpdate(t.id, { amount: Number(e.target.value) })}
                        className="w-24 bg-transparent text-right tabular-nums focus:outline-none"
                      />
                      <div className="text-xs">{formatMoney(t.amount, a?.currency ?? 'CNY')}</div>
                    </td>
                    <td className="px-3 py-2">
                      {t.type === 'transfer' ? `→ ${dst?.name ?? '?'}` : t.category}
                    </td>
                    <td className="px-3 py-2 max-w-[200px] truncate">{t.note}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => onDelete(t.id)}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const inputCls =
  'rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900';

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-left ${className ?? ''}`}>{children}</th>;
}
