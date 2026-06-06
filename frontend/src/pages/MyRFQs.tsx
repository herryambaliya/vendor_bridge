import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import Sidebar from '../components/layout/Sidebar';
import { showToast } from '../components/ui/Toast';
import { FileText, Plus, X, Send, Save, ChevronRight } from 'lucide-react';

interface RFQItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
}

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
}

interface RFQ {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'open' | 'closed' | 'cancelled';
  deadline: string;
  createdBy: string;
  createdAt: string;
  items: RFQItem[];
  assignedVendors: string[];
  quotations: Quotation[];
}

interface LineItem {
  item: string;
  qty: number;
  unitPrice: number;
  deliveryDays: number;
}

// ── Quotation Submission Form Panel ────────────────────────────────────────────
const QuotationForm: React.FC<{ rfq: RFQ; onBack: () => void }> = ({ rfq, onBack }) => {
  const [lineItems, setLineItems] = useState<LineItem[]>(
    rfq.items?.map(i => ({ item: i.productName, qty: i.quantity, unitPrice: 0, deliveryDays: 7 })) ||
    [{ item: 'Ergonomic chair', qty: 25, unitPrice: 3500, deliveryDays: 7 },
    { item: 'Tech Core LTD', qty: 10, unitPrice: 8200, deliveryDays: 14 }]
  );
  const [gstPercent, setGstPercent] = useState(18);
  const [notes, setNotes] = useState('Payment terms: 20 days net...');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateLine = (idx: number, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const addLine = () => setLineItems(prev => [...prev, { item: '', qty: 1, unitPrice: 0, deliveryDays: 7 }]);
  const removeLine = (idx: number) => setLineItems(prev => prev.filter((_, i) => i !== idx));

  const subtotal = lineItems.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const gstAmount = Math.round(subtotal * gstPercent / 100);
  const grandTotal = subtotal + gstAmount;

  const { user } = useAuthStore();
  const handleSubmit = async () => {
    if (!user?.vendorId) {
      showToast.error('No vendor account linked to this user');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        rfqId: rfq.id,
        vendorId: user.vendorId,
        unitPrice: lineItems[0]?.unitPrice || 0,
        totalPrice: grandTotal,
        deliveryDays: Math.max(...lineItems.map(li => li.deliveryDays)),
        notes: notes
      };
      await api.quotations.submit(payload);
      showToast.success('Quotation submitted successfully! ✅');
      onBack();
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to submit quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all text-sm";

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      {/* Page header */}
      <div className="mb-7">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors mb-4">
          <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Back to RFQ List
        </button>
        <h1 className="text-2xl font-bold text-slate-800 font-display">Submit Quotations</h1>
        <p className="text-sm text-slate-500 mt-1">
          RFQ: {rfq.title} – deadline {rfq.deadline}
        </p>
      </div>

      {/* RFQ Summary box */}
      <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 mb-6">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">RFQ Summary</p>
        <p className="text-sm text-slate-600">
          {rfq.items?.map(i => `${i.productName} * ${i.quantity}`).join(', ') ||
            'Ergonomic chair * 25, standing desk * 10'} – category furniture
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Line Items + GST + Notes */}
        <div className="lg:col-span-2 space-y-5">
          {/* Your Quotation table */}
          <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Your Quotation</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {['Item', 'Qty', 'Unit Price', 'Total', 'Delivery (days)', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lineItems.map((li, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <input value={li.item} onChange={e => updateLine(i, 'item', e.target.value)}
                        className="w-full bg-transparent border-0 text-sm text-slate-700 focus:outline-none focus:text-slate-900 placeholder-slate-400"
                        placeholder="Item name" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" value={li.qty} onChange={e => updateLine(i, 'qty', +e.target.value)}
                        className="w-16 bg-transparent border-0 text-sm text-slate-700 focus:outline-none text-center" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" value={li.unitPrice} onChange={e => updateLine(i, 'unitPrice', +e.target.value)}
                        className="w-24 bg-transparent border-0 text-sm text-slate-700 focus:outline-none text-right" />
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-800">
                      {(li.qty * li.unitPrice).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" value={li.deliveryDays} onChange={e => updateLine(i, 'deliveryDays', +e.target.value)}
                        className="w-16 bg-transparent border-0 text-sm text-slate-700 focus:outline-none text-center" />
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => removeLine(i)} className="text-slate-400 hover:text-rose-500 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addLine}
              className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold text-brand-600 hover:text-brand-700 hover:bg-brand-50 border-t border-slate-100 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add Line Item
            </button>
          </div>

          {/* Tax / GST */}
          <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tax / GST %</label>
            <div className="flex items-center gap-3">
              <div className="relative w-32">
                <input
                  type="number"
                  value={gstPercent}
                  onChange={e => setGstPercent(+e.target.value)}
                  className={`${inputCls} pr-8`}
                />
                <span className="absolute right-3 top-2.5 text-sm text-slate-400 font-bold">%</span>
              </div>
              <span className="text-xs text-slate-400">Applied to subtotal</span>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Note / Terms</label>
            <textarea
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Payment terms: 20 days net..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Quotation'}
            </button>
            <button
              className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 text-sm font-bold rounded-xl transition-all shadow-sm"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </button>
          </div>
        </div>

        {/* Right: Grand Total Summary */}
        <div>
          <div className="bg-white border border-slate-200/80 shadow-md rounded-2xl overflow-hidden sticky top-8">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/30">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order Summary</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold text-slate-700">{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">GST ({gstPercent}%)</span>
                <span className="font-semibold text-slate-700">{gstAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between">
                <span className="text-sm font-bold text-slate-700">Grand Total</span>
                <span className="text-lg font-bold text-brand-600">{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
            {/* Visual accent */}
            <div className="px-5 pb-5">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <p className="text-xs text-emerald-700 font-semibold">
                  ✓ Competitive pricing helps selection
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

// ── RFQ List View ──────────────────────────────────────────────────────────────
export const MyRFQs: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);

  const { data: rfqs, isLoading } = useQuery<RFQ[]>({
    queryKey: ['my-rfqs', user?.vendorId],
    queryFn: async () => {
      const all = await api.rfqs.list();
      return all.filter((r: any) => r.assignedVendors.includes(user?.vendorId || '') && r.status !== 'draft');
    },
    enabled: !!user?.vendorId
  });

  const myRfqs = rfqs || [];

  if (selectedRFQ) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800">
        <Sidebar />
        <QuotationForm rfq={selectedRFQ} onBack={() => setSelectedRFQ(null)} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-slate-800 font-display">Submit Quotations</h1>
          <p className="text-sm text-slate-500 mt-1">View assigned RFQs and submit your pricing proposals.</p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading assigned RFQs...</div>
        ) : myRfqs.length === 0 ? (
          <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-12 text-center">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 font-semibold">No Assigned RFQs</p>
            <p className="text-slate-500 text-sm mt-1">You don't have any open RFQ assignments yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myRfqs.map(rfq => {
              const quote = rfq.quotations?.find(q => q.vendorId === user?.vendorId);
              return (
                <div key={rfq.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center justify-between hover:border-slate-300 hover:shadow-sm transition-all group cursor-pointer"
                  onClick={() => setSelectedRFQ(rfq)}>
                  <div>
                    <p className="font-bold text-slate-700 font-display">{rfq.title}</p>
                    <p className="text-xs text-slate-500 mt-1">Deadline: {rfq.deadline}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {quote ? (
                      <span className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold">
                        Submitted – ₹{quote.totalPrice.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 text-xs font-bold">
                        Pending Submission
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyRFQs;
