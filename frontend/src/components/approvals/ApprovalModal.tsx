import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { showToast } from '../ui/Toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { TableContainer, Thead, Tbody, Tr, Th, Td } from '../ui/Table';
import Spinner from '../ui/Spinner';
import { CheckCircle2 } from 'lucide-react';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  approval: {
    id: string;
    quotationId: string;
    status: 'pending' | 'approved' | 'rejected';
    vendorName: string;
    rfqTitle: string;
    totalAmount: number;
    requestedByName: string;
    createdAt: string;
    remarks?: string;
  } | null;
  approverId: string;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  approval,
  approverId
}) => {
  const [remarks, setRemarks] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Load RFQ / Quotation specifications details inside modal
  useEffect(() => {
    if (isOpen && approval) {
      const fetchDetail = async () => {
        setDetailLoading(true);
        try {
          // Fetch quotation info which includes rfq details
          await api.quotations.listForRfq(''); // dummy fetch to find, or mockDb fetch
          // We can fetch PO/RFQ detail via getRFQ since it contains items
          await api.purchaseOrders.list(); // fetch POs

          // Let's directly get the RFQ by fetching the quotation info from mockDb or api.
          // Since our API includes getInvoice/getPO, we can use a direct helper.
          // In mock mode, we can fetch rfq details directly.
          // Let's call api.rfqs.list() to find the RFQ matching approval.rfqTitle
          const rfqs = await api.rfqs.list();
          const matchedRfq = rfqs.find((r: any) => r.title === approval.rfqTitle);
          if (matchedRfq) {
            const rfqDetails = await api.rfqs.get(matchedRfq.id);
            setDetail(rfqDetails);
          }
        } catch (err: any) {
          console.error('Failed to load details inside modal', err);
        } finally {
          setDetailLoading(false);
        }
      };
      fetchDetail();
      setRemarks(approval.remarks || '');
    } else {
      setDetail(null);
      setRemarks('');
    }
  }, [isOpen, approval]);

  if (!approval) return null;

  const handleAction = async (action: 'approve' | 'reject') => {
    setIsLoading(true);
    try {
      if (action === 'approve') {
        await api.approvals.approve(approval.id, approverId, remarks);
        showToast.success('Shortlisted contract approved! Purchase Order issued. 🛒');
      } else {
        await api.approvals.reject(approval.id, approverId, remarks);
        showToast.warning('Bidding quote rejected.');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to complete approval decision');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Procurement Approval Workflow"
      size="lg"
    >
      <div className="space-y-6">
        {/* Core Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
          <div>
            <p className="text-[10px] uppercase text-slate-500 font-bold">Shortlisted Vendor</p>
            <p className="text-sm font-bold text-slate-200 mt-0.5">{approval.vendorName}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-500 font-bold">Total Budget Requested</p>
            <p className="text-sm font-extrabold text-brand-400 mt-0.5">₹{approval.totalAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Dynamic Items Spec from RFQ */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">Quoted Line Item Specifications</h4>
          {detailLoading ? (
            <Spinner size="sm" className="my-4" />
          ) : detail ? (
            <TableContainer>
              <Thead>
                <Tr>
                  <Th className="px-4 py-2 text-xs">Specification</Th>
                  <Th className="px-4 py-2 text-xs text-center">Qty</Th>
                  <Th className="px-4 py-2 text-xs">Unit</Th>
                </Tr>
              </Thead>
              <Tbody>
                {detail.items?.map((item: any) => (
                  <Tr key={item.id}>
                    <Td className="px-4 py-2 text-xs font-bold text-slate-300">{item.productName}</Td>
                    <Td className="px-4 py-2 text-xs text-center font-bold text-slate-200">{item.quantity}</Td>
                    <Td className="px-4 py-2 text-xs uppercase text-slate-500 font-semibold">{item.unit}</Td>
                  </Tr>
                ))}
              </Tbody>
            </TableContainer>
          ) : (
            <p className="text-xs text-slate-500 italic">Specification items not found</p>
          )}
        </div>

        {/* Workflow Progress Timeline */}
        <div className="border-t border-slate-900 pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Workflow Routing Timeline</h4>
          <div className="flex flex-col gap-3 font-sans text-xs">
            {/* Step 1 */}
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-slate-400">RFQ published & bidders shortlisted by</span>
              <span className="font-semibold text-slate-300">{approval.requestedByName}</span>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-2">
              {approval.status === 'pending' ? (
                <div className="h-4 w-4 rounded-full border-2 border-slate-800 animate-pulse bg-slate-900 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              )}
              <span className="text-slate-400">Budget release review by Approving Manager</span>
            </div>

            {/* Step 3 */}
            {approval.status !== 'pending' && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${approval.status === 'approved' ? 'text-emerald-400' : 'text-rose-400'}`} />
                <span className="text-slate-400">Final decision:</span>
                <Badge variant={approval.status === 'approved' ? 'success' : 'danger'}>
                  {approval.status}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Remarks Input */}
        <div className="border-t border-slate-900 pt-4">
          <label className="block text-sm font-semibold text-slate-300">Manager Evaluation Remarks</label>
          {approval.status === 'pending' ? (
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide justification, audit comments, or release notes..."
              className="mt-1.5 w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm font-sans"
            />
          ) : (
            <p className="mt-1.5 w-full p-3 bg-slate-950 border border-slate-900 rounded-lg text-slate-400 font-sans italic text-sm">
              {remarks || 'No remarks provided.'}
            </p>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-900">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            {approval.status === 'pending' ? 'Cancel' : 'Close View'}
          </Button>

          {approval.status === 'pending' && (
            <>
              <Button
                type="button"
                variant="danger"
                onClick={() => handleAction('reject')}
                isLoading={isLoading}
              >
                Reject / Deny
              </Button>
              <Button
                type="button"
                variant="success"
                onClick={() => handleAction('approve')}
                isLoading={isLoading}
              >
                Approve & Release PO
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ApprovalModal;
