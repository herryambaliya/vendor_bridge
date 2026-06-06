import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import Sidebar from '../components/layout/Sidebar';
import VendorModal from '../components/vendors/VendorModal';
import { Search, Plus, Star, Eye, SlidersHorizontal, Building2 } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  category: string;
  gstNumber: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  status: 'active' | 'inactive' | 'blacklisted';
  rating: number;
  createdAt: string;
}

const statusLabel: Record<string, string> = {
  active: 'Active',
  inactive: 'Pending',
  blacklisted: 'Blocked',
};

const statusStyle: Record<string, string> = {
  active: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  inactive: 'text-amber-700 bg-amber-50 border-amber-200',
  blacklisted: 'text-rose-700 bg-rose-50 border-rose-200',
};

export const Vendors: React.FC = () => {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);

  const { data: vendors, isLoading, refetch } = useQuery<Vendor[]>({
    queryKey: ['vendors', search, statusFilter],
    queryFn: () => api.vendors.list(search, statusFilter),
  });

  const isEditable = user?.role === 'admin' || user?.role === 'procurement_officer';
  const filteredVendors = vendors ?? [];
  const allCount = filteredVendors.length;
  const activeCount = filteredVendors.filter((v) => v.status === 'active').length;
  const pendingCount = filteredVendors.filter((v) => v.status === 'inactive').length;
  const blockedCount = filteredVendors.filter((v) => v.status === 'blacklisted').length;

  const handleEdit = (id: string) => { setEditingVendorId(id); setIsModalOpen(true); };
  const handleAdd = () => { setEditingVendorId(null); setIsModalOpen(true); };

  const tabCounts = [
    { key: '', label: 'All', count: allCount },
    { key: 'active', label: 'Active', count: activeCount },
    { key: 'inactive', label: 'Pending', count: pendingCount },
    { key: 'blacklisted', label: 'Blocked', count: blockedCount },
  ];

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500" />

        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-7 animate-fade-in-up">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Supplier Registry</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">Vendors</h1>
              <p className="text-sm text-slate-500 mt-1">Manage supplier profiles and registrations</p>
            </div>
            {isEditable && (
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                <Plus className="h-4 w-4" />
                Add Vendor
              </button>
            )}
          </div>

          {/* Search + Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, GST number, category..."
                className="w-full pl-11 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-3 focus:ring-blue-100 transition-all text-sm shadow-sm"
              />
              <button className="absolute right-3 top-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 mb-5">
            {tabCounts.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                  statusFilter === tab.key
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 bg-white'
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${statusFilter === tab.key ? 'bg-white/20' : 'bg-slate-100'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Vendors Table */}
          <div className="liquid-card border border-slate-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                  <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                  Loading vendor registry...
                </div>
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="p-12 text-center">
                <div className="h-14 w-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-slate-700 font-semibold">No vendors found</p>
                <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters</p>
                {isEditable && (
                  <button onClick={handleAdd} className="mt-5 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20">
                    Add First Vendor
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    {['Vendor Name', 'Category', 'GST Number', 'Contact', 'Status', 'Action'].map((h) => (
                      <th key={h} className="px-6 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-blue-50/30 transition-all duration-150 group">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-800">{vendor.name}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs text-slate-400 font-medium">{vendor.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                          {vendor.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-slate-600 font-bold bg-slate-50 px-2 py-1 border border-slate-200 rounded-lg">
                          {vendor.gstNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {vendor.contactPhone || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${statusStyle[vendor.status]}`}>
                          {statusLabel[vendor.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleEdit(vendor.id)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {filteredVendors.length > 0 && (
            <div className="mt-4 text-xs text-slate-400 font-medium">
              Showing <span className="text-slate-600 font-bold">{filteredVendors.length}</span> supplier records
            </div>
          )}
        </div>
      </main>

      <VendorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refetch}
        vendorId={editingVendorId}
      />
    </div>
  );
};

export default Vendors;
