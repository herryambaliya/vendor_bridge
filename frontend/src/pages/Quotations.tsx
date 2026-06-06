import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import Sidebar from '../components/layout/Sidebar';
import { showToast } from '../components/ui/Toast';
import { Plus, Trash2, Send, Save, RefreshCw, FileText } from 'lucide-react';

interface RFQItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
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
}

interface LineItem {
  item: string;
  qty: number;
  unitPrice: number;
  deliveryDays: number;
}

export const Quotations: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rfqIdParam = searchParams.get('rfqId');

  // Load RFQs to let the user pick which RFQ they are submitting a quote for
  const { data: rfqs, isLoading: isLoadingRFQs } = useQuery<RFQ[]>({
    queryKey: ['rfqs-quotation-select'],
    queryFn: () => api.rfqs.list()
  });

  const openRfqs = rfqs?.filter(r => r.status === 'open') || [];
  
  // Selected RFQ state
  const [selectedRfqId, setSelectedRfqId] = useState<string>(rfqIdParam || '');
  const activeRfq = openRfqs.find(r => r.id === selectedRfqId);

  // Sync with param if it changes
  useEffect(() => {
    if (rfqIdParam) {
      setSelectedRfqId(rfqIdParam);
    } else if (openRfqs.length > 0 && !selectedRfqId) {
      setSelectedRfqId(openRfqs[0].id);
    }
  }, [rfqIdParam, openRfqs]);

  // Quotation fields
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [gstPercent, setGstPercent] = useState<number>(18);
  const [notes, setNotes] = useState<string>('Payment terms: 20 days net...');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize line items from selected RFQ items
  useEffect(() => {
    if (activeRfq && activeRfq.items) {
      setLineItems(activeRfq.items.map(i => ({
        item: i.productName,
        qty: i.quantity,
        unitPrice: 0,
        deliveryDays: 7
      })));
    } else {
      // Default wireframe demo template if no active RFQ
      setLineItems([
        { item: 'Ergonomic chair', qty: 25, unitPrice: 3500, deliveryDays: 7 },
        { item: 'Tech Core LTD', qty: 10, unitPrice: 8200, deliveryDays: 14 }
      ]);
    }
  }, [selectedRfqId, activeRfq]);

  // Update a single line value
  const updateLine = (index: number, field: keyof LineItem, value: any) => {
    setLineItems(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const addLine = () => {
    setLineItems(prev => [...prev, { item: '', qty: 1, unitPrice: 0, deliveryDays: 7 }]);
  };

  const removeLine = (index: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = lineItems.reduce((acc, curr) => acc + (curr.qty * curr.unitPrice), 0);
  const gstAmount = Math.round((subtotal * gstPercent) / 100);
  const grandTotal = subtotal + gstAmount;

  const handleSubmit = async () => {
    if (lineItems.length === 0) {
      showToast.error('Please add at least one item to submit.');
      return;
    }
    if (lineItems.some(li => !li.item || li.qty <= 0 || li.unitPrice <= 0)) {
      showToast.error('Please fill in valid name, quantity and unit price for all items.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        rfqId: selectedRfqId || 'rfq-demo',
        unitPrice: lineItems[0]?.unitPrice || 0,
        totalPrice: grandTotal,
        deliveryDays: Math.max(...lineItems.map(li => li.deliveryDays)),
        notes: notes,
        itemsList: lineItems
      };
      await api.quotations.submit(payload);
      showToast.success('Quotation submitted successfully! ✅');
      navigate('/rfqs');
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to submit quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Top Header Card with Glassmorphism liquid styling */}
        <div className="bg-white/70 backdrop-blur-md border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6 mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-display">
              Submit Quotations
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Create and dispatch your commercial pricing proposal.
            </p>
          </div>
          {openRfqs.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Select RFQ Target:</span>
              <select
                value={selectedRfqId}
                onChange={(e) => setSelectedRfqId(e.target.value)}
                className="bg-slate-100 border-none rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all cursor-pointer"
              >
                {openRfqs.map(r => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Info & Form container */}
        <div className="space-y-6 max-w-6xl">
          {/* RFQ Target info */}
          <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/30 border border-blue-100/40 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">Target Specifications</h3>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-bold text-slate-800 font-display">
                  RFQ: {activeRfq?.title || 'Office Furniture Procurement Q2'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Deadline: <span className="font-semibold text-slate-700">{activeRfq?.deadline || '15 June 2026'}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="px-3.5 py-1.5 bg-blue-100 text-blue-700 rounded-2xl text-xs font-bold uppercase tracking-wider">
                  Open for Bid
                </span>
              </div>
            </div>
            {/* Summary line */}
            <div className="mt-4 pt-4 border-t border-blue-100/50 text-xs text-slate-600 font-medium">
              <span className="text-slate-400 font-bold uppercase mr-2 text-[10px]">RFQ Summary:</span>
              {activeRfq?.items ? (
                activeRfq.items.map(i => `${i.productName} * ${i.quantity}`).join(', ')
              ) : (
                'Ergonomic chair * 25, standing desk * 10 – category furniture'
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Table Card */}
              <div className="bg-white border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] rounded-3xl overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Your Quotation Specifications</h4>
                  <button
                    onClick={addLine}
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-left bg-slate-50/30">
                        <th className="px-6 py-4">Item Name</th>
                        <th className="px-4 py-4 text-center">Qty</th>
                        <th className="px-4 py-4 text-right">Unit Price (₹)</th>
                        <th className="px-4 py-4 text-right">Total Price (₹)</th>
                        <th className="px-4 py-4 text-center">Delivery (Days)</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {lineItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={item.item}
                              onChange={(e) => updateLine(idx, 'item', e.target.value)}
                              placeholder="e.g. Ergonomic chair"
                              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-semibold text-slate-700 placeholder-slate-300"
                            />
                          </td>
                          <td className="px-4 py-4 text-center">
                            <input
                              type="number"
                              value={item.qty}
                              onChange={(e) => updateLine(idx, 'qty', parseInt(e.target.value) || 0)}
                              className="w-16 bg-slate-50 border-none rounded-xl py-1 px-2 text-center text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-4 text-right">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-24 bg-slate-50 border-none rounded-xl py-1 px-2 text-right text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-4 text-right text-sm font-bold text-slate-800">
                            {((item.qty || 0) * (item.unitPrice || 0)).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <input
                              type="number"
                              value={item.deliveryDays}
                              onChange={(e) => updateLine(idx, 'deliveryDays', parseInt(e.target.value) || 0)}
                              className="w-16 bg-slate-50 border-none rounded-xl py-1 px-2 text-center text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => removeLine(idx)}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Note and Tax Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] rounded-3xl p-6">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tax / GST %</label>
                  <div className="flex items-center gap-3">
                    <div className="relative w-32">
                      <input
                        type="number"
                        value={gstPercent}
                        onChange={(e) => setGstPercent(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 border-none rounded-2xl py-2.5 px-4 text-sm font-bold text-slate-700 pr-8 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      />
                      <span className="absolute right-3.5 top-2.5 text-slate-400 font-extrabold text-sm">%</span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Applied to subtotal</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] rounded-3xl p-6">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Notes & Payment Terms</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter terms of delivery, payment, warranty info..."
                    className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-medium text-slate-600 placeholder-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-sm font-bold transition-all shadow-[0_10px_30px_rgba(37,99,235,0.2)] active:scale-[0.98]"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Quotation'}
                </button>
                <button
                  onClick={() => {
                    showToast.success('Draft saved successfully!');
                    navigate('/rfqs');
                  }}
                  className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-600 border border-slate-100 rounded-2xl text-sm font-bold transition-all"
                >
                  Save Draft
                </button>
              </div>
            </div>

            {/* Calculations Card with Light Liquid Design */}
            <div>
              <div className="bg-gradient-to-br from-white to-blue-50/20 border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.03)] rounded-3xl p-6 sticky top-8">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Summary Breakdown</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">Subtotal</span>
                    <span className="text-sm font-bold text-slate-800">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500">GST ({gstPercent}%)</span>
                    <span className="text-sm font-bold text-slate-800">₹{gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t border-slate-100 pt-4 mt-2 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900">Grand Total</span>
                    <span className="text-lg font-extrabold text-blue-600">
                      ₹{grandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-xs text-blue-600 font-medium">
                  Competitive pricing and shorter delivery timelines increase bid success factors.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Quotations;
