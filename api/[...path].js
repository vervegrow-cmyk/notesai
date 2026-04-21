import * as auth    from './_handlers/auth.js';
import * as inquiry from './_handlers/inquiry.js';
import * as ai      from './_handlers/ai.js';

// Single Vercel Serverless Function — dispatches all /api/* routes
// Keeps function count at 1 (well within Hobby plan's 12-function limit)

const ROUTES = {
  // Auth
  'auth/login':    auth.login,
  'auth/logout':   auth.logout,
  'auth/register': auth.register,
  'auth/verify':   auth.verify,

  // Inquiry CRUD
  'inquiry/create':        inquiry.create,
  'inquiry/list':          inquiry.list,
  'inquiry/get':           inquiry.get,
  'inquiry/update':        inquiry.update,
  'inquiry/update-status': inquiry.updateStatus,
  'inquiry/delete':        inquiry.del,
  'inquiry/statistics':    inquiry.statistics,

  // Legacy aliases
  'inquiry/save': inquiry.create,

  // Logistics
  'logistics/select': inquiry.logisticsSelect,

  // AI
  'pricing/calculate': ai.pricingCalculate,
  'identify/analyze':  ai.identifyAnalyze,
  'identify/group':    ai.identifyGroup,

  // Legacy AI aliases
  'chat':     ai.pricingCalculate,
  'identify': ai.identifyAnalyze,
};

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST' } });
  }

  const segments = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
  const routeKey = segments.join('/');
  const routeHandler = ROUTES[routeKey];

  if (!routeHandler) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route not found: /api/${routeKey}` } });
  }

  try {
    return await routeHandler(req, res);
  } catch (err) {
    console.error(`[/api/${routeKey}]`, err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  }
}
