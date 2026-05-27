// Cloudflare Worker：Moonshot Kimi API CORS 代理
// 用途：浏览器无法直连 https://api.moonshot.cn 时，通过该 Worker 中转。
// 部署步骤见 README.md「Kimi CORS 代理」一节。

const UPSTREAM = 'https://api.moonshot.cn';
const ALLOWED_ORIGINS = [
  // 部署后把你的 GitHub Pages 地址加进来，比如：
  // 'https://your-name.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] ?? '*';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') ?? '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);
    const upstream = UPSTREAM + url.pathname + url.search;

    const upstreamReq = new Request(upstream, {
      method: request.method,
      headers: {
        Authorization: request.headers.get('Authorization') ?? '',
        'Content-Type': request.headers.get('Content-Type') ?? 'application/json',
      },
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text(),
    });

    const resp = await fetch(upstreamReq);
    const out = new Response(resp.body, resp);
    for (const [k, v] of Object.entries(cors)) out.headers.set(k, v);
    return out;
  },
};
