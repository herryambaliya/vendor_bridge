import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import Sidebar from '../components/layout/Sidebar';
import { showToast } from '../components/ui/Toast';
import {
  CheckCircle, Clock, ChevronRight, Star, Package,
  CheckSquare, XCircle, ArrowLeft
} from 'lucide-react';

interface Approval {
  id: string;
  quotationId: string;
  requestedBy: string;
  approverId?: string;
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string;
  createdAt: string;
  vendorName: string;
  rfqTitle: string;
  totalAmount: number;
  requestedByName: string;
  rfqId?: string;
  vendorId?: string;
}

const approvalChain = [
  { name: 'Rahul Mehta', role: 'Procurement Head', status: 'approved', time: 'Approved · May 20, 10:32 AM' },
  { name: 'Priya Shah', role: 'Finance Manager', status: 'pending', time: 'Awaiting · Assigned May 21' },
];

const steps = [
  { label: 'Submitted', num: 1 },
  { label: 'L1 Review', num: 2 },
  { label: 'L2 Approval', num: 3 },
  { label: 'Generate PO', num: 4 },
];

// ─── Approval Detail Panel ────────────────────────────────────────────────────
const ApprovalDetailPanel: React.FC<{
  approval: Approval;
  onBack: () => void;
  onSuccess: () => void;
  approverId: string;
}> = ({ approval, onBack, onSuccess, approverId }) => {
  const navigate = useNavigate();
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentStep = 3;

  const handleAction = async (action: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    try {
      if (action === 'approved') {
        await api.approvals.approve(approval.id, approverId, remarks);
      } else {
        await api.approvals.reject(approval.id, approverId, remarks);
      }
      showToast.success(
        action === 'approved'
          ? 'Approval granted! PO will be auto-generated ✅'
          : 'Quotation rejected.'
      );
      onSuccess();
      onBack();
    } catch {
      showToast.error('Failed to process approval decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
      <div className="p-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors mb-6 font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Approval Queue
        </button>

        <h1 className="text-2xl font-extrabold text-slate-900 font-display mb-1">Approval Workflow</h1>
        <p className="text-sm text-slate-500 mb-7">
          RFQ:{' '}
          {approval.rfqId ? (
            <span
              onClick={() => navigate(`/rfqs/${approval.rfqId}`)}
              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer underline transition-colors"
            >
              {approval.rfqTitle}
            </span>
          ) : (
            <span className="font-semibold text-slate-700">{approval.rfqTitle}</span>
          )}{' '}
          · Vendor: <span className="font-semibold text-slate-700">{approval.vendorName}</span>
          · <span className="font-bold text-rose-600">₹{approval.totalAmount.toLocaleString('en-IN')}</span>
        </p>

        {/* Step Progress */}
        <div className="liquid-card border border-slate-100 p-5 mb-7">
          <div className="flex items-center gap-0">
            {steps.map((step, i) => (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                      step.num < currentStep
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-600'
                        : step.num === currentStep
                        ? 'bg-amber-50 border-amber-400 text-amber-600 shadow-md shadow-amber-200'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    {step.num < currentStep ? <CheckCircle className="h-4 w-4" /> : step.num}
                  </div>
                  <span
                    className={`text-[10px] font-bold whitespace-nowrap ${
                      step.num === currentStep
                        ? 'text-amber-600'
                        : step.num < currentStep
                        ? 'text-emerald-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 mb-5 rounded-full ${
                      step.num < currentStep ? 'bg-emerald-300' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Chain + Remarks + Actions */}
          <div className="space-y-5">
            {/* Approval Chain */}
            <div className="liquid-card border border-slate-100 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Approval Chain</p>
              </div>
              <div className="p-5 space-y-4">
                {approvalChain.map((approver, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 border-2 ${
                        approver.status === 'approved'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                          : 'bg-amber-50 border-amber-300 text-amber-600'
                      }`}
                    >
                      {approver.status === 'approved' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{approver.name}</p>
                      <p className="text-xs text-slate-400 font-medium">{approver.role}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{approver.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Remarks */}
            <div className="liquid-card border border-slate-100 p-5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                Approval Remarks
              </label>
              <textarea
                rows={4}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add your comments or conditions..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-3 focus:ring-blue-100 transition-all text-sm resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => handleAction('approved')}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                <CheckCircle className="h-4 w-4" />
                Approve & Generate PO
              </button>
              <button
                onClick={() => handleAction('rejected')}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-600 hover:text-rose-600 text-sm font-bold rounded-xl transition-all"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </div>
          </div>

          {/* Right: Quotation Summary */}
          <div className="liquid-card border border-slate-100 overflow-hidden h-fit">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Quotation Summary</p>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: 'Vendor', value: approval.vendorName || 'Infra Supplies PVT LTD' },
                { label: 'Total Amount', value: `₹${approval.totalAmount.toLocaleString('en-IN')}`, highlight: true },
                { label: 'Delivery', value: '10 days' },
                { label: 'Rating', value: '4.5 / 5.0' },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-400 font-medium">{row.label}</span>
                  <span className={`text-sm font-bold ${row.highlight ? 'text-rose-600' : 'text-slate-800'}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Rating bar */}
            <div className="px-5 pb-5">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-amber-700">Vendor Performance</span>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="flex-1 h-2 rounded-full bg-amber-400" />
                  ))}
                  <div className="flex-1 h-2 rounded-full bg-amber-200" />
                </div>
                <p className="text-[10px] text-amber-600 font-medium mt-2">4.5 / 5.0 average rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

// ─── Main Approvals List ───────────────────────────────────────────────────────
const statusStyle: Record<string, string> = {
  pending:  'text-amber-700 bg-amber-50 border-amber-200',
  approved: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  rejected: 'text-rose-700 bg-rose-50 border-rose-200',
};

export const Approvals: React.FC = () => {
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);

  const { data: approvals, isLoading, refetch } = useQuery<Approval[]>({
    queryKey: ['approvals'],
    queryFn: () => api.approvals.list(),
  });

  const filtered = approvals
    ? approvals.filter((a) => !statusFilter || a.status === statusFilter)
    : [];

  if (selectedApproval) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <ApprovalDetailPanel
          approval={selectedApproval}
          onBack={() => setSelectedApproval(null)}
          onSuccess={refetch}
          approverId={user?.id || 'usr-manager'}
        />
      </div>
    );
  }

  const tabs = [
    { key: '', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />

        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-7 animate-fade-in-up">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckSquare className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Workflow Queue</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 font-display">Approval Workflow</h1>
              <p className="text-sm text-slate-500 mt-1">Review, approve, or reject vendor quotation budget releases.</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-5 items-center">
            {tabs.map((tab) => {
              const count = tab.key === ''
                ? (approvals?.length ?? 0)
                : (approvals?.filter((a) => a.status === tab.key).length ?? 0);
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                    statusFilter === tab.key
                      ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 bg-white'
                  }`}
                >
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${statusFilter === tab.key ? 'bg-white/25' : 'bg-slate-100'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Approvals list */}
          {isLoading ? (
            <div className="liquid-card border border-slate-100 p-12 text-center animate-fade-in-up">
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                <div className="h-4 w-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                Loading approval queue...
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="liquid-card border border-slate-100 p-16 text-center animate-fade-in-up">
              <div className="h-14 w-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="h-7 w-7 text-amber-400" />
              </div>
              <p className="text-slate-700 font-semibold text-base">No Approvals in Queue</p>
              <p className="text-slate-400 text-sm mt-2">Workflow queue is empty for this status filter.</p>
            </div>
          ) : (
            <div className="liquid-card border border-slate-100 overflow-hidden animate-fade-in-up">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-700 font-display">Approval Queue</h2>
                <span className="text-xs text-slate-400 font-medium">{filtered.length} workflows</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['RFQ / Vendor', 'Amount', 'Requested By', 'Status', 'Date', ''].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() => setSelectedApproval(app)}
                      className="hover:bg-amber-50/30 transition-all duration-150 cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-slate-800">{app.rfqTitle}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{app.vendorName}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-sm text-rose-600">
                        ₹{app.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-medium">{app.requestedByName}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border capitalize ${statusStyle[app.status]}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                        {new Date(app.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Approvals;
