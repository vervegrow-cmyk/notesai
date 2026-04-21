import { cmd } from '../_lib/upstash.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false });

  const { id, ...patch } = req.body ?? {};
  if (!id) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'id 必填' } });

  try {
    const json = await cmd(['GET', `inquiry:${id}`]);
    if (!json) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '询价不存在' } });

    const inquiry = { ...JSON.parse(json), ...patch, id, updatedAt: new Date().toISOString() };
    await cmd(['SET', `inquiry:${id}`, JSON.stringify(inquiry)]);
    return res.status(200).json({ success: true, data: { inquiry } });
  } catch (err) {
    console.error('inquiry/update error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '更新失败' } });
  }
}
