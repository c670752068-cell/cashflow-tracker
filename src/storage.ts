import type { Account, AppSettings, AppState, Category } from './types';

const STATE_KEY = 'cashflow-tracker:state-v1';
const SETTINGS_KEY = 'cashflow-tracker:settings-v1';

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const PRESET_ACCOUNTS: Omit<Account, 'id'>[] = [
  { name: '支付宝', type: 'wallet', currency: 'CNY', openingBalance: 0, openingDate: today() },
  { name: '微信', type: 'wallet', currency: 'CNY', openingBalance: 0, openingDate: today() },
  { name: '招商银行', type: 'bank', currency: 'CNY', openingBalance: 0, openingDate: today() },
  { name: '现金', type: 'cash', currency: 'CNY', openingBalance: 0, openingDate: today() },
];

const PRESET_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: '工资', group: 'income' },
  { name: '奖金', group: 'income' },
  { name: '利息', group: 'income' },
  { name: '分红', group: 'income' },
  { name: '退款', group: 'income' },
  { name: '其他收入', group: 'income' },
  { name: '餐饮', group: 'expense' },
  { name: '交通', group: 'expense' },
  { name: '购物', group: 'expense' },
  { name: '房租', group: 'expense' },
  { name: '水电网', group: 'expense' },
  { name: '医疗', group: 'expense' },
  { name: '娱乐', group: 'expense' },
  { name: '教育', group: 'expense' },
  { name: '订阅', group: 'expense' },
  { name: '其他支出', group: 'expense' },
  { name: '股票', group: 'invest' },
  { name: '基金', group: 'invest' },
  { name: '加密', group: 'invest' },
  { name: '其他投资', group: 'invest' },
];

const defaultSettings: AppSettings = {
  kimiApiKey: '',
  kimiModel: 'moonshot-v1-8k',
  proxyUrl: '',
};

function buildInitial(): AppState {
  return {
    accounts: PRESET_ACCOUNTS.map((a) => ({ ...a, id: newId() })),
    transactions: [],
    categories: PRESET_CATEGORIES.map((c) => ({ ...c, id: newId() })),
    updatedAt: new Date().toISOString(),
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return buildInitial();
    const parsed = JSON.parse(raw) as AppState;
    return {
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      categories: Array.isArray(parsed.categories) && parsed.categories.length > 0
        ? parsed.categories
        : PRESET_CATEGORIES.map((c) => ({ ...c, id: newId() })),
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return buildInitial();
  }
}

export function saveState(state: AppState): void {
  const next: AppState = { ...state, updatedAt: new Date().toISOString() };
  localStorage.setItem(STATE_KEY, JSON.stringify(next));
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(s: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function emptyState(): AppState {
  return buildInitial();
}
