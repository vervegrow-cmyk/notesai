// Upstash Redis REST helper — NOT a Vercel route (underscore prefix)

// Supports both Upstash Redis env vars and Vercel KV env vars (same REST API)
function getConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('Redis not configured. Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in Vercel env vars.');
  return { url, token };
}

export async function cmd(command) {
  const { url, token } = getConfig();
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

export async function pipeline(commands) {
  const { url, token } = getConfig();
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  const results = await res.json();
  return results.map(r => r.result);
}
