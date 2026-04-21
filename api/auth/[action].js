import * as h from '../_handlers/auth.js';

const HANDLERS = {
  login:    h.login,
  logout:   h.logout,
  register: h.register,
  verify:   h.verify,
};

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false });

  const fn = HANDLERS[req.query.action];
  if (!fn) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Unknown auth action: ${req.query.action}` } });
  return fn(req, res);
}
