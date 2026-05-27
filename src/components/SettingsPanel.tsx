import { useState } from 'react';
import type { AppSettings, Category } from '../types';

interface SettingsPanelProps {
  settings: AppSettings;
  categories: Category[];
  onSaveSettings: (s: AppSettings) => void;
  onAddCategory: (c: Omit<Category, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
}

export function SettingsPanel({
  settings,
  categories,
  onSaveSettings,
  onAddCategory,
  onDeleteCategory,
}: SettingsPanelProps) {
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatGroup, setNewCatGroup] = useState<Category['group']>('expense');

  function saveSettings() {
    onSaveSettings(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory({ name: newCatName.trim(), group: newCatGroup });
    setNewCatName('');
  }

  const grouped: Record<Category['group'], Category[]> = {
    income: categories.filter((c) => c.group === 'income'),
    expense: categories.filter((c) => c.group === 'expense'),
    invest: categories.filter((c) => c.group === 'invest'),
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-sm font-semibold">Kimi 设置</h3>
        <Field label="Kimi API Key（Moonshot）">
          <input
            type="password"
            value={draft.kimiApiKey}
            onChange={(e) => setDraft({ ...draft, kimiApiKey: e.target.value })}
            placeholder="sk-..."
            className={inputCls}
          />
          <p className="mt-1 text-xs text-slate-500">仅保存在本机浏览器，不会进入仓库。</p>
        </Field>
        <Field label="模型">
          <select
            value={draft.kimiModel}
            onChange={(e) => setDraft({ ...draft, kimiModel: e.target.value })}
            className={inputCls}
          >
            <option value="moonshot-v1-8k">moonshot-v1-8k</option>
            <option value="moonshot-v1-32k">moonshot-v1-32k</option>
            <option value="moonshot-v1-128k">moonshot-v1-128k</option>
          </select>
        </Field>
        <Field label="代理 URL（可选，处理 CORS）">
          <input
            value={draft.proxyUrl}
            onChange={(e) => setDraft({ ...draft, proxyUrl: e.target.value })}
            placeholder="https://your-worker.workers.dev/v1/chat/completions"
            className={inputCls}
          />
        </Field>
        <button
          onClick={saveSettings}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {saved ? '已保存 ✓' : '保存设置'}
        </button>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-sm font-semibold">分类管理</h3>
        <form onSubmit={addCategory} className="grid grid-cols-3 gap-2">
          <input
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="新分类名"
            className={inputCls}
          />
          <select
            value={newCatGroup}
            onChange={(e) => setNewCatGroup(e.target.value as Category['group'])}
            className={inputCls}
          >
            <option value="income">收入</option>
            <option value="expense">支出</option>
            <option value="invest">投资</option>
          </select>
          <button type="submit" className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-500">
            添加
          </button>
        </form>
        {(['income', 'expense', 'invest'] as const).map((g) => (
          <div key={g}>
            <div className="mb-1 text-xs font-medium text-slate-500">
              {g === 'income' ? '收入分类' : g === 'expense' ? '支出分类' : '投资分类'}
            </div>
            <div className="flex flex-wrap gap-1">
              {grouped[g].map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-700"
                >
                  {c.name}
                  <button
                    onClick={() => onDeleteCategory(c.id)}
                    className="text-rose-500 hover:text-rose-700"
                    aria-label={`删除分类 ${c.name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {grouped[g].length === 0 && <span className="text-xs text-slate-400">无</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <div className="mb-1 font-medium">{label}</div>
      {children}
    </label>
  );
}
