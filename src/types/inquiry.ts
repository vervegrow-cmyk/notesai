// ── User types ────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'seller' | 'broker' | 'recycler' | 'admin';
export type UserType = 'personal' | 'seller' | 'broker';

// ── Inquiry ───────────────────────────────────────────────────────────────

export type InquiryStatus =
  | 'draft'
  | 'pending'
  | 'priced'
  | 'accepted'
  | 'rejected'
  | 'saved'
  | 'processing'
  | 'completed';

export interface Inquiry {
  id: string;
  userId?: string;
  userName: string;
  contact: string;
  userType: UserType;
  status: InquiryStatus;
  estimatedTotal: number;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

// ── Product ───────────────────────────────────────────────────────────────

export type RiskLevel       = 'low' | 'medium' | 'high';
export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface InquiryProduct {
  id: string;
  inquiryId: string;
  name: string;
  category: string;
  brand: string;
  description?: string;
  thumbnail?: string;
  tableData?: Record<string, string>;

  // Pricing fields (set after AI analysis)
  estimatedPrice?: string;     // display string, e.g. "¥800-1200"
  priceMin?: number;
  priceMax?: number;
  confidence?: ConfidenceLevel;
  riskLevel?: RiskLevel;
  riskNote?: string;
  recycleAdvice?: string;

  createdAt: string;
}

export interface InquiryProductInput {
  name: string;
  category: string;
  brand: string;
  description?: string;
  thumbnail?: string;
  tableData?: Record<string, string>;
  estimatedPrice?: string;
}

// ── Decision ──────────────────────────────────────────────────────────────

export type DecisionAction = 'accept' | 'reject' | 'save' | 'accumulate';

export interface Decision {
  id: string;
  inquiryId: string;
  action: DecisionAction;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

// ── Logistics ─────────────────────────────────────────────────────────────

export type LogisticsType   = 'pickup' | 'shipping' | 'fba';
export type LogisticsStatus = 'pending' | 'scheduled' | 'in_transit' | 'completed';

export interface Logistics {
  id: string;
  inquiryId: string;
  type: LogisticsType;
  address?: string;
  contactName?: string;
  contactPhone?: string;
  timeSlot?: string;
  shippingAddress?: string;
  warehouseCode?: string;
  fbaShipmentId?: string;
  trackingNumber?: string;
  status: LogisticsStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ── Compound detail response ──────────────────────────────────────────────

export interface InquiryDetail {
  inquiry: Inquiry;
  products: InquiryProduct[];
  decision: Decision | null;
  logistics: Logistics | null;
}

// ── Statistics ────────────────────────────────────────────────────────────

export interface InquiryStatistics {
  total: number;
  draft: number;
  pending: number;
  priced: number;
  accepted: number;
  rejected: number;
  saved: number;
  processing: number;
  completed: number;
  totalValue: number;
}

// ── UI helpers ────────────────────────────────────────────────────────────

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  draft:      '草稿',
  pending:    '待估价',
  priced:     '已出价',
  accepted:   '已接受',
  rejected:   '已拒绝',
  saved:      '已暂存',
  processing: '处理中',
  completed:  '已完成',
};

export const INQUIRY_STATUS_COLORS: Record<InquiryStatus, string> = {
  draft:      'bg-slate-100 text-slate-600',
  pending:    'bg-amber-100 text-amber-700',
  priced:     'bg-blue-100 text-blue-700',
  accepted:   'bg-emerald-100 text-emerald-700',
  rejected:   'bg-red-100 text-red-700',
  saved:      'bg-violet-100 text-violet-700',
  processing: 'bg-indigo-100 text-indigo-700',
  completed:  'bg-green-100 text-green-700',
};

export const USER_TYPE_LABELS: Record<UserType, string> = {
  personal: '个人',
  seller:   '商家',
  broker:   '中介/服务商',
};

export const LOGISTICS_TYPE_LABELS: Record<LogisticsType, string> = {
  pickup:   '上门自提',
  shipping: '邮寄到仓',
  fba:      'FBA倒仓',
};

export const DECISION_ACTION_LABELS: Record<DecisionAction, string> = {
  accept:     '接受估价',
  reject:     '拒绝估价',
  save:       '暂存',
  accumulate: '累加询价',
};
