import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import Sidebar from '../components/layout/Sidebar';
import { showToast } from '../components/ui/Toast';
import {
  TrendingUp, Sparkles, IndianRupee, Users,
  CheckCircle, AlertTriangle, Calendar, Download, BarChart3,
} from 'lucide-react';

const spendByCategory = [
  { name: 'IT Hardware',  amount: 480000, color: '#2563eb', pct: 100 },
  { name: 'Furniture',    amount: 320000, color: '#10b981', pct: 67 },
  { name: 'Stationery',   amount: 210000, color: '#f59e0b', pct: 44 },
  { name: 'Logistics',    amount: 230000, color: '#ef4444', pct: 48 },
];

const topVendors = [
  { name: 'TechCore Ltd',    spend: 420000, pos: 6 },
  { name: 'Infra Supplies',  spend: 310000, pos: 4 },
  { name: 'FastLog',         spend: 190000, pos: 3 },
];

const monthlyTrend = [
  { month: 'Dec', value: 35 },
  { month: 'Jan', value: 50 },
  { month: 'Feb', value: 45 },
  { month: 'Mar', value: 60 },
  { month: 'Apr', value: 70 },
  { month: 'May', value: 95 },
];

const formatLakh = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
};

interface ForecastPoint { month: string; predictedAmount: number; confidence: 'High' | 'Medium' | 'Low'; }
interface ForecastResult { forecast?: ForecastPoint[]; trend?: string; error?: string; fallback?: string; }

export const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState('May 2026');
  const [isForecasting, setIsForecasting] = useState(false);
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);

  const { data: monthlySpend } = useQuery<any[]>({
    queryKey: ['report-monthly-spend-data'],
    queryFn: () => api.reports.monthlySpend(),
  });

  const handleRunForecast = async () => {
    if (!monthlySpend || monthlySpend.length < 3) {
      showToast.warning('Need at least 3 months of data for AI modeling.');
      return;
    }
    setIsForecasting(true);
    try {
      const res = await api.ai.spendForecast(monthlySpend);
      setForecastResult(res);
      showToast.success('AI spend projection completed!');
    } catch {
      showToast.error('Failed to run AI Spend Forecaster');
    } finally {
      setIsForecasting(false);
    }
  };

  const statCards = [
    { value: '12.4 L', label: 'Total Spend',      icon: IndianRupee,    colorClass: 'stat-card-emerald', iconColor: 'text-emerald-600', iconBg: 'bg-emerald-100' },
    { value: '28',     label: 'Active Vendors',    icon: Users,          colorClass: 'stat-card-blue',    iconColor: 'text-blue-600',    iconBg: 'bg-blue-100'    },
    { value: '94%',    label: 'PO Fulfillment',    icon: CheckCircle,    colorClass: 'stat-card-amber',   iconColor: 'text-amber-600',   iconBg: 'bg-amber-100'   },
    { value: '3',      label: 'Overdue Invoices',  icon: AlertTriangle,  colorClass: 'stat-card-rose',    iconColor: 'text-rose-600',    iconBg: 'bg-rose-100'    },
  ];

  const maxBarHeight = Math.max(...monthlyTrend.map((m) => m.value));

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="h-1 w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500" />

        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-7 animate-fade-in-up">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-teal-500" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Analytics</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 font-display">Reports & Analytics</h1>
              <p className="text-sm text-slate-500 mt-1">
                Procurement Insights · <span className="font-semibold text-slate-700">{selectedMonth}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 font-medium focus:outline-none focus:border-teal-400 appearance-none cursor-pointer shadow-sm"
                >
                  {['May 2026', 'Apr 2026', 'Mar 2026', 'Feb 2026', 'Jan 2026', 'Dec 2025'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-700 bg-white transition-all shadow-sm">
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
            {statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className={`liquid-card border ${card.colorClass} p-5 text-center hover:scale-[1.02] transition-transform duration-200 animate-fade-in-up`}
                  style={{ animationDelay: `${0.05 * i}s` }}
                >
                  <div className={`h-10 w-10 ${card.iconBg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900 font-display">{card.value}</p>
                  <p className="text-xs text-slate-500 font-medium mt-1">{card.label}</p>
                </div>
              );
            })}
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Spend by Category */}
            <div className="liquid-card border border-slate-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Spend by Category</p>
              </div>
              <div className="p-6 space-y-5">
                {spendByCategory.map((cat, i) => (
                  <div
                    key={i}
                    onClick={() => navigate(`/vendors?search=${encodeURIComponent(cat.name.split(' ')[0])}`)}
                    className="cursor-pointer hover:bg-slate-50 p-2.5 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">{cat.name}</span>
                      <span className="text-sm font-bold text-slate-800">{formatLakh(cat.amount)}</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${cat.pct}%`, background: `linear-gradient(90deg, ${cat.color}99, ${cat.color})` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Top Vendors + Monthly Trend */}
            <div className="space-y-6">
              {/* Top Vendors */}
              <div className="liquid-card border border-slate-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Top Vendors by Spend</p>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Vendor', 'Spend (₹)', 'POs'].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {topVendors.map((v, i) => (
                      <tr
                        key={i}
                        onClick={() => navigate(`/vendors?search=${encodeURIComponent(v.name.split(' ')[0])}`)}
                        className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-3.5 text-sm font-semibold text-slate-700">{v.name}</td>
                        <td className="px-6 py-3.5 text-sm font-bold text-emerald-600">{v.spend.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-3.5 text-sm text-slate-400 font-medium">{v.pos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Monthly Trend Chart */}
              <div className="liquid-card border border-slate-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Monthly Trend</p>
                </div>
                <div className="p-6">
                  <div className="flex items-end gap-3 h-32">
                    {monthlyTrend.map((m, i) => {
                      const heightPct = (m.value / maxBarHeight) * 100;
                      const isLast = i === monthlyTrend.length - 1;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                          <div className="w-full relative" style={{ height: '100%' }}>
                            <div className="absolute bottom-0 w-full flex justify-center">
                              <div
                                className={`w-full rounded-t-lg transition-all duration-500 cursor-pointer ${
                                  isLast ? 'opacity-100 shadow-md shadow-blue-500/20' : 'opacity-60 hover:opacity-80'
                                }`}
                                style={{
                                  height: `${heightPct}%`,
                                  minHeight: '8px',
                                  background: isLast
                                    ? 'linear-gradient(to top, #2563eb, #6366f1)'
                                    : 'linear-gradient(to top, #93c5fd, #a5b4fc)',
                                }}
                                title={`${m.month}: ${m.value}%`}
                              />
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400">{m.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Forecaster */}
          <div className="liquid-card border border-blue-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-6 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 rounded-xl border border-amber-200">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 font-display">AI Spend Trend Forecaster</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Generate linear trend projections for the next 3 quarters.</p>
                </div>
              </div>
              {!forecastResult && (
                <button
                  onClick={handleRunForecast}
                  disabled={isForecasting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <TrendingUp className="h-4 w-4" />
                  {isForecasting ? 'Analyzing...' : 'Run AI Forecast'}
                </button>
              )}
            </div>

            {isForecasting && (
              <div className="flex items-center justify-center py-8 gap-3 text-slate-500">
                <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <span className="text-sm font-medium">Calculating projections...</span>
              </div>
            )}

            {forecastResult && !forecastResult.error && forecastResult.forecast && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                {forecastResult.forecast.map((pt, idx) => (
                  <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{pt.month}</p>
                    <p className="text-lg font-bold text-blue-600">₹{pt.predictedAmount.toLocaleString('en-IN')}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 inline-block border ${
                      pt.confidence === 'High'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : pt.confidence === 'Medium'
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}>
                      {pt.confidence} Confidence
                    </span>
                  </div>
                ))}
                <div className="sm:col-span-3 text-right">
                  <button
                    onClick={() => setForecastResult(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
                  >
                    Reset Projections
                  </button>
                </div>
              </div>
            )}

            {forecastResult?.error && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                {forecastResult.fallback || 'Forecast model encountered an error.'}
              </div>
            )}
          </div>

          <div className="h-8" />
        </div>
      </main>
    </div>
  );
};

export default Reports;
