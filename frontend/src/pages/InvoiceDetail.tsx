import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import Sidebar from '../components/layout/Sidebar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { TableContainer, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { TableSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { showToast } from '../components/ui/Toast';
import { Download, Printer, Send, Mail, Phone, MapPin, Calendar } from 'lucide-react';

interface RFQItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
}

interface InvoiceDetailData {
  id: string;
  invoiceNumber: string;
  poId: string;
  issuedDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  pdfUrl?: string;
  emailedAt?: string;
  createdAt: string;
  po: {
    id: string;
    poNumber: string;
    subtotal: number;
    taxPercent: number;
    taxAmount: number;
    totalAmount: number;
    vendor: {
      id: string;
      name: string;
      category: string;
      gstNumber: string;
      contactName: string;
      contactEmail: string;
      contactPhone: string;
      address: string;
    };
    rfq: {
      id: string;
      title: string;
      items: RFQItem[];
    };
  };
}

export const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch Invoice details
  const { data: invoice, isLoading, refetch } = useQuery<InvoiceDetailData>({
    queryKey: ['invoice-detail', id],
    queryFn: () => api.invoices.get(id || '')
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto flex items-center justify-center">
          <TableSkeleton />
        </main>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto flex items-center justify-center">
          <EmptyState title="Invoice Not Found" description="The requested Invoice does not exist in database." />
        </main>
      </div>
    );
  }

  const isOfficer = user?.role === 'procurement_officer';
  const po = invoice.po;

  // Simulate PDF Download
  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const blob = await api.invoices.downloadPdf(invoice.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      showToast.success('Invoice PDF downloaded successfully!');
    } catch (err: any) {
      showToast.error('Failed to generate PDF document stream');
    } finally {
      setIsDownloading(false);
    }
  };

  // Trigger Print layout
  const handlePrint = () => {
    window.print();
  };

  // Dispatch Email Simulator
  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      await api.invoices.sendEmail(invoice.id);
      showToast.success(`Invoice PDF dispatched to ${po.vendor.contactEmail}! ✅`);
      refetch();
    } catch (err: any) {
      showToast.error('Failed to dispatch invoice email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const getStatusBadgeVariant = (s: InvoiceDetailData['status']) => {
    switch (s) {
      case 'paid': return 'success';
      case 'sent': return 'info';
      case 'draft': return 'neutral';
      case 'overdue': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between mb-8 pb-6 border-b border-slate-200 gap-4 no-print">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 font-display">
                Invoice Details
              </h1>
              <Badge variant={getStatusBadgeVariant(invoice.status)}>{invoice.status}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">Invoice Number: {invoice.invoiceNumber}</p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {/* Download */}
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              isLoading={isDownloading}
              className="flex items-center gap-2 text-sm border-slate-200 text-slate-600"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>

            {/* Print */}
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex items-center gap-2 text-sm border-slate-200 text-slate-600"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>

            {/* Officer Email send trigger */}
            {isOfficer && (invoice.status === 'draft' || invoice.status === 'sent') && (
              <Button
                variant="primary"
                onClick={handleSendEmail}
                isLoading={isSendingEmail}
                className="flex items-center gap-2 text-sm shadow-md"
              >
                <Send className="h-4 w-4 text-white" />
                Send via Email
              </Button>
            )}

            <Button variant="secondary" onClick={() => navigate('/invoices')}>
              Back to List
            </Button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="print-clean">
          <Card variant="glass" className="p-8 border-slate-200 space-y-8 max-w-4xl shadow-md bg-white relative rounded-2xl">
            {/* Decorative printed background indicator (hidden in print) */}
            {invoice.status === 'sent' && (
              <div className="absolute top-20 right-8 -rotate-12 border-4 border-dashed border-sky-500/20 text-sky-550/20 font-display font-black text-xl uppercase tracking-widest px-4 py-2 rounded-xl pointer-events-none no-print">
                Emailed Out
              </div>
            )}

            {/* Top Header details */}
            <div className="flex flex-wrap justify-between items-start gap-6 pb-6 border-b border-slate-150">
              <div>
                <h2 className="text-xl font-bold font-display text-slate-800">VendorBridge Procurement ERP</h2>
                <p className="text-xs text-slate-400 mt-1 font-sans">Corporate Tax Invoice Sheet</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase text-slate-400 font-bold">Tax Invoice</p>
                <p className="text-md font-mono font-bold text-slate-700 mt-1">{invoice.invoiceNumber}</p>
                <div className="flex flex-col gap-1 mt-2 text-xs text-slate-500 font-sans">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Issue: {invoice.issuedDate}
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Due Date: {invoice.dueDate}
                  </div>
                </div>
              </div>
            </div>

            {/* Supplier / Shipping address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Vendor details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 font-display">Billed From (Supplier)</h3>
                <div>
                  <p className="text-sm font-bold text-slate-700 font-display">{po.vendor.name}</p>
                  <div className="flex flex-col gap-1 mt-2 text-xs text-slate-500 font-sans">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-455" />
                      {po.vendor.contactEmail}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-455" />
                      {po.vendor.contactPhone}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-455" />
                      {po.vendor.address}
                    </div>
                    <p className="mt-1 font-semibold text-slate-600">GSTIN: <span className="font-mono">{po.vendor.gstNumber}</span></p>
                  </div>
                </div>
              </div>

              {/* Company Ship to details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 font-display">Billed To (Enterprise)</h3>
                <div>
                  <p className="text-sm font-bold text-slate-700 font-display">VendorBridge Procurement Co.</p>
                  <div className="flex flex-col gap-1 mt-2 text-xs text-slate-500 font-sans">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-455" />
                      Pune Corporate Park, Block B, Floor 4, Pune, MH, 411001
                    </div>
                    <p className="mt-1 text-slate-450">PO Ref: {po.poNumber}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Items table */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 font-display mb-3">Billing Specifications</h3>
              <TableContainer>
                <Thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <Th className="px-4 py-2 text-xs">Item Description</Th>
                    <Th className="px-4 py-2 text-xs text-center">Quantity</Th>
                    <Th className="px-4 py-2 text-xs">Unit</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {po.rfq.items?.map((item) => (
                    <Tr key={item.id}>
                      <Td className="px-4 py-3 text-sm font-bold text-slate-700">{item.productName}</Td>
                      <Td className="px-4 py-3 text-sm text-center font-bold text-slate-800">{item.quantity}</Td>
                      <Td className="px-4 py-3 text-xs uppercase text-slate-500 font-semibold">{item.unit}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </TableContainer>
            </div>

            {/* Calculations Breakdown Block */}
            <div className="border-t border-slate-150 pt-6 flex justify-end">
              <div className="w-80 space-y-3 font-sans text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal Amount:</span>
                  <span className="font-semibold">₹{po.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Integrated GST (18.00%):</span>
                  <span className="font-semibold">₹{po.taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-700 border-t border-slate-100 pt-3 text-sm font-bold">
                  <span className="font-display">Total Due Amount:</span>
                  <span className="text-brand-600 font-extrabold">₹{po.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Dispatch details (emailed timestamp, etc.) */}
            {invoice.emailedAt && (
              <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-[11px] text-slate-500 no-print">
                <span>Emailed Logged: {new Date(invoice.emailedAt).toLocaleString()}</span>
                <span>Transporter Status: Dispatched</span>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default InvoiceDetail;
