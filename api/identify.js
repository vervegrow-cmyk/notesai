export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { image, text } = req.body;
  if (!image && !text) {
    return res.status(400).json({ error: 'Missing image or text' });
  }

  try {
    const isVision = !!image;
    const model = isVision ? 'moonshot-v1-8k-vision-preview' : 'moonshot-v1-8k';
    const userContent = isVision
      ? [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } },
          { type: 'text', text: '识别图片中的商品，返回 JSON 格式：{"name":"商品名称","category":"商品类别","brand":"品牌，不确定则填未知"}' },
        ]
      : `以下是商品表格数据，分析并识别商品信息，返回 JSON：{"name":"商品名称","category":"商品类别","brand":"品牌，不确定则填未知"}\n\n${text}`;

    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: '你是商品识别专家。只返回合法 JSON，不要任何解释文字。' },
          { role: 'user', content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Kimi identify error:', err);
      return res.status(500).json({ error: 'Kimi request failed' });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? '';

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      try {
        parsed = match ? JSON.parse(match[0]) : null;
      } catch {
        parsed = null;
      }
    }

    if (!parsed) {
      return res.status(200).json({ name: '未知商品', category: '其他', brand: '未知' });
    }

    return res.status(200).json({
      name: parsed.name || '未知商品',
      category: parsed.category || '其他',
      brand: parsed.brand || '未知',
    });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
