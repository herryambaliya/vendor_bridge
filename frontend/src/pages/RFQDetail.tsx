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
import QuotationForm from '../components/quotations/QuotationForm';
import { showToast } from '../components/ui/Toast';
import {
  Calendar,
  Sparkles,
  Clock,
  PlusCircle,
  FolderLock,
  Building,
  Award
} from 'lucide-react';

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

interface RFQDetailData {
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

interface Vendor {
  id: string;
  name: string;
  category: string;
  contactName: string;
  contactEmail: string;
  rating: number;
}

export const RFQDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  // Queries
  const { data: rfq, isLoading, refetch } = useQuery<RFQDetailData>({
    queryKey: ['rfq-detail', id],
    queryFn: () => api.rfqs.get(id || '')
  });

  const { data: allVendors } = useQuery<Vendor[]>({
    queryKey: ['vendors-all'],
    queryFn: () => api.vendors.list()
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

  if (!rfq) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto flex items-center justify-center">
          <EmptyState title="RFQ Not Found" description="The requested Request for Quotation does not exist in database." />
        </main>
      </div>
    );
  }

  const isOfficer = user?.role === 'procurement_officer' || user?.role === 'officer';
  const isVendor = user?.role === 'vendor';

  // Vendor permissions
  const isInvitedVendor = isVendor && rfq.assignedVendors.includes(user.vendorId || '');
  const vendorQuotation = isVendor ? rfq.quotations.find(q => q.vendorId === user.vendorId) : null;
  const hasSubmittedQuote = !!vendorQuotation;

  // Filter vendors to show invited list
  const invitedVendorsList = allVendors
    ? allVendors.filter(v => rfq.assignedVendors.includes(v.id))
    : [];

  const totalQtyRequested = rfq.items.reduce((sum, item) => sum + item.quantity, 0);

  const getStatusBadgeVariant = (s: RFQDetailData['status']) => {
    switch (s) {
      case 'open': return 'info';
      case 'closed': return 'success';
      case 'draft': return 'neutral';
      case 'cancelled': return 'danger';
      default: return 'neutral';
    }
  };

  const getQuoteStatusVariant = (s: Quotation['status']) => {
    switch (s) {
      case 'submitted': return 'info';
      case 'shortlisted': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'danger';
      default: return 'neutral';
    }
  };

  const handleCloseRFQ = async () => {
    try {
      await api.rfqs.updateStatus(rfq.id, 'closed');
      showToast.success('RFQ closed successfully. No further quotes accepted.');
      refetch();
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to close RFQ');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between mb-8 pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 font-display">
                {rfq.title}
              </h1>
              <Badge variant={getStatusBadgeVariant(rfq.status)}>{rfq.status}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">RFQ ID: {rfq.id}</p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {/* Procurement Officer Actions */}
            {isOfficer && rfq.status === 'open' && (
              <>
                {rfq.quotations.length > 0 && (
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/rfqs/${rfq.id}/compare`)}
                    className="flex items-center gap-2 text-sm shadow-md"
                  >
                    <Sparkles className="h-4 w-4 text-yellow-305" />
                    Compare {rfq.quotations.length} Quotes
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleCloseRFQ}
                  className="flex items-center gap-2 text-sm border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                >
                  <FolderLock className="h-4 w-4" />
                  Close RFQ
                </Button>
              </>
            )}

            {/* Vendor Actions */}
            {isInvitedVendor && rfq.status === 'open' && !hasSubmittedQuote && (
              <Button
                variant="primary"
                onClick={() => setIsQuoteModalOpen(true)}
                className="flex items-center gap-2 text-sm"
              >
                <PlusCircle className="h-4 w-4" />
                Submit Bidding Quote
              </Button>
            )}

            <Button variant="secondary" onClick={() => isVendor ? navigate('/my-rfqs') : navigate('/rfqs')}>
              Back to List
            </Button>
          </div>
        </div>

        {/* Info Grid Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* RFQ Details Panel */}
          <Card className="p-6 border-slate-200 bg-white shadow-sm lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Specifications Details</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-sans">{rfq.description || 'No description provided.'}</p>
            </div>

            {/* Line Items Table */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Requested Line Items</h3>
              <TableContainer>
                <Thead>
                  <Tr>
                    <Th className="px-4 py-2 text-xs">Item No.</Th>
                    <Th className="px-4 py-2 text-xs">Product Specification</Th>
                    <Th className="px-4 py-2 text-xs text-center">Required Quantity</Th>
                    <Th className="px-4 py-2 text-xs">Unit</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rfq.items?.map((item, index) => (
                    <Tr key={item.id}>
                      <Td className="px-4 py-3 text-xs font-semibold text-slate-450 font-mono">#{index + 1}</Td>
                      <Td className="px-4 py-3 text-sm font-bold text-slate-700">{item.productName}</Td>
                      <Td className="px-4 py-3 text-sm text-center font-bold text-slate-800">{item.quantity}</Td>
                      <Td className="px-4 py-3 text-xs uppercase text-slate-500 font-semibold">{item.unit}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </TableContainer>
            </div>
          </Card>

          {/* Quick Specifications Cards */}
          <div className="space-y-6">
            <Card className="p-5 border-slate-200 bg-white shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-display">Target Constraints</h4>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-500">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Submission Deadline</p>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">{rfq.deadline}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-500">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Published Date</p>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">
                    {new Date(rfq.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 border-slate-200 bg-white shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-display mb-4">Invited Bidders ({invitedVendorsList.length})</h4>
              <div className="space-y-3">
                {invitedVendorsList.map((v) => (
                  <div key={v.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2 truncate">
                      <Building className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-700 truncate font-display">{v.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 text-slate-500">
                      <Award className="h-3 w-3 text-yellow-500" />
                      <span className="text-[11px] font-bold">{v.rating.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Quotations Status List (Procurement Officers, Managers, and Admins can see all) */}
        {!isVendor ? (
          <Card className="p-6 border-slate-200 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-700 font-display">Submitted Bids / Quotes ({rfq.quotations?.length || 0})</h3>
              {isOfficer && rfq.status === 'open' && rfq.quotations?.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => navigate(`/rfqs/${rfq.id}/compare`)} className="text-xs">
                  Compare Side-by-Side
                </Button>
              )}
            </div>

            {(!rfq.quotations || rfq.quotations.length === 0) ? (
              <p className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                No quotations submitted by invited vendors yet.
              </p>
            ) : (
              <TableContainer>
                <Thead>
                  <Tr>
                    <Th>Bidder Name</Th>
                    <Th>Unit Price Quote</Th>
                    <Th>Total Quote Value</Th>
                    <Th>Delivery Period</Th>
                    <Th>Notes</Th>
                    <Th>Quotation Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rfq.quotations.map((quote) => {
                    const vendorName = allVendors?.find(v => v.id === quote.vendorId)?.name || 'Unknown Vendor';
                    return (
                      <Tr key={quote.id}>
                        <Td className="font-bold text-slate-700 font-display">{vendorName}</Td>
                        <Td className="font-semibold text-slate-600">₹{quote.unitPrice.toLocaleString()}</Td>
                        <Td className="font-bold text-slate-800">₹{quote.totalPrice.toLocaleString()}</Td>
                        <Td className="font-semibold text-slate-600">{quote.deliveryDays} Days</Td>
                        <Td className="text-xs text-slate-500 font-sans italic max-w-xs truncate">{quote.notes || '-'}</Td>
                        <Td>
                          <Badge variant={getQuoteStatusVariant(quote.status)}>
                            {quote.status}
                          </Badge>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </TableContainer>
            )}
          </Card>
        ) : (
          /* Vendor specific quotation view */
          isInvitedVendor && (
            <Card className="p-6 border-slate-200 bg-white shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 font-display mb-4">Your Quotation Status</h3>

              {!hasSubmittedQuote ? (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl space-y-4 bg-slate-50/50">
                  <p className="text-sm text-slate-500">
                    You have been invited to bid on this RFQ. You have not submitted a quote yet.
                  </p>
                  {rfq.status === 'open' && (
                    <Button variant="primary" onClick={() => setIsQuoteModalOpen(true)}>
                      Submit Quote Proposal
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-5 rounded-xl border border-slate-200 bg-slate-50">
                    <div>
                      <p className="text-[10px] uppercase text-slate-400 font-bold">Your Quote Status</p>
                      <div className="mt-1">
                        <Badge variant={getQuoteStatusVariant(vendorQuotation.status)}>
                          {vendorQuotation.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-400 font-bold">Submitted Unit Price</p>
                      <p className="text-md font-extrabold text-slate-700 mt-1">₹{vendorQuotation.unitPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-400 font-bold">Total Bid Value</p>
                      <p className="text-md font-extrabold text-brand-600 mt-1">₹{vendorQuotation.totalPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-400 font-bold">Delivery Timeline</p>
                      <p className="text-md font-extrabold text-slate-700 mt-1">{vendorQuotation.deliveryDays} Days</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Bidding Remarks / Terms</h4>
                    <p className="text-sm text-slate-650 bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans italic font-medium">
                      {vendorQuotation.notes || 'No remarks provided.'}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          )
        )}

        {/* Vendor Bidding modal */}
        {isInvitedVendor && (
          <QuotationForm
            isOpen={isQuoteModalOpen}
            onClose={() => setIsQuoteModalOpen(false)}
            onSuccess={refetch}
            rfqId={rfq.id}
            vendorId={user.vendorId || ''}
            totalItemsQuantity={totalQtyRequested}
          />
        )}
      </main>
    </div>
  );
};

export default RFQDetail;
