export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { input } = req.body;

  if (!input) {
    return res.status(400).json({ error: 'Missing input' });
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
        messages: [{ role: 'user', content: input }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Kimi error:', err);
      return res.status(500).json({ error: 'Kimi request failed' });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content ?? '';

    return res.status(200).json({ result });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
