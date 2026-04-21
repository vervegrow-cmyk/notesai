import { cmd, pipeline } from '../_lib/upstash.js';

function parsePrice(v) {
  if (typeof v === 'number') return v;
  return parseFloat(String(v ?? 0).replace(/[^0-9.]/g, '')) || 0;
}

const VALID_TRANSITIONS = {
  new:              ['quoted', 'pending_recovery', 'accepted'],
  quoted:           ['pending_recovery', 'accepted', 'rejected'],
  pending_recovery: ['accepted', 'processing', 'completed'],
  accepted:         ['processing'],
  rejected:         [],
  processing:       ['completed'],
  completed:        [],
};

const VALID_INIT_STATUSES = ['new', 'pending_recovery', 'accepted'];

export async function create(req, res) {
  const { userName, contact, address = '', userType = 'personal', note = '', status: reqStatus, products = [], estimatedTotal } = req.body ?? {};
  if (!userName || !contact) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '姓名和联系方式不能为空' } });
  }
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const inquiry = {
    id,
    userName, customerName: userName,
    contact, phone: contact,
    address: address ?? '',
    userType,
    status: (reqStatus && VALID_INIT_STATUSES.includes(reqStatus)) ? reqStatus : 'new',
    estimatedTotal: typeof estimatedTotal === 'number' ? estimatedTotal : parsePrice(estimatedTotal),
    note: note ?? '',
    products: (products ?? []).map(p => ({
      id: crypto.randomUUID(), inquiryId: id,
      title: p.title ?? p.name ?? '未知商品',
      name: p.name ?? p.title ?? '未知商品',
      category: p.category ?? '其他',
      brand: p.brand ?? '未知品牌',
      images: p.images ?? (p.thumbnail ? [p.thumbnail] : []),
      thumbnail: p.thumbnail ?? p.images?.[0] ?? null,
      condition: p.condition ?? 'used',
      estimatedPrice: parsePrice(p.estimatedPrice),
      quantity: typeof p.quantity === 'number' ? p.quantity : 1,
    })),
    createdAt: now, updatedAt: now,
  };
  try {
    await cmd(['SET', `inquiry:${id}`, JSON.stringify(inquiry)]);
    await cmd(['LPUSH', 'inquiry:list', id]);
    return res.status(200).json({ success: true, data: { inquiry } });
  } catch (err) {
    console.error('inquiry/create error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '存储失败，请检查数据库配置' } });
  }
}

export async function list(req, res) {
  try {
    const ids = await cmd(['LRANGE', 'inquiry:list', 0, -1]);
    if (!ids || ids.length === 0) {
      return res.status(200).json({ success: true, data: { inquiries: [] } });
    }
    const jsons = await pipeline(ids.map(id => ['GET', `inquiry:${id}`]));
    const { status } = req.body ?? {};
    const inquiries = jsons
      .filter(Boolean).map(j => JSON.parse(j))
      .filter(inq => !status || inq.status === status)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.status(200).json({ success: true, data: { inquiries } });
  } catch (err) {
    console.error('inquiry/list error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '加载失败' } });
  }
}

export async function get(req, res) {
  const { id } = req.body ?? {};
  if (!id) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'id 必填' } });
  try {
    const json = await cmd(['GET', `inquiry:${id}`]);
    if (!json) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '询价不存在' } });
    return res.status(200).json({ success: true, data: { inquiry: JSON.parse(json) } });
  } catch (err) {
    console.error('inquiry/get error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '查询失败' } });
  }
}

export async function update(req, res) {
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

export async function updateStatus(req, res) {
  const { id, status } = req.body ?? {};
  if (!id || !status) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'id 和 status 必填' } });
  }
  try {
    const json = await cmd(['GET', `inquiry:${id}`]);
    if (!json) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '询价不存在' } });
    const inquiry = JSON.parse(json);
    const allowed = VALID_TRANSITIONS[inquiry.status] ?? [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TRANSITION', message: `不能从 ${inquiry.status} 转换到 ${status}` },
      });
    }
    inquiry.status = status;
    inquiry.updatedAt = new Date().toISOString();
    await cmd(['SET', `inquiry:${id}`, JSON.stringify(inquiry)]);
    return res.status(200).json({ success: true, data: { inquiry } });
  } catch (err) {
    console.error('inquiry/update-status error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '更新失败' } });
  }
}

export async function del(req, res) {
  const { id } = req.body ?? {};
  if (!id) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'id 必填' } });
  try {
    await cmd(['LREM', 'inquiry:list', 0, id]);
    await cmd(['DEL', `inquiry:${id}`]);
    return res.status(200).json({ success: true, data: { message: '已删除' } });
  } catch (err) {
    console.error('inquiry/delete error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '删除失败' } });
  }
}

export async function statistics(req, res) {
  try {
    const ids = await cmd(['LRANGE', 'inquiry:list', 0, -1]);
    if (!ids || ids.length === 0) {
      return res.status(200).json({
        success: true,
        data: { total: 0, new: 0, quoted: 0, pending_recovery: 0, accepted: 0, rejected: 0, processing: 0, completed: 0, totalValue: 0 },
      });
    }
    const jsons = await pipeline(ids.map(id => ['GET', `inquiry:${id}`]));
    const all = jsons.filter(Boolean).map(j => JSON.parse(j));
    const count = s => all.filter(i => i.status === s).length;
    return res.status(200).json({
      success: true,
      data: {
        total: all.length,
        new: count('new'),
        quoted: count('quoted'),
        pending_recovery: count('pending_recovery'),
        accepted: count('accepted'),
        rejected: count('rejected'),
        processing: count('processing'),
        completed: count('completed'),
        totalValue: all.reduce((sum, i) => sum + (i.estimatedTotal ?? 0), 0),
      },
    });
  } catch (err) {
    console.error('inquiry/statistics error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '统计失败' } });
  }
}

export async function logisticsSelect(req, res) {
  const { inquiryId, type, address, contactName, contactPhone, timeSlot, shippingAddress, notes } = req.body ?? {};
  if (!inquiryId || !type) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'inquiryId 和 type 必填' } });
  }
  try {
    const json = await cmd(['GET', `inquiry:${inquiryId}`]);
    if (!json) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '询价不存在' } });
    const inquiry = JSON.parse(json);
    inquiry.logistics = { type, address, contactName, contactPhone, timeSlot, shippingAddress, notes };
    inquiry.acceptedShippingMethod = type;
    inquiry.updatedAt = new Date().toISOString();
    await cmd(['SET', `inquiry:${inquiryId}`, JSON.stringify(inquiry)]);
    return res.status(200).json({ success: true, data: { logistics: inquiry.logistics } });
  } catch (err) {
    console.error('logistics/select error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: '保存失败' } });
  }
}
