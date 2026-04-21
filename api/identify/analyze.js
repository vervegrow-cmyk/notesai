import { identifyController } from '../../features/identify/controller.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false });
  try {
    const result = await identifyController(req.body);
    return res.status(result.success ? 200 : (result.error?.code === 'VALIDATION_ERROR' ? 400 : 500)).json(result);
  } catch (err) {
    console.error('[identify/analyze]', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
}
