import { apiAxios } from './axios';
import { mockDb } from './mockDb';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'; // Default to true unless explicitly false

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // Auth
  auth: {
    login: async (email: string, password_hash: string) => {
      if (USE_MOCK) {
        await delay(500);
        return mockDb.login(email);
      }
      const response = await apiAxios.post('/api/auth/login', { email, password_hash });
      return response.data;
    },
    signup: async (name: string, email: string, role: string) => {
      if (USE_MOCK) {
        await delay(500);
        return mockDb.signup(name, email, role);
      }
      const response = await apiAxios.post('/api/auth/signup', { name, email, role });
      return response.data;
    }
  },

  // Vendors
  vendors: {
    list: async (search = '', status = '') => {
      if (USE_MOCK) {
        await delay(300);
        return mockDb.getVendors(search, status);
      }
      const response = await apiAxios.get('/api/vendors', { params: { search, status } });
      return response.data;
    },
    get: async (id: string) => {
      if (USE_MOCK) {
        await delay(200);
        return mockDb.getVendor(id);
      }
      const response = await apiAxios.get(`/api/vendors/${id}`);
      return response.data;
    },
    create: async (data: any) => {
      if (USE_MOCK) {
        await delay(400);
        return mockDb.createVendor(data);
      }
      const response = await apiAxios.post('/api/vendors', data);
      return response.data;
    },
    update: async (id: string, data: any) => {
      if (USE_MOCK) {
        await delay(400);
        return mockDb.updateVendor(id, data);
      }
      const response = await apiAxios.patch(`/api/vendors/${id}`, data);
      return response.data;
    }
  },

  // RFQs
  rfqs: {
    list: async (status = '') => {
      if (USE_MOCK) {
        await delay(300);
        return mockDb.getRFQs(status);
      }
      const response = await apiAxios.get('/api/rfqs', { params: { status } });
      return response.data;
    },
    get: async (id: string) => {
      if (USE_MOCK) {
        await delay(200);
        return mockDb.getRFQ(id);
      }
      const response = await apiAxios.get(`/api/rfqs/${id}`);
      return response.data;
    },
    create: async (data: any) => {
      if (USE_MOCK) {
        await delay(500);
        return mockDb.createRFQ(data);
      }
      const response = await apiAxios.post('/api/rfqs', data);
      return response.data;
    },
    updateStatus: async (id: string, status: string) => {
      if (USE_MOCK) {
        await delay(300);
        return mockDb.updateRFQStatus(id, status as any);
      }
      const response = await apiAxios.patch(`/api/rfqs/${id}/status`, { status });
      return response.data;
    }
  },

  // Quotations
  quotations: {
    listForRfq: async (rfqId: string) => {
      if (USE_MOCK) {
        await delay(300);
        return mockDb.getQuotations(rfqId);
      }
      const response = await apiAxios.get(`/api/rfqs/${rfqId}/quotations`);
      return response.data;
    },
    submit: async (data: any) => {
      if (USE_MOCK) {
        await delay(500);
        return mockDb.submitQuotation(data);
      }
      const response = await apiAxios.post('/api/quotations', data);
      return response.data;
    },
    updateStatus: async (id: string, status: string) => {
      if (USE_MOCK) {
        await delay(300);
        return mockDb.updateQuotationStatus(id, status as any);
      }
      const response = await apiAxios.patch(`/api/quotations/${id}/status`, { status });
      return response.data;
    }
  },

  // Approvals
  approvals: {
    list: async () => {
      if (USE_MOCK) {
        await delay(300);
        return mockDb.getApprovals();
      }
      const response = await apiAxios.get('/api/approvals');
      return response.data;
    },
    request: async (quotationId: string, officerId: string) => {
      if (USE_MOCK) {
        await delay(400);
        return mockDb.requestApproval(quotationId, officerId);
      }
      const response = await apiAxios.post('/api/approvals', { quotationId, requestedBy: officerId });
      return response.data;
    },
    approve: async (id: string, approverId: string, remarks: string) => {
      if (USE_MOCK) {
        await delay(500);
        return mockDb.approveApproval(id, approverId, remarks);
      }
      const response = await apiAxios.post(`/api/approvals/${id}/approve`, { remarks, approverId });
      return response.data;
    },
    reject: async (id: string, approverId: string, remarks: string) => {
      if (USE_MOCK) {
        await delay(500);
        return mockDb.rejectApproval(id, approverId, remarks);
      }
      const response = await apiAxios.post(`/api/approvals/${id}/reject`, { remarks, approverId });
      return response.data;
    }
  },

  // Purchase Orders
  purchaseOrders: {
    list: async () => {
      if (USE_MOCK) {
        await delay(300);
        return mockDb.getPOs();
      }
      const response = await apiAxios.get('/api/purchase-orders');
      return response.data;
    },
    get: async (id: string) => {
      if (USE_MOCK) {
        await delay(200);
        return mockDb.getPO(id);
      }
      const response = await apiAxios.get(`/api/purchase-orders/${id}`);
      return response.data;
    },
    updateStatus: async (id: string, status: string) => {
      if (USE_MOCK) {
        await delay(300);
        return mockDb.updatePOStatus(id, status as any);
      }
      const response = await apiAxios.patch(`/api/purchase-orders/${id}/status`, { status });
      return response.data;
    }
  },

  // Invoices
  invoices: {
    list: async () => {
      if (USE_MOCK) {
        await delay(300);
        return mockDb.getInvoices();
      }
      const response = await apiAxios.get('/api/invoices');
      return response.data;
    },
    get: async (id: string) => {
      if (USE_MOCK) {
        await delay(200);
        return mockDb.getInvoice(id);
      }
      const response = await apiAxios.get(`/api/invoices/${id}`);
      return response.data;
    },
    create: async (poId: string) => {
      if (USE_MOCK) {
        await delay(400);
        return mockDb.createInvoice(poId);
      }
      const response = await apiAxios.post('/api/invoices', { poId });
      return response.data;
    },
    sendEmail: async (id: string) => {
      if (USE_MOCK) {
        await delay(500);
        return mockDb.sendInvoiceEmail(id);
      }
      const response = await apiAxios.post(`/api/invoices/${id}/send-email`);
      return response.data;
    },
    downloadPdf: async (id: string) => {
      if (USE_MOCK) {
        await delay(400);
        // Simulate a dummy Blob download in mock mode
        const dummyContent = `PDF Stream for Invoice ${id}`;
        return new Blob([dummyContent], { type: 'application/pdf' });
      }
      const response = await apiAxios.get(`/api/invoices/${id}/pdf`, { responseType: 'blob' });
      return new Blob([response.data], { type: 'application/pdf' });
    }
  },

  // Analytics Reports
  reports: {
    dashboardSummary: async () => {
      if (USE_MOCK) {
        await delay(300);
        return mockDb.getDashboardSummary();
      }
      const response = await apiAxios.get('/api/reports/dashboard-summary');
      return response.data;
    },
    monthlySpend: async () => {
      if (USE_MOCK) {
        await delay(300);
        return mockDb.getMonthlySpend();
      }
      const response = await apiAxios.get('/api/reports/monthly-spend');
      return response.data;
    },
    categorySpend: async () => {
      if (USE_MOCK) {
        await delay(300);
        return mockDb.getCategorySpend();
      }
      const response = await apiAxios.get('/api/reports/category-spend');
      return response.data;
    },
    vendorPerformance: async () => {
      if (USE_MOCK) {
        await delay(300);
        return mockDb.getVendorPerformance();
      }
      const response = await apiAxios.get('/api/reports/vendor-performance');
      return response.data;
    }
  },

  // Activity Logs
  activityLogs: {
    list: async (limit = 20) => {
      if (USE_MOCK) {
        await delay(300);
        return mockDb.getActivityLogs(limit);
      }
      const response = await apiAxios.get('/api/activity-logs', { params: { limit } });
      return response.data;
    }
  },

  // AI Services
  ai: {
    recommendVendors: async (category: string) => {
      if (USE_MOCK) {
        await delay(600); // Simulate AI thinking time
        return mockDb.aiRecommendVendors(category);
      }
      const response = await apiAxios.post('/api/ai/recommend-vendors', { category });
      return response.data;
    },
    rankQuotations: async (rfqId: string) => {
      if (USE_MOCK) {
        await delay(800); // Simulate AI thinking time
        return mockDb.aiRankQuotations(rfqId);
      }
      const response = await apiAxios.post('/api/ai/rank-quotations', { rfqId });
      return response.data;
    },
    spendForecast: async (monthlySpend: any[]) => {
      if (USE_MOCK) {
        await delay(600);
        return mockDb.aiSpendForecast(monthlySpend);
      }
      const response = await apiAxios.post('/api/ai/spend-forecast', { monthly_spend: monthlySpend });
      return response.data;
    }
  },

  // Extra helper to reset mock database state (for demo preparation)
  resetMockDb: () => {
    if (USE_MOCK) {
      mockDb.reset();
    }
  }
};

export default api;
