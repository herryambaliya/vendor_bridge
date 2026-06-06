import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import Sidebar from '../components/layout/Sidebar';
import { FileText, Eye, Receipt, ArrowUpRight } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  poId: string;
  issuedDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  pdfUrl?: string;
  emailedAt?: string;
  poNumber: string;
  vendorName: string;
  totalAmount: number;
}

const statusStyle: Record<string, string> = {
  paid:    'text-emerald-700 bg-emerald-50 border-emerald-200',
  sent:    'text-blue-700 bg-blue-50 border-blue-200',
  draft:   'text-slate-500 bg-slate-100 border-slate-200',
  overdue: 'text-rose-700 bg-rose-50 border-rose-200',
};

const statusLabel: Record<string, string> = {
  paid:    'Paid',
  sent:    'Pending Payment',
  draft:   'Draft',
  overdue: 'Overdue',
};

export const Invoices: React.FC = () => {
  const navigate = useNavigate();

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: () => api.invoices.list(),
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        <div className="p-8">
          {/* Header */}
          <div className="mb-7 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Billing & Payments</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">Invoices</h1>
            <p className="text-sm text-slate-500 mt-1">Auto-generated billing documents after workflow approval.</p>
          </div>

          {isLoading ? (
            <div className="liquid-card border border-slate-100 p-12 text-center animate-fade-in-up">
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                <div className="h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                Loading invoices...
              </div>
            </div>
          ) : !invoices || invoices.length === 0 ? (
            <div className="liquid-card border border-slate-100 p-16 text-center animate-fade-in-up">
              <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="h-7 w-7 text-emerald-500" />
              </div>
              <p className="text-slate-700 font-semibold text-base">No Invoices Generated</p>
              <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">Invoices appear automatically after a Purchase Order workflow is completed.</p>
            </div>
          ) : (
            <div className="liquid-card border border-slate-100 overflow-hidden animate-fade-in-up">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-700 font-display">All Invoices</h2>
                <span className="text-xs text-slate-400 font-medium">{invoices.length} records</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Invoice No.', 'PO Reference', 'Vendor', 'Amount', 'Status', 'Issue Date', ''].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                      className="hover:bg-emerald-50/30 transition-all duration-150 cursor-pointer group"
                    >
                      <td className="px-6 py-4 font-mono text-sm font-bold text-slate-800">{inv.invoiceNumber}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{inv.poNumber}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{inv.vendorName}</td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                        ₹{inv.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${statusStyle[inv.status]}`}>
                          {statusLabel[inv.status] ?? inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">{inv.issuedDate}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${inv.id}`); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
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

export default Invoices;
