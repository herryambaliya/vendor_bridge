import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  FileText,
  CheckCircle,
  XCircle,
  FileCheck,
  Send,
  FolderPlus,
  PlusCircle,
  Building
} from 'lucide-react';
import Spinner from '../ui/Spinner';

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  entityType: 'rfq' | 'quotation' | 'approval' | 'po' | 'invoice' | 'vendor';
  entityId: string;
  action: string;
  metadata?: any;
  createdAt: string;
}

export const RecentActivity: React.FC = () => {
  const { data: logs, isLoading, error } = useQuery<ActivityLog[]>({
    queryKey: ['activity-logs-dashboard'],
    queryFn: () => api.activityLogs.list(5)
  });

  const getLogDetails = (log: ActivityLog) => {
    const time = new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
    const timestamp = `${date} at ${time}`;

    const iconClass = "h-5 w-5";

    // Map log types to descriptions and icons
    switch (log.entityType) {
      case 'rfq':
        return {
          icon: <FileText className={`${iconClass} text-sky-400`} />,
          title: `RFQ "${log.metadata?.title || log.entityId}"`,
          desc: `${log.userName} ${log.action === 'created' ? 'published a new Request for Quotation' : `updated status to ${log.action}`}`,
          time: timestamp
        };
      case 'quotation':
        return {
          icon: <PlusCircle className={`${iconClass} text-amber-400`} />,
          title: `Quotation Submited`,
          desc: `Vendor quotation submitted for RFQ Ref: ${log.entityId} (Value: ₹${log.metadata?.amount?.toLocaleString() || '0'})`,
          time: timestamp
        };
      case 'approval':
        const isApp = log.action === 'approved';
        return {
          icon: isApp ? <CheckCircle className={`${iconClass} text-emerald-400`} /> : <XCircle className={`${iconClass} text-rose-400`} />,
          title: `Workflow Approval ${isApp ? 'Granted' : 'Rejected'}`,
          desc: `Quotation approval request was ${log.action} by ${log.userName} ${log.metadata?.remarks ? `("${log.metadata.remarks}")` : ''}`,
          time: timestamp
        };
      case 'po':
        return {
          icon: <FileCheck className={`${iconClass} text-indigo-400`} />,
          title: `Purchase Order Issued`,
          desc: `Purchase Order ${log.metadata?.poNumber || log.entityId} auto-generated upon approval`,
          time: timestamp
        };
      case 'invoice':
        const isEmail = log.action === 'emailed';
        return {
          icon: isEmail ? <Send className={`${iconClass} text-emerald-400`} /> : <FolderPlus className={`${iconClass} text-teal-400`} />,
          title: isEmail ? `Invoice Sent via Email` : `Invoice Generated`,
          desc: isEmail
            ? `${log.userName} dispatched PDF Invoice INV-${log.entityId} to supplier inbox`
            : `${log.userName} generated billing invoice for PO Reference ${log.entityId}`,
          time: timestamp
        };
      case 'vendor':
        return {
          icon: <Building className={`${iconClass} text-purple-400`} />,
          title: `Vendor Registered`,
          desc: `Supplier "${log.metadata?.name || log.entityId}" onboarding completed by system admin`,
          time: timestamp
        };
      default:
        return {
          icon: <FileText className={`${iconClass} text-slate-400`} />,
          title: `Action Logged`,
          desc: `${log.userName} performed action "${log.action}" on ${log.entityType}`,
          time: timestamp
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner size="sm" />
      </div>
    );
  }

  if (error || !logs || logs.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4 text-center">
        No recent activity logs recorded in database.
      </p>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {logs.map((log, logIdx) => {
          const details = getLogDetails(log);
          return (
            <li key={log.id}>
              <div className="relative pb-8">
                {/* Vertical timeline divider line */}
                {logIdx !== logs.length - 1 ? (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-800"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center ring-8 ring-slate-950">
                      {details.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm font-bold text-slate-200 font-display">
                        {details.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 font-sans">
                        {details.desc}
                      </p>
                    </div>
                    <div className="text-right text-[10px] whitespace-nowrap text-slate-500 font-semibold uppercase tracking-wider">
                      {details.time}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RecentActivity;
