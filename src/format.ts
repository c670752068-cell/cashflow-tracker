import type { Currency } from './types';

const SYMBOL: Record<Currency, string> = {
  CNY: '¥',
  USD: '$',
  HKD: 'HK$',
};

export function currencySymbol(c: Currency): string {
  return SYMBOL[c];
}

export function formatMoney(n: number, c: Currency = 'CNY'): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return `${sign}${SYMBOL[c]}${abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function formatSignedMoney(n: number, c: Currency = 'CNY'): string {
  if (n > 0) return `+${formatMoney(n, c)}`;
  return formatMoney(n, c);
}
