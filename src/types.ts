export type Currency = 'CNY' | 'USD' | 'HKD';

export type AccountType = 'cash' | 'bank' | 'wallet' | 'broker' | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  openingBalance: number;
  openingDate: string; // YYYY-MM-DD
}

export type TxType =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'invest_buy'
  | 'invest_sell';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  accountId: string;
  type: TxType;
  amount: number; // always positive; sign derived from type
  category: string;
  counterpartyAccountId?: string; // transfer target
  note?: string;
}

export interface Category {
  id: string;
  name: string;
  group: 'income' | 'expense' | 'invest';
  color?: string;
}

export interface AppSettings {
  kimiApiKey: string;
  kimiModel: string;
  proxyUrl: string;
}

export interface AppState {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  updatedAt: string;
}

export interface AccountBalance {
  account: Account;
  balance: number;
}

export interface CurrencyTotals {
  currency: Currency;
  cash: number;
}

export interface CurvePoint {
  date: string; // YYYY-MM-DD
  CNY?: number;
  USD?: number;
  HKD?: number;
}

export interface MonthlyAggregate {
  month: string; // YYYY-MM
  income: number;
  expense: number;
  net: number;
  savingsRate: number; // (income - expense) / income; 0 if income==0
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  pct: number;
}

export interface RiskFinding {
  level: 'info' | 'warn' | 'critical';
  title: string;
  detail: string;
}
