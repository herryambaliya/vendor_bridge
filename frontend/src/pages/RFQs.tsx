import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import Sidebar from '../components/layout/Sidebar';
import { FileText, Plus, Calendar, Users, Eye, Search, X, Upload } from 'lucide-react';

interface RFQ {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'open' | 'closed' | 'cancelled';
  deadline: string;
  createdBy: string;
  createdAt: string;
  assignedVendors: string[];
}

const statusStyle: Record<string, string> = {
  open: 'text-blue-700 bg-blue-50 border-blue-200',
  closed: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  draft: 'text-slate-500 bg-slate-100 border-slate-200',
  cancelled: 'text-rose-700 bg-rose-50 border-rose-200',
};

// Inline Create RFQ Panel shown when officer clicks Create RFQ
const CreateRFQPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [lineItems, setLineItems] = useState([
    { item: 'Ergonomic chair', qty: 25, unit: 'NOS' },
    { item: 'Standing desks', qty: 10, unit: 'NOS' },
  ]);
  const [vendors, setVendors] = useState(['Techcore LTD']);
  const [newVendor, setNewVendor] = useState('');
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('Office Furniture procurement Q2');
  const [category, setCategory] = useState('Furniture');
  const [deadline, setDeadline] = useState('15 June 2025');
  const [description, setDescription] = useState('Ergonomic chairs and standing desks for 3rd floor');

  const addLineItem = () => setLineItems([...lineItems, { item: '', qty: 0, unit: 'NOS' }]);
  const removeLineItem = (i: number) => setLineItems(lineItems.filter((_, idx) => idx !== i));

  const addVendor = () => {
    if (newVendor.trim()) { setVendors([...vendors, newVendor.trim()]); setNewVendor(''); }
  };

  const inputClass = "w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-3 focus:ring-blue-100 transition-all text-sm";

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto">
      {/* Sub header */}
      <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between bg-white shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">Create RFQ</h1>
          <p className="text-sm text-slate-500 mt-0.5">New request for quotation</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Step Progress */}
      <div className="px-8 py-4 border-b border-slate-200 flex items-center gap-3 bg-white">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <button
              onClick={() => setStep(s)}
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${step === s
                  ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-600/30'
                  : step > s
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600'
                    : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}
            >
              {s}
            </button>
            {s < 3 && <div className={`flex-1 h-0.5 rounded-full ${step > s ? 'bg-emerald-500/40' : 'bg-slate-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="p-8 overflow-y-auto">
        <div className="grid grid-cols-2 gap-8">
          {/* Left Column: RFQ Form */}
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">RFQ's title *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
              <input type="text" value={category} onChange={e => setCategory(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Deadline *</label>
              <input type="text" value={deadline} onChange={e => setDeadline(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* Right Column: Line Items + Assign Vendors */}
          <div className="space-y-5">
            {/* Line Items */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Line Items</label>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-150 bg-slate-50/50">
                      {['Item', 'Qty', 'Unit', ''].map((h, i) => (
                        <th key={i} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((li, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2.5 text-sm text-slate-700">{li.item}</td>
                        <td className="px-3 py-2.5 text-sm text-slate-700">{li.qty}</td>
                        <td className="px-3 py-2.5 text-sm text-slate-500">{li.unit}</td>
                        <td className="px-3 py-2.5">
                          <button onClick={() => removeLineItem(i)} className="text-slate-400 hover:text-rose-500 transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={addLineItem} className="w-full py-2.5 text-xs font-bold text-brand-600 hover:text-brand-700 hover:bg-brand-50 transition-colors border-t border-slate-100 flex items-center justify-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> + Add Line Item
                </button>
              </div>
            </div>

            {/* Assign Vendors */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assign Vendors</label>
              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 shadow-sm">
                {vendors.map((v, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-sm text-slate-700">{v}</span>
                    <button
                      onClick={() => setVendors(vendors.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVendor}
                    onChange={e => setNewVendor(e.target.value)}
                    placeholder="+ Add vendor name"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-xs transition-all"
                    onKeyDown={e => e.key === 'Enter' && addVendor()}
                  />
                  <button onClick={addVendor} className="px-3 py-2 bg-brand-600 rounded-lg text-white text-xs font-bold hover:bg-brand-500 transition-colors">
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Action Buttons + Attachments */}
        <div className="grid grid-cols-2 gap-8 mt-8 pt-6 border-t border-slate-200">
          {/* Action Buttons */}
          <div className="space-y-3">
            <button className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0">
              Save & Send to Vendors
            </button>
            <button className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 text-sm font-bold rounded-xl transition-all shadow-sm">
              Save as Draft
            </button>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Attachments</label>
            <div className="h-28 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-brand-500/50 hover:bg-brand-50 transition-all cursor-pointer group">
              <Upload className="h-5 w-5 text-slate-400 group-hover:text-brand-600 transition-colors" />
              <p className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors text-center">
                Drag & drop files or click to upload
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RFQs: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [statusFilter, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data: rfqs, isLoading } = useQuery<RFQ[]>({
    queryKey: ['rfqs', statusFilter],
    queryFn: () => api.rfqs.list(statusFilter)
  });

  const isOfficer = user?.role === 'procurement_officer' || user?.role === 'officer';

  const filteredRfqs = rfqs ? rfqs.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  ) : [];

  const getDeadlineStatus = (deadlineStr: string) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const deadline = new Date(deadlineStr); deadline.setHours(0, 0, 0, 0);
    if (deadline < today) return { label: 'Expired', style: 'text-rose-600' };
    const diffDays = Math.ceil(Math.abs(deadline.getTime() - today.getTime()) / 86400000);
    if (diffDays <= 3) return { label: `Due in ${diffDays}d`, style: 'text-amber-600' };
    return { label: `Due in ${diffDays}d`, style: 'text-slate-400' };
  };

  if (showCreate && isOfficer) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800">
        <Sidebar />
        <CreateRFQPanel onClose={() => setShowCreate(false)} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 font-display">RFQ's</h1>
            <p className="text-sm text-slate-500 mt-1">Create specifications, assign suppliers, and aggregate quotations for comparison.</p>
          </div>
          {isOfficer && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="h-4 w-4" />
              + New RFQ
            </button>
          )}
        </div>

        {/* Search + Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-56 max-w-md">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search RFQs by title..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 transition-all text-sm shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            {[
              { key: '', label: 'All' },
              { key: 'draft', label: 'Draft' },
              { key: 'open', label: 'Open' },
              { key: 'closed', label: 'Closed' },
              { key: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatus(tab.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${statusFilter === tab.key
                    ? 'bg-brand-600 border-brand-500 text-white shadow-md'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800 bg-white shadow-sm'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="ml-auto text-xs text-slate-400 font-semibold">
            Total <span className="text-slate-700">{filteredRfqs.length}</span> Records
          </div>
        </div>

        {/* RFQ Table */}
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading RFQ records...</div>
          ) : filteredRfqs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <FileText className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-slate-600 font-semibold">No RFQ Requests Found</p>
              <p className="text-slate-500 text-sm mt-1">Create your first RFQ to get started</p>
              {isOfficer && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-4 px-5 py-2 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-500 transition-colors shadow-md"
                >
                  Create First RFQ
                </button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  {['RFQ Title', 'Status', 'Deadline', 'Assigned Vendors', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRfqs.map((rfq, i) => {
                  const deadlineInfo = getDeadlineStatus(rfq.deadline);
                  return (
                    <tr
                      key={rfq.id}
                      className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${i === filteredRfqs.length - 1 ? 'border-0' : ''}`}
                    >
                      <td className="px-6 py-4 max-w-xs">
                        <div className="font-bold text-sm text-slate-700 font-display">{rfq.title}</div>
                        <div className="text-xs text-slate-450 mt-0.5 line-clamp-1">{rfq.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${statusStyle[rfq.status]}`}>
                          {rfq.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {rfq.deadline}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 block ${deadlineInfo.style}`}>
                          {deadlineInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Users className="h-4 w-4 text-slate-400" />
                          <span className="font-bold text-slate-700">{rfq.assignedVendors?.length || 0}</span>
                          <span className="text-slate-450">Suppliers</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/rfqs/${rfq.id}`)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-brand-500/50 hover:text-brand-600 hover:bg-brand-50 transition-all shadow-sm"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Review RFQ
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default RFQs;
