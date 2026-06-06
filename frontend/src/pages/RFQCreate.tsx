import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import Sidebar from '../components/layout/Sidebar';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { showToast } from '../components/ui/Toast';
import { Plus, Trash2, Sparkles, AlertCircle, Calendar, Layers, ShieldCheck } from 'lucide-react';
import Spinner from '../components/ui/Spinner';

interface LineItemInput {
  productName: string;
  quantity: number;
  unit: string;
}

interface RecommendedVendor {
  vendorId: string;
  vendorName: string;
  score: number;
  rank: number;
  reason: string;
}

interface VendorOption {
  id: string;
  name: string;
  category: string;
  rating: number;
  status: string;
}

export const RFQCreate: React.FC = () => {
  const navigate = useNavigate();

  // Basic fields state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('IT');

  // Dynamic Line Items state
  const [items, setItems] = useState<LineItemInput[]>([
    { productName: '', quantity: 1, unit: 'pcs' }
  ]);

  // AI recommendations state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendedVendor[]>([]);

  // Assigned vendors state (selected IDs)
  const [assignedVendors, setAssignedVendors] = useState<string[]>([]);

  // Fetch all active vendors for manual selection fallback
  const { data: allVendors } = useQuery<VendorOption[]>({
    queryKey: ['vendors-options'],
    queryFn: () => api.vendors.list('', 'active')
  });

  // Filter manual options by selected category
  const filteredVendors = allVendors ? allVendors.filter(v => v.category === category) : [];

  // Reset recommendations when category changes
  useEffect(() => {
    setRecommendations([]);
    setAssignedVendors([]);
  }, [category]);

  const handleAddItem = () => {
    setItems([...items, { productName: '', quantity: 1, unit: 'pcs' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof LineItemInput, val: any) => {
    const updated = [...items];
    if (field === 'quantity') {
      updated[index][field] = parseInt(val) || 0;
    } else {
      updated[index][field] = val;
    }
    setItems(updated);
  };

  // Run AI Recommender
  const handleAiSuggest = async () => {
    setIsAiLoading(true);
    try {
      const results = await api.ai.recommendVendors(category);
      setRecommendations(results);

      // Auto-invite top 2 vendors by default
      const topIds = results.slice(0, 2).map((r: any) => r.vendorId);
      setAssignedVendors(topIds);

      showToast.success(`AI suggested ${results.length} vendors based on criteria!`);
    } catch (err: any) {
      showToast.error('AI Suggestion microservice failed. Falling back to local scoring.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleToggleVendor = (id: string) => {
    if (assignedVendors.includes(id)) {
      setAssignedVendors(assignedVendors.filter(vId => vId !== id));
    } else {
      setAssignedVendors([...assignedVendors, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast.error('Please enter an RFQ Title');
      return;
    }
    if (!deadline) {
      showToast.error('Please select a Deadline');
      return;
    }

    // Validate line items
    const invalidItem = items.some(item => !item.productName.trim() || item.quantity <= 0);
    if (invalidItem) {
      showToast.error('Please ensure all line items have a name and quantity');
      return;
    }

    if (assignedVendors.length === 0) {
      showToast.error('Please assign at least one vendor to this RFQ');
      return;
    }

    const payload = {
      title,
      description,
      deadline,
      items,
      assignedVendors
    };

    try {
      await api.rfqs.create(payload);
      showToast.success('RFQ published successfully! Invited vendors notified.');
      navigate('/rfqs');
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to create RFQ');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 font-display">
              Create Request for Quotation
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Issue procurement specifications and assign bidders.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/rfqs')}>
            Back to RFQs
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
          {/* Section 1: Specifications */}
          <Card className="p-6 border-slate-200 bg-white shadow-sm space-y-6">
            <h3 className="text-md font-bold text-slate-700 flex items-center gap-2 font-display">
              <Layers className="h-5 w-5 text-brand-500" />
              RFQ Specifications & Target Timeline
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-650">RFQ Title / Subject</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Office Chairs Upgrade Q3"
                  className="mt-1.5 w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-sm"
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-semibold text-slate-650">Target Submission Deadline</label>
                <div className="mt-1.5 relative">
                  <input
                    type="date"
                    value={deadline}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-brand-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-650">RFQ Description / Instructions</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Detail technical requirements, warranty expectations, and delivery address terms..."
                className="mt-1.5 w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-sm"
              />
            </div>

            {/* Procurement Category */}
            <div>
              <label className="block text-sm font-semibold text-slate-650">Procurement Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 max-w-xs w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-brand-500 text-sm"
              >
                <option value="IT">IT & Electronics</option>
                <option value="Furniture">Furniture & Fittings</option>
                <option value="Logistics">Logistics & Transports</option>
                <option value="Stationery">Office Stationery</option>
              </select>
            </div>
          </Card>

          {/* Section 2: Line Items */}
          <Card className="p-6 border-slate-200 bg-white shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-bold text-slate-700 flex items-center gap-2 font-display">
                <Calendar className="h-5 w-5 text-sky-500" />
                Material/Service Line Items
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="flex items-center gap-1 text-xs">
                <Plus className="h-3 w-3" /> Add Item Row
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {/* Item Index */}
                  <span className="text-xs font-semibold text-slate-400 font-mono w-6">#{index + 1}</span>

                  {/* Product Name */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                      placeholder="e.g. Ergonomic Office Chair"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 text-sm"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="w-28">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-brand-500 text-sm text-center"
                    />
                  </div>

                  {/* Unit */}
                  <div className="w-28">
                    <select
                      value={item.unit}
                      onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-brand-500 text-sm"
                    >
                      <option value="pcs">Pieces (pcs)</option>
                      <option value="kg">Kilogram (kg)</option>
                      <option value="litre">Litre (ltr)</option>
                      <option value="hours">Hours (hrs)</option>
                      <option value="box">Boxes (box)</option>
                    </select>
                  </div>

                  {/* Trash Action */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                    className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Section 3: Vendor Assignments */}
          <Card className="p-6 border-slate-200 bg-white shadow-sm space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="text-md font-bold text-slate-700 flex items-center gap-2 font-display">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  Invite Vendor Bidders
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Assign which qualified suppliers will bid on this specification.</p>
              </div>

              {/* AI Suggest trigger */}
              <Button
                type="button"
                variant="success"
                size="sm"
                onClick={handleAiSuggest}
                disabled={isAiLoading}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
                AI Suggest Vendors
              </Button>
            </div>

            {/* AI Results */}
            {isAiLoading ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-xl">
                <Spinner size="sm" className="mb-2" />
                <span className="text-xs text-slate-500">Evaluating database supplier matrices...</span>
              </div>
            ) : recommendations.length > 0 ? (
              <div className="space-y-4">
                <div className="p-3 bg-brand-50 border border-brand-100 rounded-lg flex items-center gap-2.5 text-xs text-brand-700 font-medium">
                  <Sparkles className="h-4 w-4 text-brand-600" />
                  AI analyzed category rankings and pre-selected the top candidates.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.map((rec) => {
                    const isSelected = assignedVendors.includes(rec.vendorId);
                    const isTop = rec.rank === 1;

                    return (
                      <Card
                        key={rec.vendorId}
                        variant="glass"
                        className={`p-4 border-slate-200 cursor-pointer flex justify-between items-start transition-all relative ${isSelected ? 'border-brand-600/30 bg-brand-50' : ''
                          }`}
                        onClick={() => handleToggleVendor(rec.vendorId)}
                      >
                        <div className="flex gap-3 items-start pr-12">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => { }} // handled by click Card
                            className="mt-1 h-4 w-4 rounded border-slate-350 bg-white text-brand-600 focus:ring-brand-500"
                          />
                          <div>
                            <div className="font-bold text-sm text-slate-700 flex items-center gap-1.5 font-display">
                              {rec.vendorName}
                              {isTop && (
                                <span className="px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-700 text-[9px] uppercase font-bold border border-yellow-250">
                                  Top Match
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2 font-sans">{rec.reason}</p>
                          </div>
                        </div>

                        {/* Fit Score Circular Telemetry */}
                        <div className="flex flex-col items-center shrink-0">
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold font-display">Score</span>
                          <span className={`text-sm font-extrabold mt-0.5 ${rec.score >= 80 ? 'text-emerald-600' : rec.score >= 60 ? 'text-amber-600' : 'text-slate-500'
                            }`}>
                            {rec.score}%
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Manual Checklist Fallback */
              <div className="space-y-4">
                {filteredVendors.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
                    <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <h4 className="text-sm font-semibold text-slate-700">No active vendors in category "{category}"</h4>
                    <p className="text-xs text-slate-500 mt-1">Please add active vendors to this category in the Vendor Registry first.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {filteredVendors.map((vendor) => {
                      const isSelected = assignedVendors.includes(vendor.id);
                      return (
                        <div
                          key={vendor.id}
                          onClick={() => handleToggleVendor(vendor.id)}
                          className={`p-3 border rounded-xl cursor-pointer flex items-center gap-3 transition-colors ${isSelected ? 'border-brand-600/30 bg-brand-50 text-slate-700' : 'border-slate-200 text-slate-650 hover:text-slate-800 hover:border-slate-300 bg-white'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => { }} // click handler on div handles it
                            className="h-4 w-4 rounded border-slate-300 bg-white text-brand-600 focus:ring-brand-500 cursor-pointer"
                          />
                          <div className="truncate">
                            <p className="text-xs font-bold font-display truncate">{vendor.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Rating: ★ {vendor.rating.toFixed(1)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/rfqs')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="px-8"
              disabled={assignedVendors.length === 0}
            >
              Publish & Invite Bidders
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default RFQCreate;
