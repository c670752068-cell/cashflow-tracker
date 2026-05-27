import type {
  AppSettings,
  AppState,
  RiskFinding,
} from './types';
import {
  accountBalances,
  categoryBreakdown,
  currencyTotals,
  monthlyAggregates,
} from './metrics';

const DEFAULT_ENDPOINT = 'https://api.moonshot.cn/v1/chat/completions';

interface KimiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface KimiResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

export class KimiError extends Error {
  hint?: string;
  constructor(message: string, hint?: string) {
    super(message);
    this.name = 'KimiError';
    this.hint = hint;
  }
}

function buildPrompt(state: AppState, localFindings: RiskFinding[]): KimiMessage[] {
  const monthly = monthlyAggregates(state, 6);
  const totals = currencyTotals(state);
  const balances = accountBalances(state).map((b) => ({
    name: b.account.name,
    type: b.account.type,
    currency: b.account.currency,
    balance: round(b.balance),
  }));

  const last = monthly[monthly.length - 1];
  const expenseByCat = last
    ? categoryBreakdown(state, {
        type: 'expense',
        from: `${last.month}-01`,
        to: `${last.month}-31`,
      })
    : [];

  const summary = {
    cashByCurrency: totals.map((t) => ({ currency: t.currency, cash: round(t.cash) })),
    accountBalances: balances,
    monthly: monthly.map((m) => ({
      month: m.month,
      income: m.income,
      expense: m.expense,
      net: m.net,
      savingsRate: `${(m.savingsRate * 100).toFixed(1)}%`,
    })),
    latestMonthExpenseByCategory: expenseByCat.map((c) => ({
      category: c.category,
      total: c.total,
      pct: `${(c.pct * 100).toFixed(1)}%`,
    })),
    localFindings: localFindings.map((f) => `[${f.level}] ${f.title} — ${f.detail}`),
  };

  return [
    {
      role: 'system',
      content:
        '你是一名严谨、克制的个人理财顾问。基于用户提供的现金流快照（含账户余额、近 6 月收支、最新月支出分类）和本地风险提示，给出结构化中文诊断。' +
        '严格遵守：1) 不做具体投资品推荐 2) 不预测市场 3) 直接指出收支结构、储蓄率、应急金、分类异常 4) 给出 3-5 条可执行的改善建议。' +
        '输出 Markdown，使用「## 现金流体检」「## 主要风险」「## 改善建议」三个二级标题。',
    },
    {
      role: 'user',
      content: '现金流快照（JSON）：\n```json\n' + JSON.stringify(summary, null, 2) + '\n```',
    },
  ];
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function analyzeWithKimi(
  settings: AppSettings,
  state: AppState,
  localFindings: RiskFinding[],
): Promise<string> {
  if (!settings.kimiApiKey) {
    throw new KimiError('未配置 Kimi API Key', '请在「设置」中填入 Moonshot API Key。');
  }

  const endpoint = settings.proxyUrl?.trim() || DEFAULT_ENDPOINT;
  const messages = buildPrompt(state, localFindings);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.kimiApiKey}`,
      },
      body: JSON.stringify({
        model: settings.kimiModel || 'moonshot-v1-8k',
        messages,
        temperature: 0.3,
      }),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new KimiError(
      `网络请求失败：${msg}`,
      '浏览器直连 Moonshot API 可能被 CORS 拦截。请在「设置」中填入你的代理 URL，参考 README 的 Cloudflare Worker 示例。',
    );
  }

  let data: KimiResponse;
  try {
    data = (await response.json()) as KimiResponse;
  } catch {
    throw new KimiError(`响应非 JSON（HTTP ${response.status}）`);
  }

  if (!response.ok) {
    throw new KimiError(
      data.error?.message ?? `HTTP ${response.status}`,
      response.status === 401 ? '请检查 API Key 是否正确、是否过期。' : undefined,
    );
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new KimiError('Kimi 返回为空');
  return content;
}
