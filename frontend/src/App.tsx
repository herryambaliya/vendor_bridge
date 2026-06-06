import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/layout/PrivateRoute';
import ToastContainer from './components/ui/Toast';


import Quotations from './pages/Quotations';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';

// Protected Pages
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import RFQs from './pages/RFQs';
import RFQCreate from './pages/RFQCreate';
import RFQDetail from './pages/RFQDetail';
import MyRFQs from './pages/MyRFQs';
import QuotationComparison from './pages/QuotationComparison';
import Approvals from './pages/Approvals';
import PurchaseOrders from './pages/PurchaseOrders';
import PODetail from './pages/PODetail';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import ActivityLogs from './pages/ActivityLogs';
import Reports from './pages/Reports';
import Card from './components/ui/Card';
import Button from './components/ui/Button';

// Unauthorized fallback view
const Unauthorized: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #f0f9ff 50%, #f0fdf4 100%)' }}>
      <Card variant="glass" className="p-8 text-center max-w-md w-full space-y-4" style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.85)', borderRadius: '1.5rem', boxShadow: '0 20px 60px rgba(100,116,139,0.14)' }}>
        <h2 className="text-xl font-bold text-rose-500 font-display">Access Denied</h2>
        <p className="text-sm text-slate-500">
          Your active user role permissions do not authorize access to this procurement route.
        </p>
        <div className="pt-2">
          <Button variant="outline" onClick={() => window.history.back()} className="text-xs">
            Return to Safety
          </Button>
        </div>
      </Card>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      {/* Toast Alert Notifications Container */}
      <ToastContainer />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Common Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/rfqs/:id" element={<RFQDetail />} />
          <Route path="/quotations" element={<Quotations />} />
        </Route>

        {/* Procurement Officer / Manager / Admin Authorized Routes */}
        <Route element={<PrivateRoute allowedRoles={['procurement_officer', 'manager', 'admin']} />}>
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/rfqs" element={<RFQs />} />
          <Route path="/rfqs/:id/compare" element={<QuotationComparison />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/purchase-orders/:id" element={<PODetail />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/activity-logs" element={<ActivityLogs />} />
          <Route path="/reports" element={<Reports />} />
        </Route>

        {/* Procurement Officer Only Routes */}
        <Route element={<PrivateRoute allowedRoles={['procurement_officer']} />}>
          <Route path="/rfqs/new" element={<RFQCreate />} />
        </Route>

        {/* Approving Manager / Procurement Officer / Admin Routes */}
        <Route element={<PrivateRoute allowedRoles={['manager', 'procurement_officer', 'admin']} />}>
          <Route path="/approvals" element={<Approvals />} />
        </Route>

        {/* Vendor Only Routes */}
        <Route element={<PrivateRoute allowedRoles={['vendor']} />}>
          <Route path="/my-rfqs" element={<MyRFQs />} />
        </Route>

        {/* Fallback routing */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
