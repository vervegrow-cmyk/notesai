const KIMI_BASE_URL = 'https://api.moonshot.cn/v1/chat/completions';

/** Single raw call to the Kimi API. Returns the assistant's text content. */
export async function kimiChat({ model = 'moonshot-v1-8k', messages }) {
  const res = await fetch(KIMI_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.KIMI_API_KEY}`,
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Kimi API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}
