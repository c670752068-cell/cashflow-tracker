import type { AppState, MonthlyAggregate, RiskFinding } from './types';
import { categoryBreakdown, currencyTotals, monthlyAggregates } from './metrics';

const LOW_SAVINGS = 0.1;
const HIGH_SAVINGS_BAR = 0.3;
const CATEGORY_SURGE = 0.5; // +50% vs trailing 3-month avg
const EMERGENCY_MIN_MONTHS = 3;
const IDLE_MAX_MONTHS = 24;

export function analyzeCashflow(state: AppState): RiskFinding[] {
  const findings: RiskFinding[] = [];
  const monthly = monthlyAggregates(state, 6);
  const completed = monthly.filter((m) => m.income > 0 || m.expense > 0);

  if (state.transactions.length === 0) {
    findings.push({
      level: 'info',
      title: '尚无流水',
      detail: '到「流水」标签录入收支后，本面板会给出本地财务诊断。',
    });
    return findings;
  }

  // Latest completed month
  const last = completed[completed.length - 1];
  if (last) {
    if (last.expense > last.income) {
      findings.push({
        level: 'critical',
        title: `${last.month} 入不敷出`,
        detail: `当月收入 ${last.income.toFixed(2)}，支出 ${last.expense.toFixed(2)}，净流出 ${(last.expense - last.income).toFixed(2)}。`,
      });
    }
    if (last.income > 0 && last.savingsRate < LOW_SAVINGS) {
      findings.push({
        level: 'warn',
        title: `${last.month} 储蓄率仅 ${(last.savingsRate * 100).toFixed(1)}%`,
        detail: `低于 10%。常规建议储蓄率维持 ≥ 20%。`,
      });
    } else if (last.income > 0 && last.savingsRate >= HIGH_SAVINGS_BAR) {
      findings.push({
        level: 'info',
        title: `${last.month} 储蓄率 ${(last.savingsRate * 100).toFixed(1)}%`,
        detail: '储蓄率健康。可考虑把闲置现金分批投资。',
      });
    }
  }

  // Category surge: last full month expense by category vs trailing 3 months avg
  if (completed.length >= 4) {
    const surgeFindings = detectCategorySurge(state, completed);
    findings.push(...surgeFindings);
  }

  // Emergency fund / idle cash check, based on average monthly expense over last 3 completed months
  const last3 = completed.slice(-3);
  if (last3.length > 0) {
    const avgExpense = last3.reduce((s, m) => s + m.expense, 0) / last3.length;
    if (avgExpense > 0) {
      const totals = currencyTotals(state);
      const cnyCash = totals.find((t) => t.currency === 'CNY')?.cash ?? 0;
      const months = cnyCash / avgExpense;
      if (months < EMERGENCY_MIN_MONTHS) {
        findings.push({
          level: 'warn',
          title: `应急金不足（${months.toFixed(1)} 个月）`,
          detail: `按近 3 个月人民币平均支出 ${avgExpense.toFixed(2)} 计算，建议保留至少 3 个月（约 ${(avgExpense * 3).toFixed(2)}）现金。`,
        });
      } else if (months > IDLE_MAX_MONTHS) {
        findings.push({
          level: 'info',
          title: `现金闲置较多（约 ${months.toFixed(1)} 个月支出）`,
          detail: '超过 24 个月支出的现金可考虑配置短债 / 货基 / 长期投资以对抗通胀。',
        });
      }
    }
  }

  if (findings.length === 0) {
    findings.push({
      level: 'info',
      title: '当前未发现明显异常',
      detail: '收支结构、储蓄率、应急金、分类支出均在合理区间。',
    });
  }
  return findings;
}

function detectCategorySurge(
  state: AppState,
  completed: MonthlyAggregate[],
): RiskFinding[] {
  const findings: RiskFinding[] = [];
  const last = completed[completed.length - 1];
  const prev3 = completed.slice(-4, -1);
  if (!last || prev3.length < 3) return findings;

  const lastFirst = `${last.month}-01`;
  const lastLast = `${last.month}-31`;
  const lastBreak = categoryBreakdown(state, { type: 'expense', from: lastFirst, to: lastLast });

  for (const cat of lastBreak) {
    if (cat.total < 100) continue; // ignore noise
    const prevTotals: number[] = [];
    for (const m of prev3) {
      const b = categoryBreakdown(state, {
        type: 'expense',
        from: `${m.month}-01`,
        to: `${m.month}-31`,
      });
      prevTotals.push(b.find((x) => x.category === cat.category)?.total ?? 0);
    }
    const avg = prevTotals.reduce((s, v) => s + v, 0) / prevTotals.length;
    if (avg <= 0) continue;
    const delta = (cat.total - avg) / avg;
    if (delta >= CATEGORY_SURGE) {
      findings.push({
        level: 'warn',
        title: `「${cat.category}」支出突增 +${(delta * 100).toFixed(0)}%`,
        detail: `本月 ${cat.total.toFixed(2)}，过去 3 月均 ${avg.toFixed(2)}。检查是否有非经常性支出。`,
      });
    }
  }
  return findings;
}
