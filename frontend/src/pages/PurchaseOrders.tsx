import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import Sidebar from '../components/layout/Sidebar';
import { Eye, Calendar, Building, ShoppingBag } from 'lucide-react';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  quotationId: string;
  vendorId: string;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  status: 'issued' | 'acknowledged' | 'delivered' | 'cancelled';
  issuedAt: string;
  vendorName: string;
  rfqTitle: string;
}

const statusStyle: Record<string, string> = {
  issued:       'text-blue-700 bg-blue-50 border-blue-200',
  acknowledged: 'text-amber-700 bg-amber-50 border-amber-200',
  delivered:    'text-emerald-700 bg-emerald-50 border-emerald-200',
  cancelled:    'text-rose-700 bg-rose-50 border-rose-200',
};

export const PurchaseOrders: React.FC = () => {
  const navigate = useNavigate();

  const { data: pos, isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders'],
    queryFn: () => api.purchaseOrders.list(),
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="h-1 w-full bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500" />

        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-7 animate-fade-in-up">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag className="h-4 w-4 text-rose-500" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Procurement</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">Purchase Orders</h1>
              <p className="text-sm text-slate-500 mt-1">Issued contracts, valuations, and receipt logging.</p>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="liquid-card border border-slate-100 p-12 text-center animate-fade-in-up">
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                <div className="h-4 w-4 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                Loading purchase orders...
              </div>
            </div>
          ) : !pos || pos.length === 0 ? (
            <div className="liquid-card border border-slate-100 p-16 text-center animate-fade-in-up">
              <div className="h-14 w-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-7 w-7 text-rose-400" />
              </div>
              <p className="text-slate-700 font-semibold text-base">No Purchase Orders</p>
              <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">Award a quotation in Approvals to generate a PO automatically.</p>
            </div>
          ) : (
            <div className="liquid-card border border-slate-100 overflow-hidden animate-fade-in-up">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-700 font-display">All Purchase Orders</h2>
                <span className="text-xs text-slate-400 font-medium">{pos.length} records</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['PO Reference', 'Tender Title', 'Vendor', 'Total Value', 'Status', 'Release Date', ''].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pos.map((po) => (
                    <tr
                      key={po.id}
                      onClick={() => navigate(`/purchase-orders/${po.id}`)}
                      className="hover:bg-rose-50/20 transition-all duration-150 cursor-pointer group"
                    >
                      <td className="px-6 py-4 font-mono text-sm font-bold text-slate-800">{po.poNumber}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">{po.rfqTitle}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-sm text-slate-600">{po.vendorName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-rose-600">
                        ₹{po.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border capitalize ${statusStyle[po.status]}`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(po.issuedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/purchase-orders/${po.id}`); }}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Review
                        </button>
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

export default PurchaseOrders;
