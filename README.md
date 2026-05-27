# 我的现金流 · Cashflow Tracker

个人收支与现金流追踪：

- 多账户多币种（CNY / USD / HKD），预设 支付宝 / 微信 / 招商银行 / 现金，可自由增删改
- 手动录入流水（收入 / 支出 / 转账 / 投资买入 / 投资卖出）
- **现金余额曲线**（折线图，30/90/180/365 天，按币种分线）
- 月度收支柱状图、支出分类饼图
- 内置本地财务诊断（储蓄率、应急金、分类突增、入不敷出）
- 可选接入 **Kimi（Moonshot）API** 做财务深度分析
- 数据 100% 保存在浏览器 localStorage，**不上传服务器**
- JSON 一键导入导出，方便备份
- 响应式，手机浏览器直接访问 GitHub Pages 即可使用

技术栈：Vite + React 19 + TypeScript + TailwindCSS + Recharts + date-fns。

> **与 portfolio-tracker 的关系**：两者独立。portfolio-tracker 关注资产结构（占比饼图），cashflow-tracker 关注现金流（余额曲线）。可同时部署到 GitHub Pages 的两个独立子路径。

---

## 本地开发

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 输出到 dist/
npm run preview
```

---

## 部署到 GitHub Pages

1. GitHub 网页新建空仓库 `cashflow-tracker`，不要勾 README / license。
2. 本项目根目录：
   ```bash
   git init
   git branch -M main
   git add .
   git commit -m "feat: initial cashflow tracker"
   git remote add origin https://github.com/<你的用户名>/cashflow-tracker.git
   git push -u origin main
   ```
3. 仓库 **Settings → Pages → Source = GitHub Actions**。
4. Actions 跑完后访问 `https://<你的用户名>.github.io/cashflow-tracker/`。

> Workflow 自动把 Vite `base` 设为 `/<仓库名>/`，无需手改 `vite.config.ts`。

---

## Kimi 接入

1. [platform.moonshot.cn](https://platform.moonshot.cn/) 创建 API Key。
2. 应用「设置」标签填入 → 保存。
3. 「分析」标签点「调用 Kimi 分析」。

Key 只存本机浏览器 localStorage，绝不进入 Git。

### CORS 代理（直连失败时）

如果浏览器报网络错误，部署仓库根目录 [`cloudflare-worker-proxy.js`](./cloudflare-worker-proxy.js)：

1. [dash.cloudflare.com](https://dash.cloudflare.com/) → Workers & Pages → Create Worker。
2. 粘贴整个文件内容，把 `ALLOWED_ORIGINS` 加入你的 Pages 地址。
3. Save and Deploy，得到 `https://xxx.workers.dev`。
4. 应用「设置」→ 代理 URL 填 `https://xxx.workers.dev/v1/chat/completions`。

---

## 本地诊断规则

| 规则 | 阈值 | 等级 |
|---|---|---|
| 当月支出 > 收入 | — | 严重 |
| 储蓄率 < 10% | — | 警示 |
| 单类支出 vs 过去 3 月均值 +50% | — | 警示 |
| 现金 < 3 个月平均支出 | — | 警示（应急金不足）|
| 现金 > 24 个月平均支出 | — | 提示（资金闲置）|

阈值定义在 [`src/analyzer.ts`](./src/analyzer.ts)。

---

## 项目结构

```
src/
├── App.tsx              # 主路由 + 状态
├── analyzer.ts          # 本地财务规则
├── format.ts            # 货币 / 百分比格式化
├── kimi.ts              # Moonshot Kimi 调用
├── metrics.ts           # 余额 / 余额曲线 / 月度 / 分类
├── storage.ts           # localStorage + 预设
├── types.ts             # 共享类型
└── components/
    ├── AccountsPanel.tsx     # 账户 CRUD
    ├── AnalysisPanel.tsx     # Kimi 面板
    ├── BalanceCurve.tsx      # 余额曲线
    ├── ExpensePieChart.tsx   # 支出分类饼图
    ├── MonthlyBarChart.tsx   # 月度收支柱状图
    ├── RiskList.tsx          # 风险列表
    ├── SettingsPanel.tsx     # Kimi / 分类
    ├── Summary.tsx           # 总览卡片
    └── TransactionsTable.tsx # 流水 CRUD
```

---

## 许可

MIT
