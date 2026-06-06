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
import { Phone, Mail, MapPin, Receipt, ArrowRight } from 'lucide-react';

interface RFQItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
}

interface MockPO {
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
    description: string;
    items: RFQItem[];
  };
}

export const PODetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  // Fetch PO detail
  const { data: po, isLoading: poLoading } = useQuery<MockPO>({
    queryKey: ['po-detail', id],
    queryFn: () => api.purchaseOrders.get(id || '')
  });

  // Fetch invoices to see if already generated
  const { data: invoices, isLoading: invoicesLoading, refetch: refetchInvoices } = useQuery<any[]>({
    queryKey: ['invoices-all-check'],
    queryFn: () => api.invoices.list()
  });

  if (poLoading || invoicesLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto flex items-center justify-center">
          <TableSkeleton />
        </main>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto flex items-center justify-center">
          <EmptyState title="PO Not Found" description="The requested Purchase Order does not exist in database." />
        </main>
      </div>
    );
  }

  const isOfficer = user?.role === 'procurement_officer';
  const existingInvoice = invoices?.find(inv => inv.poId === po.id);

  const handleGenerateInvoice = async () => {
    setIsGeneratingInvoice(true);
    try {
      const newInv = await api.invoices.create(po.id);
      showToast.success(`Invoice ${newInv.invoiceNumber} generated successfully!`);
      refetchInvoices();
      navigate(`/invoices/${newInv.id}`);
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to generate invoice');
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const getStatusBadgeVariant = (s: MockPO['status']) => {
    switch (s) {
      case 'issued': return 'info';
      case 'acknowledged': return 'warning';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between mb-8 pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 font-display">
                Contract PO details
              </h1>
              <Badge variant={getStatusBadgeVariant(po.status)}>{po.status}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">Order Number: {po.poNumber}</p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {isOfficer && (
              existingInvoice ? (
                <Button
                  variant="success"
                  onClick={() => navigate(`/invoices/${existingInvoice.id}`)}
                  className="flex items-center gap-2 text-sm"
                >
                  <Receipt className="h-4 w-4" />
                  View Invoice
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleGenerateInvoice}
                  isLoading={isGeneratingInvoice}
                  className="flex items-center gap-2 text-sm shadow-md"
                >
                  <Receipt className="h-4 w-4" />
                  Generate Invoice
                </Button>
              )
            )}

            <Button variant="secondary" onClick={() => navigate('/purchase-orders')}>
              Back to List
            </Button>
          </div>
        </div>

        {/* PO Content Sheet */}
        <Card variant="glass" className="p-8 border-slate-200 bg-white space-y-8 max-w-4xl shadow-md rounded-2xl">
          {/* Header Section */}
          <div className="flex flex-wrap justify-between items-start gap-6 pb-6 border-b border-slate-150">
            <div>
              <h2 className="text-xl font-bold font-display text-slate-800">VendorBridge ERP</h2>
              <p className="text-xs text-slate-400 mt-1 font-sans">Centralized Procurement Entity</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase text-slate-400 font-bold">Purchase Order</p>
              <p className="text-md font-mono font-bold text-slate-700 mt-1">{po.poNumber}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1">
                Issued on: {new Date(po.issuedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Supplier vs Ship-To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Supplier Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 font-display">Supplier Recipient</h3>
              <div>
                <p className="text-sm font-bold text-slate-700 font-display">{po.vendor.name}</p>
                <div className="flex flex-col gap-1 mt-2 text-xs text-slate-500 font-sans">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {po.vendor.contactEmail}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {po.vendor.contactPhone}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {po.vendor.address}
                  </div>
                  <p className="mt-1 font-semibold text-slate-600">GSTIN: <span className="font-mono">{po.vendor.gstNumber}</span></p>
                </div>
              </div>
            </div>

            {/* Delivery address details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 font-display">Shipping Destination</h3>
              <div>
                <p className="text-sm font-bold text-slate-700 font-display">VendorBridge Headquarters</p>
                <div className="flex flex-col gap-1 mt-2 text-xs text-slate-500 font-sans">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    Pune Corporate Park, Block B, Floor 4, Pune, MH, 411001
                  </div>
                  <p className="mt-1 text-slate-450">Contact: Procurement Officer John (officer@vb.com)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Line items specifications */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-455 font-display mb-3">Order Line Items</h3>
            <TableContainer>
              <Thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <Th className="px-4 py-2 text-xs">Spec Description</Th>
                  <Th className="px-4 py-2 text-xs text-center">Qty</Th>
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

          {/* Calculations Summary block */}
          <div className="border-t border-slate-150 pt-6 flex justify-end">
            <div className="w-80 space-y-3 font-sans text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Items Subtotal:</span>
                <span className="font-semibold">₹{po.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Integrated GST ({po.taxPercent}%):</span>
                <span className="font-semibold">₹{po.taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-700 border-t border-slate-100 pt-3 text-sm font-bold">
                <span className="font-display">Grand Total Value:</span>
                <span className="text-brand-600 font-extrabold">₹{po.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default PODetail;
