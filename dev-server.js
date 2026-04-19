import 'dotenv/config';
import http from 'http';

const PORT = 3001;

http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/api/generate') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  let body = '';
  req.on('data', chunk => (body += chunk));
  req.on('end', async () => {
    try {
      const { input } = JSON.parse(body);
      if (!input) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing input' }));
        return;
      }

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
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'OpenAI request failed' }));
        return;
      }

      const data = await response.json();
      const result = data.choices?.[0]?.message?.content ?? '';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ result }));
    } catch (err) {
      console.error('Server error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
}).listen(PORT, () => {
  console.log(`API dev server running at http://localhost:${PORT}`);
});
