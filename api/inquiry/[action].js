import * as h from '../_handlers/inquiry.js';

const HANDLERS = {
  create:          h.create,
  save:            h.create,      // legacy alias
  list:            h.list,
  get:             h.get,
  update:          h.update,
  'update-status': h.updateStatus,
  delete:          h.del,
  statistics:      h.statistics,
};

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false });

  const fn = HANDLERS[req.query.action];
  if (!fn) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Unknown inquiry action: ${req.query.action}` } });

  try {
    return await fn(req, res);
  } catch (err) {
    console.error(`[inquiry/${req.query.action}]`, err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
}
