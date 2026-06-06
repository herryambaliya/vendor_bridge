import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import Sidebar from '../components/layout/Sidebar';
import Skeleton from '../components/ui/Skeleton';
import {
  ClipboardCheck,
  FileBox,
  Receipt,
  CreditCard,
  RefreshCw,
  Plus,
  Building2,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  ShoppingBag,
  Zap,
  Eye,
} from 'lucide-react';
import { showToast } from '../components/ui/Toast';

interface SummaryStats {
  pendingApprovals: number;
  activeRFQs: number;
  posThisMonth: number;
  totalSpend: number;
}

const statusColor: Record<string, string> = {
  Approved: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  Pending: 'text-amber-600 bg-amber-50 border-amber-200',
  Draft: 'text-slate-500 bg-slate-100 border-slate-200',
  issued: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  acknowledged: 'text-blue-600 bg-blue-50 border-blue-200',
  delivered: 'text-teal-600 bg-teal-50 border-teal-200',
  cancelled: 'text-rose-600 bg-rose-50 border-rose-200',
};

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: summary, isLoading, refetch, isRefetching } = useQuery<SummaryStats>({
    queryKey: ['dashboard-summary'],
    queryFn: () => api.reports.dashboardSummary(),
  });

  const { data: pos } = useQuery<any[]>({
    queryKey: ['dashboard-recent-pos'],
    queryFn: () => api.purchaseOrders.list(),
  });

  const handleRefresh = async () => {
    await refetch();
    showToast.success('Dashboard metrics refreshed');
  };

  const formatCurrency = (num: number) => {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const displayPOs =
    pos && pos.length > 0
      ? pos.slice(0, 5).map((po) => ({
          id: po.id,
          poNumber: po.poNumber,
          vendor: po.vendorName,
          amount: po.totalAmount,
          status: po.status,
        }))
      : [
          { id: 'po-1', poNumber: 'PO-2026-00101', vendor: 'ByteCraft Solutions', amount: 1003000, status: 'issued' },
          { id: 'po-2', poNumber: 'PO-2026-00099', vendor: 'Infra Supplies Pvt.', amount: 87000, status: 'acknowledged' },
          { id: 'po-3', poNumber: 'PO-2026-00088', vendor: 'Tech Core Ltd.', amount: 140000, status: 'delivered' },
          { id: 'po-4', poNumber: 'PO-2026-00072', vendor: 'CloudBase Systems', amount: 225000, status: 'cancelled' },
        ];

  const statCards = [
    {
      label: 'Active RFQs',
      value: summary?.activeRFQs ?? 12,
      icon: FileBox,
      colorClass: 'stat-card-blue',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      trend: '+3 this week',
      up: true,
      action: () => navigate(user?.role === 'vendor' ? '/my-rfqs' : '/rfqs'),
    },
    {
      label: 'Pending Approvals',
      value: summary?.pendingApprovals ?? 5,
      icon: ClipboardCheck,
      colorClass: 'stat-card-amber',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      trend: '+1 today',
      up: true,
      action: () => navigate('/approvals'),
    },
    {
      label: 'Total Spend',
      value: formatCurrency(summary?.totalSpend ?? 2300000),
      icon: CreditCard,
      colorClass: 'stat-card-emerald',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      trend: '₹2.3L this month',
      up: true,
      action: () => navigate('/reports'),
    },
    {
      label: 'Overdue Invoices',
      value: summary?.posThisMonth ?? 3,
      icon: Receipt,
      colorClass: 'stat-card-rose',
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-100',
      trend: '-2 from last month',
      up: false,
      action: () => navigate('/invoices'),
    },
  ];

  const quickActions = [
    { label: 'New RFQ', icon: Plus, action: () => navigate('/rfqs/new'), style: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20' },
    { label: 'Add Vendor', icon: Building2, action: () => navigate('/vendors'), style: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm' },
    { label: 'Purchase Orders', icon: ShoppingBag, action: () => navigate('/purchase-orders'), style: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm' },
    { label: 'View Invoices', icon: FileText, action: () => navigate('/invoices'), style: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm' },
  ];

  const spendBars = [65, 80, 45, 90, 60, 75];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Top gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

        <div className="p-8 max-w-[1400px]">
          {/* Page Header */}
          <div className="flex items-start justify-between mb-8 animate-fade-in-up">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Dashboard</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">
                Good morning, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{user?.name ?? 'User'}</span> 👋
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Here's what's happening across your procurement operations today.
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading || isRefetching}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-700 text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 mb-8 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            {quickActions.map((btn, i) => {
              const Icon = btn.icon;
              return (
                <button
                  key={i}
                  onClick={btn.action}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${btn.style}`}
                >
                  <Icon className="h-4 w-4" />
                  {btn.label}
                </button>
              );
            })}
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  onClick={card.action}
                  className={`liquid-card p-6 cursor-pointer border ${card.colorClass} animate-fade-in-up`}
                  style={{ animationDelay: `${0.1 + i * 0.05}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                      <Icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                    <div className={`flex items-center gap-1 text-[11px] font-bold ${card.up ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {card.up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                      {card.trend}
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 font-display mb-1">
                    {isLoading ? <Skeleton className="h-9 w-20" /> : card.value}
                  </div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</p>
                </div>
              );
            })}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Purchase Orders */}
            <div className="lg:col-span-2 liquid-card border border-slate-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 font-display">Recent Purchase Orders</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Last 5 transactions</p>
                </div>
                <button
                  onClick={() => navigate('/purchase-orders')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg"
                >
                  <Eye className="h-3 w-3" />
                  View All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      {['PO Number', 'Vendor', 'Amount', 'Status', ''].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {displayPOs.map((po, i) => (
                      <tr
                        key={po.id}
                        onClick={() => navigate('/purchase-orders')}
                        className="hover:bg-blue-50/30 transition-all duration-150 cursor-pointer group"
                      >
                        <td className="px-6 py-4 text-sm font-mono font-bold text-slate-800">{po.poNumber}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">{po.vendor}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                          ₹{po.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${statusColor[po.status] || statusColor.Pending}`}>
                            {po.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Spending Trends */}
            <div className="liquid-card border border-slate-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-800 font-display">Spending Trends</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Last 6 months</p>
                </div>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="p-6">
                {/* Bar Chart */}
                <div className="flex items-end gap-2 h-32 mb-4">
                  {spendBars.map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div
                        className="w-full rounded-t-lg transition-all duration-300 hover:opacity-100 opacity-80 cursor-pointer relative overflow-hidden"
                        style={{
                          height: `${h}%`,
                          background: `linear-gradient(to top, #2563eb, #6366f1)`,
                        }}
                        title={`${months[i]}: ₹${(h * 23000).toLocaleString('en-IN')}`}
                      >
                        <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-[9px] text-slate-400 font-semibold">{months[i]}</span>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                      <span className="text-[10px] text-slate-500 font-medium">Monthly PO Spend</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">₹23.5L</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-slate-500 font-medium">Invoiced Amount</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">₹18.2L</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <span className="text-[10px] text-slate-500 font-medium">Savings YTD</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600">+₹4.1L</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer spacer */}
          <div className="h-8" />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
