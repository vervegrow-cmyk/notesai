// 询价数据管理服务（生产环境建议使用数据库）
const inquiries = new Map();

// 获取所有询价
export function getAllInquiries() {
  return Array.from(inquiries.values()).sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
}

// 按ID获取询价
export function getInquiryById(id) {
  return inquiries.get(id) || null;
}

// 按状态筛选询价
export function getInquiriesByStatus(status) {
  return Array.from(inquiries.values())
    .filter(q => q.status === status)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// 创建或保存询价
export function saveInquiry(inquiry) {
  if (!inquiry.id) {
    inquiry.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  inquiry.createdAt = inquiry.createdAt || new Date().toISOString();
  inquiry.status = inquiry.status || 'new';
  
  inquiries.set(inquiry.id, inquiry);
  return inquiry;
}

// 更新询价状态
export function updateInquiryStatus(id, status) {
  const inquiry = inquiries.get(id);
  if (!inquiry) {
    return null;
  }
  
  inquiry.status = status;
  inquiry.updatedAt = new Date().toISOString();
  
  return inquiry;
}

// 更新询价
export function updateInquiry(id, changes) {
  const inquiry = inquiries.get(id);
  if (!inquiry) {
    return null;
  }
  
  const updated = { ...inquiry, ...changes, updatedAt: new Date().toISOString() };
  inquiries.set(id, updated);
  
  return updated;
}

// 删除询价
export function deleteInquiry(id) {
  return inquiries.delete(id);
}

// 获取统计数据
export function getStatistics() {
  const all = Array.from(inquiries.values());
  return {
    total: all.length,
    new: all.filter(q => q.status === 'new').length,
    contacted: all.filter(q => q.status === 'contacted').length,
    dealed: all.filter(q => q.status === 'dealed').length,
    totalValue: all.reduce((sum, q) => sum + (q.estimatedTotal || 0), 0)
  };
}

// 导入初始数据（用于测试）
export function importInquiries(data) {
  data.forEach(inquiry => saveInquiry(inquiry));
}
