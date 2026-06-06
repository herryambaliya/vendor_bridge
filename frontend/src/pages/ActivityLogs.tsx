import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import Sidebar from '../components/layout/Sidebar';
import {
  CheckCircle, Clock, FileText, Building, FileCheck,
  Send, Shield, Search, Activity, Lock,
} from 'lucide-react';

interface MockActivityLog {
  id: string;
  userId: string;
  userName: string;
  entityType: 'rfq' | 'quotation' | 'approval' | 'po' | 'invoice' | 'vendor';
  entityId: string;
  action: string;
  metadata?: any;
  createdAt: string;
}

type FilterTab = 'All' | 'RFQ' | 'Approvals' | 'Invoices' | 'Vendors';

const filterTabs: FilterTab[] = ['All', 'RFQ', 'Approvals', 'Invoices', 'Vendors'];

const entityMap: Record<FilterTab, string> = {
  All: '',
  RFQ: 'rfq',
  Approvals: 'approval',
  Invoices: 'invoice',
  Vendors: 'vendor',
};

const getLogMeta = (log: MockActivityLog) => {
  switch (log.entityType) {
    case 'rfq':
      return {
        icon: <FileText className="h-4 w-4 text-blue-600" />,
        iconBg: 'bg-blue-50 border-blue-200',
        text: `RFQ published – ${log.metadata?.title || 'Office furniture Q2'} sent to ${log.metadata?.vendorCount || 3} vendors`,
        timestamp: log.createdAt,
      };
    case 'quotation':
      return {
        icon: <CheckCircle className="h-4 w-4 text-emerald-600" />,
        iconBg: 'bg-emerald-50 border-emerald-200',
        text: `Quotation selected – ${log.metadata?.vendorName || 'Infra Supplies Pvt. Ltd'} selected for ${log.metadata?.rfqTitle || 'Office Furniture Q2'}`,
        timestamp: log.createdAt,
      };
    case 'approval':
      const isApproved = log.action === 'approved';
      return {
        icon: isApproved
          ? <CheckCircle className="h-4 w-4 text-emerald-600" />
          : <Clock className="h-4 w-4 text-amber-600" />,
        iconBg: isApproved ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200',
        text: `Approval ${isApproved ? 'granted' : 'pending'} – PO awaiting L2 approval by ${log.userName || 'Priya Shah'}`,
        timestamp: log.createdAt,
      };
    case 'po':
      return {
        icon: <FileCheck className="h-4 w-4 text-indigo-600" />,
        iconBg: 'bg-indigo-50 border-indigo-200',
        text: `Purchase Order ${log.metadata?.poNumber || log.entityId} auto-generated upon approval`,
        timestamp: log.createdAt,
      };
    case 'invoice':
      return {
        icon: <Send className="h-4 w-4 text-teal-600" />,
        iconBg: 'bg-teal-50 border-teal-200',
        text: `Invoice dispatched to supplier – ${log.entityId}`,
        timestamp: log.createdAt,
      };
    case 'vendor':
      return {
        icon: <Building className="h-4 w-4 text-violet-600" />,
        iconBg: 'bg-violet-50 border-violet-200',
        text: `Vendor added – ${log.metadata?.name || 'FastLog Transport'} registered and pending verification`,
        timestamp: log.createdAt,
      };
    default:
      return {
        icon: <Shield className="h-4 w-4 text-slate-500" />,
        iconBg: 'bg-slate-100 border-slate-200',
        text: `${log.userName} performed "${log.action}" on ${log.entityType}`,
        timestamp: log.createdAt,
      };
  }
};

const formatTimestamp = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const DEMO_LOGS: MockActivityLog[] = [
  {
    id: '1', userId: 'u1', userName: 'Procurement Officer',
    entityType: 'quotation', entityId: 'q1', action: 'selected',
    metadata: { vendorName: 'Infra Supplies Pvt Ltd', rfqTitle: 'Office Furniture Q2' },
    createdAt: '2025-05-23T21:15:00Z',
  },
  {
    id: '2', userId: 'u2', userName: 'Priya Shah',
    entityType: 'approval', entityId: 'a1', action: 'pending',
    metadata: { poNumber: 'PO-2024' },
    createdAt: '2025-05-22T09:15:00Z',
  },
  {
    id: '3', userId: 'u3', userName: 'Procurement Officer',
    entityType: 'rfq', entityId: 'r1', action: 'created',
    metadata: { title: 'Office Furniture Q2', vendorCount: 3 },
    createdAt: '2025-05-19T00:00:00Z',
  },
  {
    id: '4', userId: 'u4', userName: 'System Admin',
    entityType: 'vendor', entityId: 'v1', action: 'registered',
    metadata: { name: 'FastLog Transport' },
    createdAt: '2025-05-18T15:20:00Z',
  },
];

export const ActivityLogs: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [search, setSearch] = useState('');

  const { data: logs, isLoading } = useQuery<MockActivityLog[]>({
    queryKey: ['activity-logs-list'],
    queryFn: () => api.activityLogs.list(50),
  });

  const allLogs = logs && logs.length > 0 ? logs : DEMO_LOGS;
  const entityFilter = entityMap[activeTab];
  const filtered = allLogs.filter((log) => {
    const matchesType = !entityFilter || log.entityType === entityFilter;
    const matchesSearch =
      !search ||
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.metadata?.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.metadata?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleRowClick = (log: MockActivityLog) => {
    switch (log.entityType) {
      case 'rfq': navigate(`/rfqs/${log.entityId}`); break;
      case 'quotation': navigate(`/rfqs/${log.metadata?.rfqId || 'rfq-2'}/compare`); break;
      case 'approval': navigate('/approvals'); break;
      case 'po': navigate(`/purchase-orders`); break;
      case 'invoice': navigate(`/invoices`); break;
      case 'vendor': navigate('/vendors'); break;
    }
  };

  const typeColors: Record<string, string> = {
    rfq:       'text-blue-600 bg-blue-50 border-blue-200',
    quotation: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    approval:  'text-amber-600 bg-amber-50 border-amber-200',
    po:        'text-indigo-600 bg-indigo-50 border-indigo-200',
    invoice:   'text-teal-600 bg-teal-50 border-teal-200',
    vendor:    'text-violet-600 bg-violet-50 border-violet-200',
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />

        <div className="p-8">
          {/* Header */}
          <div className="mb-7 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-violet-500" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Audit Trail</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 font-display">Activity & Logs</h1>
            <p className="text-sm text-slate-500 mt-1">
              Procurement audit trail ·{' '}
              <span className="font-semibold text-slate-700">Immutable write-once records</span>
            </p>
          </div>

          {/* Search + Filter */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative flex-1 min-w-48 max-w-sm">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-3 focus:ring-violet-100 transition-all text-sm shadow-sm"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {filterTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    activeTab === tab
                      ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/20'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 bg-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <span className="ml-auto text-xs text-slate-400 font-medium">{filtered.length} entries</span>
          </div>

          {/* Log timeline */}
          {isLoading ? (
            <div className="liquid-card border border-slate-100 p-12 text-center">
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                <div className="h-4 w-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                Loading audit logs...
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="liquid-card border border-slate-100 p-16 text-center">
              <div className="h-14 w-14 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-7 w-7 text-violet-400" />
              </div>
              <p className="text-slate-700 font-semibold">No Activity Logs Found</p>
              <p className="text-slate-400 text-sm mt-2">No system operations match your current filter.</p>
            </div>
          ) : (
            <div className="liquid-card border border-slate-100 overflow-hidden animate-fade-in-up">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-700 font-display">System Activity</h2>
                <span className="text-xs text-slate-400">{filtered.length} records</span>
              </div>
              <div className="divide-y divide-slate-50">
                {filtered.map((log) => {
                  const meta = getLogMeta(log);
                  return (
                    <div
                      key={log.id}
                      onClick={() => handleRowClick(log)}
                      className="flex items-start gap-4 px-6 py-5 hover:bg-violet-50/30 transition-all duration-150 cursor-pointer group"
                    >
                      <div className={`mt-0.5 h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${meta.iconBg}`}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 font-medium leading-snug">{meta.text}</p>
                        <p className="text-xs text-slate-400 mt-1 font-mono">{formatTimestamp(meta.timestamp)}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${typeColors[log.entityType] || 'text-slate-500 bg-slate-100 border-slate-200'}`}>
                        {log.entityType}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Immutable note */}
          <div className="mt-5 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
            <Lock className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 font-medium">
              Audit logs are <strong>immutable</strong> — write-once, no edit or delete. DB schema enforces no soft-delete on log records.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ActivityLogs;
