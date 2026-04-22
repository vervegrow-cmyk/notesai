// POST /api/identify/group — cluster identified products into groups
// Self-contained: no imports outside api/

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function parseJson(text) {
  try { return JSON.parse(text.trim()); } catch { /* */ }
  const stripped = text.replace(/```(?:json)?/gi, '').trim();
  try { return JSON.parse(stripped); } catch { /* */ }
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

async function kimiChat({ model = 'moonshot-v1-8k', messages, retries = 2 }) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 1500 * attempt));
    try {
      const res = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.KIMI_API_KEY}` },
        body: JSON.stringify({ model, messages }),
      });
      if (!res.ok) {
        const err = await res.text();
        lastErr = new Error(`Kimi API error (${res.status}): ${err.slice(0, 200)}`);
        if (res.status >= 500 && attempt < retries) continue;
        throw lastErr;
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? '';
    } catch (err) {
      lastErr = err;
      if (attempt < retries) continue;
    }
  }
  throw lastErr;
}

function fallbackGroups(products) {
  return products.map((p, i) => ({ indices: [i], name: p.name, category: p.category, brand: p.brand }));
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { products } = req.body ?? {};
  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing products array' } });
  }

  if (products.length === 1) {
    return res.status(200).json({ success: true, data: { groups: fallbackGroups(products) } });
  }

  const list = products
    .map((p, i) => `[${i}] 名称：${p.name}，类别：${p.category}，品牌：${p.brand}`)
    .join('\n');

  try {
    const text = await kimiChat({
      messages: [
        { role: 'system', content: '你是商品分类专家。只输出合法 JSON，不要任何解释文字。' },
        {
          role: 'user',
          content: `以下是对多张图片的商品识别结果。请判断哪些图片是同一件商品（同款产品的不同拍摄角度），将其归为同一组。\n\n${list}\n\n规则：\n1. 名称高度相似 + 相同品牌/类别 → 同一组\n2. 名称存在包含关系 + 相同类别 → 同一组\n3. 明显不同商品 → 不同组\n4. 每组取最准确、最完整的名称作为代表名\n\n只输出 JSON，格式：\n{"groups":[{"indices":[0,1],"name":"代表名","category":"类别","brand":"品牌"}]}`,
        },
      ],
    });

    const parsed = parseJson(text);
    if (!Array.isArray(parsed?.groups)) throw new Error('Invalid grouping response');
    return res.status(200).json({ success: true, data: { groups: parsed.groups } });
  } catch (err) {
    console.error('[identify/group]', err.message);
    return res.status(200).json({ success: true, data: { groups: fallbackGroups(products) } });
  }
}
