import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import Sidebar from '../components/layout/Sidebar';
import { showToast } from '../components/ui/Toast';
import { useAuthStore } from '../store/auth';
import { Star, ChevronLeft, CheckCircle, Trophy, Zap } from 'lucide-react';

interface Quotation {
  id: string;
  rfqId: string;
  vendorId: string;
  unitPrice: number;
  totalPrice: number;
  deliveryDays: number;
  notes: string;
  status: 'submitted' | 'shortlisted' | 'rejected' | 'accepted';
  submittedAt: string;
  badge?: string;
  totalScore?: number;
}

interface RFQDetailData {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'open' | 'closed' | 'cancelled';
  deadline: string;
  createdBy: string;
  createdAt: string;
  items: any[];
  assignedVendors: string[];
  quotations: Quotation[];
}

interface Vendor {
  id: string;
  name: string;
  category: string;
  rating: number;
}

// Hardcoded demo comparison data matching wireframe
const DEMO_VENDORS = [
  {
    name: 'Infra Supplies',
    isLowest: true,
    grandTotal: 185000,
    gstPct: 18,
    deliveryDays: 10,
    rating: 4.5,
    paymentTerms: '30 days',
  },
  {
    name: 'TechCore LTD',
    isLowest: false,
    grandTotal: 200010,
    gstPct: 18,
    deliveryDays: 14,
    rating: 4.2,
    paymentTerms: '30 days',
  },
  {
    name: 'Office Need Co.',
    isLowest: false,
    grandTotal: 219800,
    gstPct: 18,
    deliveryDays: 7,
    rating: 3.9,
    paymentTerms: '15 days',
  },
];

export const QuotationComparison: React.FC = () => {
  const { id: rfqId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: rfq, isLoading, refetch } = useQuery<RFQDetailData>({
    queryKey: ['rfq-compare', rfqId],
    queryFn: () => api.rfqs.get(rfqId || '')
  });

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ['vendors-all-compare'],
    queryFn: () => api.vendors.list()
  });

  const quotes = rfq?.quotations || [];
  const minPrice = quotes.length ? Math.min(...quotes.map(q => q.totalPrice)) : 0;

  // Use real quotes if available, otherwise demo data
  const displayVendors = quotes.length
    ? quotes.map((q, i) => {
      const v = vendors?.find(vd => vd.id === q.vendorId);
      return {
        name: v?.name || `Vendor ${i + 1}`,
        isLowest: q.totalPrice === minPrice,
        grandTotal: q.totalPrice,
        gstPct: 18,
        deliveryDays: q.deliveryDays,
        rating: v?.rating ?? 4.0,
        paymentTerms: q.notes || '30 days',
        quoteId: q.id,
        status: q.status,
      };
    })
    : DEMO_VENDORS.map((d, i) => ({ ...d, quoteId: `demo-${i}`, status: 'submitted' as const }));

  const criteria = [
    { label: 'Grand Total', key: 'grandTotal', format: (v: any) => (v as number).toLocaleString('en-IN') },
    { label: 'GST %', key: 'gstPct', format: (v: any) => String(v) },
    { label: 'Delivery (days)', key: 'deliveryDays', format: (v: any) => String(v) },
    { label: 'Vendor rating', key: 'rating', format: (v: any) => `${v}/5` },
    { label: 'Payment terms', key: 'paymentTerms', format: (v: any) => v },
  ];

  const handleSelectApprove = async (idx: number, quoteId: string) => {
    if (quoteId.startsWith('demo')) {
      setSelectedIdx(idx);
      showToast.success('Vendor selected! Approval workflow initiated.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.quotations.updateStatus(quoteId, 'shortlisted');
      await api.approvals.request(quoteId, user?.id || 'usr-officer');
      setSelectedIdx(idx);
      showToast.success('Vendor selected! Approval request sent to manager. ✅');
      refetch();
    } catch {
      showToast.error('Failed to initiate approval');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-7">
          <button
            onClick={() => navigate(`/rfqs/${rfqId}`)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors mb-4"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to RFQ Details
          </button>
          <h1 className="text-2xl font-bold text-slate-800 font-display">Quotation Comparison</h1>
          <p className="text-sm text-slate-500 mt-1">
            RFQ: {rfq?.title || 'office furniture procurement Q2'} – {displayVendors.length} quotations received
          </p>
        </div>

        {/* Summary stat pills */}
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { icon: <Trophy className="h-4 w-4 text-emerald-600" />, label: 'Lowest Price', value: `₹${Math.min(...displayVendors.map(d => d.grandTotal)).toLocaleString('en-IN')}`, color: 'emerald' },
            { icon: <Zap className="h-4 w-4 text-sky-600" />, label: 'Fastest Delivery', value: `${Math.min(...displayVendors.map(d => d.deliveryDays))} days`, color: 'sky' },
            { icon: <Star className="h-4 w-4 text-amber-500" />, label: 'Top Rated', value: `${Math.max(...displayVendors.map(d => d.rating))}/5`, color: 'amber' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-200 shadow-sm rounded-xl">
              {s.icon}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
                <p className="text-sm font-bold text-slate-700">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden mb-5">
          {isLoading ? (
            <div className="p-8 text-center text-slate-550 animate-pulse text-sm">Loading quotations...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 w-36">
                    Criteria
                  </th>
                  {displayVendors.map((v, i) => (
                    <th
                      key={i}
                      className={`px-6 py-4 text-center text-sm font-bold border-l border-slate-150 ${v.isLowest
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-700'
                        }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {v.isLowest && (
                          <span className="text-[9px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                            ★ Lowest
                          </span>
                        )}
                        <span>{v.name}</span>
                        {v.isLowest && (
                          <span className="text-[10px] text-emerald-600 font-normal">(Best Value)</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {criteria.map((c, ci) => (
                  <tr key={ci} className="border-b border-slate-100">
                    <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {c.label}
                    </td>
                    {displayVendors.map((v, vi) => {
                      const rawVal = (v as any)[c.key];
                      const isGrandTotal = c.key === 'grandTotal';
                      const lowestGrand = Math.min(...displayVendors.map(d => d.grandTotal));
                      const isBest = isGrandTotal && v.grandTotal === lowestGrand;
                      return (
                        <td
                          key={vi}
                          className={`px-6 py-4 text-center text-sm border-l border-slate-150 font-semibold ${v.isLowest
                              ? 'bg-emerald-50/50'
                              : ''
                            } ${isBest ? 'text-emerald-600 font-bold' : 'text-slate-600'}`}
                        >
                          {c.format(rawVal)}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Action row */}
                <tr>
                  <td className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Action</td>
                  {displayVendors.map((v, i) => (
                    <td key={i} className={`px-6 py-5 text-center border-l border-slate-150 ${v.isLowest ? 'bg-emerald-50/50' : ''}`}>
                      {selectedIdx === i ? (
                        <span className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600">
                          <CheckCircle className="h-4 w-4" /> Selected
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSelectApprove(i, v.quoteId)}
                          disabled={isSubmitting || selectedIdx !== null}
                          className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${v.isLowest
                              ? 'bg-emerald-50 border border-emerald-250 text-emerald-700 hover:bg-emerald-100 shadow-md'
                              : 'border-slate-200 text-slate-550 hover:border-slate-350 hover:text-slate-800 bg-white disabled:opacity-40 shadow-sm'
                            }`}
                        >
                          {v.isLowest ? 'Select & Approve' : 'Select'}
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs text-slate-500 italic">
          Green = lowest price, selecting vendor initiates the approval workflow.
        </p>
      </main>
    </div>
  );
};

export default QuotationComparison;
