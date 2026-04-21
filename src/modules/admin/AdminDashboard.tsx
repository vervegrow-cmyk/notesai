import { useState, useEffect } from 'react';
import type { Inquiry, InquiryStatus } from '../../types/inquiry';
import { INQUIRY_STATUS_LABELS, INQUIRY_STATUS_COLORS } from '../../types/inquiry';
import { getInquiries, getStatistics, updateInquiryStatus } from '../../services/inquiryApi';
import { useAuthStore } from '../../stores/authStore';
import { InquiryDetailPage } from './InquiryDetailPage';

interface Statistics {
  total: number;
  new: number;
  contacted: number;
  dealed: number;
  totalValue: number;
}

export function AdminDashboard() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    new: 0,
    contacted: 0,
    dealed: 0,
    totalValue: 0
  });
  const [filterStatus, setFilterStatus] = useState<InquiryStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuthStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inquiryRes, statsRes] = await Promise.all([
        getInquiries(),
        getStatistics()
      ]);

      if (inquiryRes.success) {
        setInquiries(inquiryRes.data.inquiries || []);
      }

      if (statsRes.success) {
        setStatistics(statsRes.data);
      }
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: InquiryStatus) => {
    try {
      const res = await updateInquiryStatus(id, status);
      if (res.success) {
        setInquiries(inquiries.map(q => q.id === id ? { ...q, status } : q));
      }
    } catch (err) {
      console.error('更新状态失败:', err);
    }
  };

  const selected = selectedId ? inquiries.find(q => q.id === selectedId) : null;

  if (selected) {
    return (
      <InquiryDetailPage
        inquiry={selected}
        onBack={() => setSelectedId(null)}
        onStatusChange={handleStatusChange}
      />
    );
  }

  const filtered = filterStatus === 'all'
    ? inquiries
    : inquiries.filter(q => q.status === filterStatus);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">询价管理面板</h1>
            <p className="text-sm text-slate-600 mt-1">管理和追踪所有AI估价的清仓询价</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{user?.username}</p>
              <p className="text-xs text-slate-500">{user?.role}</p>
            </div>
            <button
              onClick={() => logout()}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 text-sm font-semibold rounded-lg transition-colors"
            >
              登出
            </button>
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="总询价数"
            value={statistics.total}
            icon="📊"
            color="bg-blue-50"
          />
          <StatCard
            title="新询价"
            value={statistics.new}
            icon="📬"
            color="bg-amber-50"
          />
          <StatCard
            title="已联系"
            value={statistics.contacted}
            icon="📞"
            color="bg-indigo-50"
          />
          <StatCard
            title="总估值"
            value={`¥${(statistics.totalValue / 10000).toFixed(1)}万`}
            icon="💰"
            color="bg-emerald-50"
          />
        </div>

        {/* 筛选和搜索 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-700">状态筛选:</span>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              全部 ({statistics.total})
            </button>
            {(['new', 'contacted', 'dealed'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-slate-900 text-white'
                    : `${INQUIRY_STATUS_COLORS[status]} hover:opacity-80`
                }`}
              >
                {INQUIRY_STATUS_LABELS[status]} ({statistics[status]})
              </button>
            ))}
          </div>
        </div>

        {/* 询价列表 */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">加载中...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl mx-auto mb-4">
              📭
            </div>
            <p className="text-lg font-bold text-slate-800">暂无询价记录</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">用户</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">联系方式</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">商品数</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">估值</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">状态</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">时间</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.map(inquiry => (
                    <tr key={inquiry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{inquiry.userName}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {inquiry.contact}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                          {inquiry.products.length}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        ¥{inquiry.estimatedTotal?.toLocaleString('zh-CN') ?? 0}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${INQUIRY_STATUS_COLORS[inquiry.status]}`}>
                          {INQUIRY_STATUS_LABELS[inquiry.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(inquiry.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedId(inquiry.id)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
                        >
                          查看 →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className={`${color} rounded-xl border border-slate-200 p-6`}>
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-sm text-slate-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
