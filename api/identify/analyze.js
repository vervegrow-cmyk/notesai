// Self-contained: no imports outside api/ — avoids Vercel nft bundling issues

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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.KIMI_API_KEY}`,
        },
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

async function identifyFromImage(imageBase64) {
  const text = await kimiChat({
    model: 'moonshot-v1-8k-vision-preview',
    messages: [
      { role: 'system', content: '你是商品识别专家。只返回合法 JSON，不要任何解释文字。' },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          { type: 'text', text: '识别图片中的商品，返回 JSON 格式：{"name":"商品名称","category":"商品类别","brand":"品牌，不确定则填未知"}' },
        ],
      },
    ],
  });
  const parsed = parseJson(text);
  return { name: parsed?.name || '未知商品', category: parsed?.category || '其他', brand: parsed?.brand || '未知' };
}

async function identifyFromText(rowText) {
  const text = await kimiChat({
    messages: [
      { role: 'system', content: '你是商品识别专家。只返回合法 JSON，不要任何解释文字。' },
      { role: 'user', content: `以下是商品表格数据，识别商品信息，返回 JSON：{"name":"商品名称","category":"类别","brand":"品牌"}\n\n${rowText}` },
    ],
  });
  const parsed = parseJson(text);
  return { name: parsed?.name || '未知商品', category: parsed?.category || '其他', brand: parsed?.brand || '未知' };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false });
  const { image, text } = req.body ?? {};
  if (!image && !text) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing image or text' } });
  }
  try {
    const result = image ? await identifyFromImage(image) : await identifyFromText(text);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('[identify] error:', err.message);
    return res.status(500).json({ success: false, error: { code: 'AI_ERROR', message: 'AI identification failed' } });
  }
}
