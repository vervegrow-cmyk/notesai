const SYSTEM_PROMPT = `你是一个专业库存收货商，擅长估价清仓商品。

规则：
1. 每次只问1个关键问题
2. 最多5轮问答，第5轮必须给出最终估价
3. 问题必须影响价格，不要问废话
4. 始终用JSON格式回复，不要任何多余文字

重点信息：品牌、成色、使用时长、包装情况、市场需求

未结束时输出：{"question":"问题","done":false}
结束时输出：{"estimated_price":"$10-$15","resale_price":"$20-$30","quick_sale_price":"$8-$10","confidence":"medium","reason":"原因","done":true}`;

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing messages' });
  }

  try {
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Kimi chat error:', err);
      return res.status(500).json({ error: 'Kimi request failed' });
    }

    const data = await response.json();
    let text = data.choices?.[0]?.message?.content ?? '';
    let parsed = parseJson(text);

    if (!parsed) {
      console.warn('non-JSON, retrying. Raw:', text.slice(0, 200));
      const retryRes = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.KIMI_API_KEY}` },
        body: JSON.stringify({
          model: 'moonshot-v1-8k',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages,
            { role: 'assistant', content: text },
            { role: 'user', content: '请严格按照JSON格式回复，不要包含任何其他文字。' },
          ],
        }),
      });
      if (retryRes.ok) {
        const retryData = await retryRes.json();
        text = retryData.choices?.[0]?.message?.content ?? '';
        parsed = parseJson(text);
      }
    }

    if (!parsed) {
      console.error('still invalid after retry:', text.slice(0, 200));
      return res.status(500).json({ error: 'Invalid response from AI' });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
