import 'dotenv/config';
import http from 'http';

const PORT = 3001;
const KIMI_URL = 'https://api.moonshot.cn/v1/chat/completions';

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { reject(new Error('Invalid JSON')); }
    });
  });
}

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function parseJson(text) {
  // 1. direct parse
  try { return JSON.parse(text.trim()); } catch { /* */ }
  // 2. strip markdown code fences
  const stripped = text.replace(/```(?:json)?/gi, '').trim();
  try { return JSON.parse(stripped); } catch { /* */ }
  // 3. extract first balanced JSON object using brace depth
  let depth = 0, start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') { if (depth === 0) start = i; depth++; }
    else if (text[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        try { return JSON.parse(text.slice(start, i + 1)); } catch { start = -1; }
      }
    }
  }
  return null;
}

async function kimiRequest(body) {
  const response = await fetch(KIMI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.KIMI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Kimi error: ${err}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function handleGenerate(req, res) {
  const { input } = await readBody(req);
  if (!input) return send(res, 400, { error: 'Missing input' });
  const result = await kimiRequest({
    model: 'moonshot-v1-8k',
    messages: [{ role: 'user', content: input }],
  });
  send(res, 200, { result });
}

async function handleIdentify(req, res) {
  const { image } = await readBody(req);
  if (!image) return send(res, 400, { error: 'Missing image' });

  const text = await kimiRequest({
    model: 'moonshot-v1-8k-vision-preview',
    messages: [
      { role: 'system', content: '你是商品识别专家。只返回合法 JSON，不要任何解释文字。' },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } },
          { type: 'text', text: '识别图片中的商品，返回 JSON：{"name":"商品名称","category":"类别","brand":"品牌"}' },
        ],
      },
    ],
  });

  const parsed = parseJson(text);
  send(res, 200, {
    name: parsed?.name || '未知商品',
    category: parsed?.category || '其他',
    brand: parsed?.brand || '未知',
  });
}

const CHAT_SYSTEM = `你是一个专业库存收货商，擅长估价清仓商品。

规则：
1. 每次只问1个关键问题
2. 最多5轮问答，第5轮必须给出最终估价
3. 问题必须影响价格，不要问废话
4. 始终用JSON格式回复，不要任何多余文字

重点信息：品牌、成色、使用时长、包装情况、市场需求

未结束时输出：{"question":"问题","done":false}
结束时输出：{"estimated_price":"$10-$15","resale_price":"$20-$30","quick_sale_price":"$8-$10","confidence":"medium","reason":"原因","done":true}`;

async function handleChat(req, res) {
  const { messages } = await readBody(req);
  if (!messages || !Array.isArray(messages)) return send(res, 400, { error: 'Missing messages' });

  const kimiMessages = [{ role: 'system', content: CHAT_SYSTEM }, ...messages];

  let text = await kimiRequest({ model: 'moonshot-v1-8k', messages: kimiMessages });
  let parsed = parseJson(text);

  // retry once with explicit reminder if first attempt returns non-JSON
  if (!parsed) {
    console.warn('[chat] non-JSON response, retrying. Raw:', text.slice(0, 200));
    const retry = [
      ...kimiMessages,
      { role: 'assistant', content: text },
      { role: 'user', content: '请严格按照JSON格式回复，不要包含任何其他文字。' },
    ];
    text = await kimiRequest({ model: 'moonshot-v1-8k', messages: retry });
    parsed = parseJson(text);
  }

  if (!parsed) {
    console.error('[chat] still non-JSON after retry. Raw:', text.slice(0, 200));
    return send(res, 500, { error: 'Invalid AI response' });
  }
  send(res, 200, parsed);
}

http.createServer(async (req, res) => {
  const url = req.url;

  if (req.method !== 'POST') {
    return send(res, 405, { error: 'Method Not Allowed' });
  }

  try {
    if (url === '/api/generate') return await handleGenerate(req, res);
    if (url === '/api/identify') return await handleIdentify(req, res);
    if (url === '/api/chat') return await handleChat(req, res);
    send(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error(`[${url}] error:`, err.message);
    send(res, 500, { error: 'Internal server error' });
  }
}).listen(PORT, () => {
  console.log(`API dev server running at http://localhost:${PORT}`);
});
