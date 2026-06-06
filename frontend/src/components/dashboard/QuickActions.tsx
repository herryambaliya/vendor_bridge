import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import {
  PlusCircle,
  UserPlus,
  LineChart,
  CheckSquare,
  FileSearch,
  FileSpreadsheet
} from 'lucide-react';
import Card from '../ui/Card';

export const QuickActions: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  if (!user) return null;

  const actions = {
    procurement_officer: [
      {
        label: 'Create New RFQ',
        desc: 'Publish items request to vendors',
        icon: <PlusCircle className="h-6 w-6 text-brand-400" />,
        onClick: () => navigate('/rfqs'),
        bg: 'hover:bg-brand-500/5 hover:border-brand-500/30'
      },
      {
        label: 'Register Vendor',
        desc: 'Add new supplier to database',
        icon: <UserPlus className="h-6 w-6 text-indigo-400" />,
        onClick: () => navigate('/vendors'),
        bg: 'hover:bg-indigo-500/5 hover:border-indigo-500/30'
      },
      {
        label: 'View Spending Analytics',
        desc: 'Open financial and vendor metrics',
        icon: <LineChart className="h-6 w-6 text-emerald-400" />,
        onClick: () => navigate('/reports'),
        bg: 'hover:bg-emerald-500/5 hover:border-emerald-500/30'
      }
    ],
    manager: [
      {
        label: 'Review Workflows',
        desc: 'Review quotations awaiting budget approval',
        icon: <CheckSquare className="h-6 w-6 text-emerald-400" />,
        onClick: () => navigate('/approvals'),
        bg: 'hover:bg-emerald-500/5 hover:border-emerald-500/30'
      },
      {
        label: 'Track Purchase Orders',
        desc: 'View active contracts and tax amounts',
        icon: <FileSearch className="h-6 w-6 text-sky-400" />,
        onClick: () => navigate('/purchase-orders'),
        bg: 'hover:bg-sky-500/5 hover:border-sky-500/30'
      },
      {
        label: 'Financial Reports',
        desc: 'View spending breakdowns',
        icon: <LineChart className="h-6 w-6 text-indigo-400" />,
        onClick: () => navigate('/reports'),
        bg: 'hover:bg-indigo-500/5 hover:border-indigo-500/30'
      }
    ],
    admin: [
      {
        label: 'Register Vendor',
        desc: 'Add onboarding supplier profiles',
        icon: <UserPlus className="h-6 w-6 text-purple-400" />,
        onClick: () => navigate('/vendors'),
        bg: 'hover:bg-purple-500/5 hover:border-purple-500/30'
      },
      {
        label: 'System Audit Logs',
        desc: 'Examine complete digital audit trails',
        icon: <FileSpreadsheet className="h-6 w-6 text-indigo-400" />,
        onClick: () => navigate('/activity-logs'),
        bg: 'hover:bg-indigo-500/5 hover:border-indigo-500/30'
      },
      {
        label: 'Enterprise Metrics',
        desc: 'View category spend analytics charts',
        icon: <LineChart className="h-6 w-6 text-emerald-400" />,
        onClick: () => navigate('/reports'),
        bg: 'hover:bg-emerald-500/5 hover:border-emerald-500/30'
      }
    ],
    vendor: [
      {
        label: 'Assigned RFQs',
        desc: 'View and submit quotations for open RFQs',
        icon: <PlusCircle className="h-6 w-6 text-amber-400" />,
        onClick: () => navigate('/my-rfqs'),
        bg: 'hover:bg-amber-500/5 hover:border-amber-500/30'
      }
    ]
  };

  const userActions = actions[user.role] || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {userActions.map((act, index) => (
        <Card
          key={index}
          className={`p-5 flex items-center gap-4 cursor-pointer hover:scale-[1.01] hover:shadow-lg transition-all border-slate-800 bg-slate-900/20 duration-200 ${act.bg}`}
          onClick={act.onClick}
        >
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            {act.icon}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 font-display">{act.label}</h4>
            <p className="text-xs text-slate-500 mt-1">{act.desc}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default QuickActions;
