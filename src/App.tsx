import { useEffect, useMemo, useState } from 'react';
import { AccountsPanel } from './components/AccountsPanel';
import { AnalysisPanel } from './components/AnalysisPanel';
import { BalanceCurve } from './components/BalanceCurve';
import { ExpensePieChart } from './components/ExpensePieChart';
import { MonthlyBarChart } from './components/MonthlyBarChart';
import { RiskList } from './components/RiskList';
import { SettingsPanel } from './components/SettingsPanel';
import { Summary } from './components/Summary';
import { TransactionsTable } from './components/TransactionsTable';
import { analyzeCashflow } from './analyzer';
import {
  accountBalances,
  categoryBreakdown,
  currencyTotals,
  isoToday,
  monthlyAggregates,
} from './metrics';
import {
  emptyState,
  loadSettings,
  loadState,
  saveSettings,
  saveState,
} from './storage';
import type {
  Account,
  AppSettings,
  AppState,
  Category,
  Transaction,
} from './types';
import './App.css';

type Tab = 'dashboard' | 'transactions' | 'accounts' | 'analysis' | 'settings';

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [tab, setTab] = useState<Tab>('dashboard');

  useEffect(() => {
    saveState(state);
  }, [state]);

  const balances = useMemo(() => accountBalances(state), [state]);
  const totals = useMemo(() => currencyTotals(state), [state]);
  const monthly = useMemo(() => monthlyAggregates(state, 6), [state]);
  const thisMonth = monthly[monthly.length - 1];
  const findings = useMemo(() => analyzeCashflow(state), [state]);

  // Account CRUD
  function addAccount(a: Omit<Account, 'id'>) {
    setState((s) => ({ ...s, accounts: [...s.accounts, { ...a, id: newId() }] }));
  }
  function updateAccount(id: string, patch: Partial<Account>) {
    setState((s) => ({
      ...s,
      accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  }
  function deleteAccount(id: string) {
    setState((s) => ({ ...s, accounts: s.accounts.filter((a) => a.id !== id) }));
  }

  // Transaction CRUD
  function addTx(t: Omit<Transaction, 'id'>) {
    setState((s) => ({ ...s, transactions: [...s.transactions, { ...t, id: newId() }] }));
  }
  function updateTx(id: string, patch: Partial<Transaction>) {
    setState((s) => ({
      ...s,
      transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }
  function deleteTx(id: string) {
    setState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }));
  }

  // Category CRUD
  function addCategory(c: Omit<Category, 'id'>) {
    setState((s) => ({ ...s, categories: [...s.categories, { ...c, id: newId() }] }));
  }
  function deleteCategory(id: string) {
    setState((s) => ({ ...s, categories: s.categories.filter((c) => c.id !== id) }));
  }

  function handleSaveSettings(next: AppSettings) {
    setSettings(next);
    saveSettings(next);
  }

  return (
    <div className="mx-auto min-h-full max-w-5xl px-3 py-4 sm:px-6">
      <header className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">我的现金流</h1>
          <p className="text-xs text-slate-500">本地存储 · 不上传 · 手机/桌面通用</p>
        </div>
        <nav className="flex flex-wrap gap-1 text-xs sm:text-sm">
          <TabBtn label="总览" active={tab === 'dashboard'} onClick={() => setTab('dashboard')} />
          <TabBtn label="流水" active={tab === 'transactions'} onClick={() => setTab('transactions')} />
          <TabBtn label="账户" active={tab === 'accounts'} onClick={() => setTab('accounts')} />
          <TabBtn label="分析" active={tab === 'analysis'} onClick={() => setTab('analysis')} />
          <TabBtn label="设置" active={tab === 'settings'} onClick={() => setTab('settings')} />
        </nav>
      </header>

      {tab === 'dashboard' && (
        <section className="space-y-4">
          <Summary totals={totals} thisMonth={thisMonth} />
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
            <BalanceCurve state={state} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-2 text-sm font-semibold">最近 10 条流水</h3>
            <RecentTransactions state={state} />
          </div>
        </section>
      )}

      {tab === 'transactions' && (
        <section className="space-y-4">
          <TransactionsTable
            accounts={state.accounts}
            categories={state.categories}
            transactions={state.transactions}
            onAdd={addTx}
            onUpdate={updateTx}
            onDelete={deleteTx}
          />
        </section>
      )}

      {tab === 'accounts' && (
        <section className="space-y-4">
          <AccountsPanel
            balances={balances}
            onAdd={addAccount}
            onUpdate={updateAccount}
            onDelete={deleteAccount}
          />
        </section>
      )}

      {tab === 'analysis' && (
        <section className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-2 text-sm font-semibold">近 6 月收支</h3>
            <MonthlyBarChart data={monthly} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
            <ExpenseByCategory state={state} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-2 text-sm font-semibold">本地财务诊断</h3>
            <RiskList findings={findings} />
          </div>
          <AnalysisPanel settings={settings} state={state} localFindings={findings} />
        </section>
      )}

      {tab === 'settings' && (
        <section className="space-y-4">
          <SettingsPanel
            settings={settings}
            categories={state.categories}
            onSaveSettings={handleSaveSettings}
            onAddCategory={addCategory}
            onDeleteCategory={deleteCategory}
          />
          <DataActions
            onExport={() => exportJson(state)}
            onImport={(next) => setState(next)}
            onReset={() => {
              if (confirm('确定清空所有数据并恢复预设账户/分类？')) setState(emptyState());
            }}
          />
        </section>
      )}

      <footer className="mt-8 text-center text-xs text-slate-400">
        数据保存在浏览器 localStorage；清除浏览器数据会丢失。建议定期导出 JSON 备份。
      </footer>
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 font-medium transition ${
        active
          ? 'bg-indigo-600 text-white'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600'
      }`}
    >
      {label}
    </button>
  );
}

interface RecentTransactionsProps {
  state: AppState;
}

function RecentTransactions({ state }: RecentTransactionsProps) {
  const accountById = new Map(state.accounts.map((a) => [a.id, a]));
  const recent = [...state.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  if (recent.length === 0) {
    return <div className="text-sm text-slate-500">还没有流水。到「流水」标签录入。</div>;
  }

  const TYPE_LABEL: Record<Transaction['type'], string> = {
    income: '收入',
    expense: '支出',
    transfer: '转账',
    invest_buy: '买入',
    invest_sell: '卖出',
  };
  const SIGN: Record<Transaction['type'], string> = {
    income: 'text-emerald-600',
    expense: 'text-rose-600',
    transfer: 'text-slate-500',
    invest_buy: 'text-amber-600',
    invest_sell: 'text-cyan-600',
  };

  return (
    <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-700">
      {recent.map((t) => {
        const a = accountById.get(t.accountId);
        return (
          <li key={t.id} className="flex items-center justify-between py-1.5">
            <div className="flex flex-col">
              <span>
                <span className={`mr-2 text-xs ${SIGN[t.type]}`}>[{TYPE_LABEL[t.type]}]</span>
                {t.category || (t.type === 'transfer' ? '账户间转账' : '未分类')}
                {t.note && <span className="ml-2 text-xs text-slate-400">{t.note}</span>}
              </span>
              <span className="text-xs text-slate-500">
                {t.date} · {a?.name ?? '?'}
              </span>
            </div>
            <span className={`tabular-nums font-medium ${SIGN[t.type]}`}>
              {t.type === 'expense' || t.type === 'invest_buy' ? '-' : '+'}
              {t.amount.toFixed(2)} {a?.currency ?? ''}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

interface ExpenseByCategoryProps {
  state: AppState;
}

function ExpenseByCategory({ state }: ExpenseByCategoryProps) {
  const [range, setRange] = useState<'30' | '90' | '365' | 'all'>('30');
  const today = isoToday();
  const from =
    range === 'all'
      ? undefined
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() - Number(range));
          return d.toISOString().slice(0, 10);
        })();
  const breakdown = categoryBreakdown(state, { type: 'expense', from, to: today });

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">支出分类</h3>
        <div className="ml-auto flex gap-1">
          {(['30', '90', '365', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded px-2 py-1 text-xs ${
                range === r
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200'
              }`}
            >
              {r === 'all' ? '全部' : `${r} 天`}
            </button>
          ))}
        </div>
      </div>
      <ExpensePieChart data={breakdown} />
    </div>
  );
}

function exportJson(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cashflow-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

interface DataActionsProps {
  onExport: () => void;
  onImport: (state: AppState) => void;
  onReset: () => void;
}

function DataActions({ onExport, onImport, onReset }: DataActionsProps) {
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppState;
        onImport(parsed);
      } catch {
        alert('导入失败：文件不是有效的 JSON。');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }
  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
      <h3 className="text-sm font-semibold">数据导入 / 导出</h3>
      <div className="flex flex-wrap gap-2">
        <button onClick={onExport} className="rounded-md bg-slate-100 px-3 py-1.5 text-sm dark:bg-slate-700">
          导出 JSON
        </button>
        <label className="cursor-pointer rounded-md bg-slate-100 px-3 py-1.5 text-sm dark:bg-slate-700">
          导入 JSON
          <input type="file" accept="application/json" className="hidden" onChange={handleFile} />
        </label>
        <button
          onClick={onReset}
          className="rounded-md bg-rose-100 px-3 py-1.5 text-sm text-rose-700 dark:bg-rose-900/40 dark:text-rose-200"
        >
          重置数据
        </button>
      </div>
    </div>
  );
}
