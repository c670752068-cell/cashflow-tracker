import { format, parseISO, eachDayOfInterval, startOfMonth, subMonths } from 'date-fns';
import type {
  Account,
  AccountBalance,
  AppState,
  CategoryBreakdown,
  Currency,
  CurrencyTotals,
  CurvePoint,
  MonthlyAggregate,
  Transaction,
  TxType,
} from './types';

const CURRENCIES: Currency[] = ['CNY', 'USD', 'HKD'];

// How a tx changes its account's balance
function signFor(type: TxType): -1 | 0 | 1 {
  switch (type) {
    case 'income':
    case 'invest_sell':
      return 1;
    case 'expense':
    case 'invest_buy':
      return -1;
    case 'transfer':
      return -1; // source decreases; counterparty handled separately
    default:
      return 0;
  }
}

export function accountBalances(state: AppState): AccountBalance[] {
  const byId = new Map<string, Account>(state.accounts.map((a) => [a.id, a]));
  const balances = new Map<string, number>(
    state.accounts.map((a) => [a.id, a.openingBalance]),
  );

  for (const tx of state.transactions) {
    if (!byId.has(tx.accountId)) continue;
    const s = signFor(tx.type);
    balances.set(tx.accountId, (balances.get(tx.accountId) ?? 0) + s * tx.amount);
    if (tx.type === 'transfer' && tx.counterpartyAccountId && byId.has(tx.counterpartyAccountId)) {
      balances.set(
        tx.counterpartyAccountId,
        (balances.get(tx.counterpartyAccountId) ?? 0) + tx.amount,
      );
    }
  }

  return state.accounts.map((a) => ({ account: a, balance: balances.get(a.id) ?? 0 }));
}

export function currencyTotals(state: AppState): CurrencyTotals[] {
  const totals = new Map<Currency, number>();
  for (const ab of accountBalances(state)) {
    totals.set(ab.account.currency, (totals.get(ab.account.currency) ?? 0) + ab.balance);
  }
  return CURRENCIES.filter((c) => totals.has(c)).map((c) => ({
    currency: c,
    cash: totals.get(c) ?? 0,
  }));
}

export interface BalanceCurveOptions {
  days: number; // window size
}

// Returns one point per day for the past `days` days, ending today.
// Each point has cumulative cash totals per currency.
export function balanceCurve(state: AppState, opts: BalanceCurveOptions): CurvePoint[] {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (opts.days - 1));

  // Opening balances aggregated by currency, only counted if openingDate <= a given date.
  const accountsByCurrency: Record<Currency, Account[]> = { CNY: [], USD: [], HKD: [] };
  for (const a of state.accounts) accountsByCurrency[a.currency].push(a);

  // Sort tx by date asc
  const txs = [...state.transactions].sort((a, b) => a.date.localeCompare(b.date));

  const days = eachDayOfInterval({ start, end });
  const points: CurvePoint[] = [];
  let txIdx = 0;
  const running: Record<Currency, number> = { CNY: 0, USD: 0, HKD: 0 };

  // Seed running totals with opening balances that occurred strictly before window start
  const startStr = format(start, 'yyyy-MM-dd');
  for (const a of state.accounts) {
    if (a.openingDate < startStr) running[a.currency] += a.openingBalance;
  }
  // Seed with txs that occurred strictly before window start
  while (txIdx < txs.length && txs[txIdx].date < startStr) {
    applyTx(txs[txIdx], state.accounts, running);
    txIdx++;
  }

  for (const d of days) {
    const dStr = format(d, 'yyyy-MM-dd');
    // Add opening balances that activate on this date
    for (const a of state.accounts) {
      if (a.openingDate === dStr) running[a.currency] += a.openingBalance;
    }
    // Apply txs on this date
    while (txIdx < txs.length && txs[txIdx].date === dStr) {
      applyTx(txs[txIdx], state.accounts, running);
      txIdx++;
    }
    const point: CurvePoint = { date: dStr };
    if (accountsByCurrency.CNY.length > 0) point.CNY = round(running.CNY);
    if (accountsByCurrency.USD.length > 0) point.USD = round(running.USD);
    if (accountsByCurrency.HKD.length > 0) point.HKD = round(running.HKD);
    points.push(point);
  }
  return points;
}

function applyTx(
  tx: Transaction,
  accounts: Account[],
  running: Record<Currency, number>,
): void {
  const src = accounts.find((a) => a.id === tx.accountId);
  if (!src) return;
  const s = signFor(tx.type);
  running[src.currency] += s * tx.amount;
  if (tx.type === 'transfer' && tx.counterpartyAccountId) {
    const dst = accounts.find((a) => a.id === tx.counterpartyAccountId);
    if (dst) running[dst.currency] += tx.amount;
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function monthlyAggregates(state: AppState, months: number): MonthlyAggregate[] {
  const buckets = new Map<string, { income: number; expense: number }>();
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const m = format(startOfMonth(subMonths(now, i)), 'yyyy-MM');
    buckets.set(m, { income: 0, expense: 0 });
  }
  for (const tx of state.transactions) {
    const m = tx.date.slice(0, 7);
    if (!buckets.has(m)) continue;
    const b = buckets.get(m);
    if (!b) continue;
    if (tx.type === 'income') b.income += tx.amount;
    if (tx.type === 'expense') b.expense += tx.amount;
  }
  return Array.from(buckets.entries()).map(([month, b]) => {
    const net = b.income - b.expense;
    const savingsRate = b.income > 0 ? net / b.income : 0;
    return { month, income: round(b.income), expense: round(b.expense), net: round(net), savingsRate };
  });
}

export interface CategoryBreakdownOptions {
  from?: string; // YYYY-MM-DD inclusive
  to?: string;   // YYYY-MM-DD inclusive
  type: TxType;
}

export function categoryBreakdown(
  state: AppState,
  opts: CategoryBreakdownOptions,
): CategoryBreakdown[] {
  const totals = new Map<string, number>();
  let grand = 0;
  for (const tx of state.transactions) {
    if (tx.type !== opts.type) continue;
    if (opts.from && tx.date < opts.from) continue;
    if (opts.to && tx.date > opts.to) continue;
    const key = tx.category || '未分类';
    totals.set(key, (totals.get(key) ?? 0) + tx.amount);
    grand += tx.amount;
  }
  return Array.from(totals.entries())
    .map(([category, total]) => ({
      category,
      total: round(total),
      pct: grand > 0 ? total / grand : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function isoToday(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function isoMonth(d: string): string {
  return d.slice(0, 7);
}

export function parseDate(d: string): Date {
  return parseISO(d);
}
