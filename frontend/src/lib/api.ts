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
      const response = await apiAxios.post('/api/auth/login', { email, password: password_hash });
      const data = response.data;
      if (data && data.user) {
        if (data.user.role === 'officer') {
          data.user.role = 'procurement_officer';
        }
      }
      return data;
    },
    signup: async (name: string, email: string, role: string) => {
      if (USE_MOCK) {
        await delay(500);
        return mockDb.signup(name, email, role);
      }
      const apiRole = role === 'procurement_officer' ? 'officer' : role;
      const response = await apiAxios.post('/api/auth/signup', { name, email, role: apiRole });
      const data = response.data;
      if (data && data.user) {
        if (data.user.role === 'officer') {
          data.user.role = 'procurement_officer';
        }
      }
      return data;
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
      const rawList = Array.isArray(response.data) ? response.data : (response.data.data || []);
      return rawList.map((v: any) => ({
        id: v.id,
        name: v.name,
        category: v.category,
        gstNumber: v.gst_number,
        contactName: v.name,
        contactEmail: v.email,
        contactPhone: v.phone,
        address: v.address,
        status: v.status,
        rating: v.rating,
        createdAt: v.created_at,
      }));
    },
    get: async (id: string) => {
      if (USE_MOCK) {
        await delay(200);
        return mockDb.getVendor(id);
      }
      const response = await apiAxios.get(`/api/vendors/${id}`);
      const v = response.data;
      return {
        id: v.id,
        name: v.name,
        category: v.category,
        gstNumber: v.gst_number,
        contactName: v.name,
        contactEmail: v.email,
        contactPhone: v.phone,
        address: v.address,
        status: v.status,
        rating: v.rating,
        createdAt: v.created_at,
      };
    },
    create: async (data: any) => {
      if (USE_MOCK) {
        await delay(400);
        return mockDb.createVendor(data);
      }
      const payload = {
        name: data.name,
        category: data.category,
        gst_number: data.gstNumber,
        email: data.contactEmail,
        phone: data.contactPhone,
        address: data.address,
      };
      const response = await apiAxios.post('/api/vendors', payload);
      return response.data;
    },
    update: async (id: string, data: any) => {
      if (USE_MOCK) {
        await delay(400);
        return mockDb.updateVendor(id, data);
      }
      const payload = {
        name: data.name,
        category: data.category,
        gst_number: data.gstNumber,
        email: data.contactEmail,
        phone: data.contactPhone,
        address: data.address,
        status: data.status,
        rating: data.rating,
      };
      const response = await apiAxios.patch(`/api/vendors/${id}`, payload);
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
      return response.data.map((r: any) => {
        const totalQty = (r.rfq_items || []).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
        return {
          id: r.id,
          title: r.title,
          description: r.description,
          status: r.status,
          deadline: r.deadline ? new Date(r.deadline).toISOString().split('T')[0] : '',
          createdBy: r.created_by,
          createdAt: r.created_at,
          assignedVendors: (r.rfq_vendors || []).map((rv: any) => rv.vendor_id),
          items: (r.rfq_items || []).map((item: any) => ({
            id: item.id,
            productName: item.product_name,
            quantity: item.quantity,
            unit: item.unit,
            estimatedPrice: item.estimated_price,
          })),
          quotations: (r.quotations || []).map((q: any) => ({
            id: q.id,
            rfqId: q.rfq_id,
            vendorId: q.vendor_id,
            unitPrice: q.unit_price,
            totalPrice: q.total_price || (q.unit_price * totalQty),
            deliveryDays: q.delivery_days,
            notes: q.notes,
            status: q.status,
            submittedAt: q.created_at,
          })),
        };
      });
    },
    get: async (id: string) => {
      if (USE_MOCK) {
        await delay(200);
        return mockDb.getRFQ(id);
      }
      const response = await apiAxios.get(`/api/rfqs/${id}`);
      const rfq = response.data;
      
      const totalQty = (rfq.rfq_items || []).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

      return {
        id: rfq.id,
        title: rfq.title,
        description: rfq.description,
        status: rfq.status,
        deadline: rfq.deadline ? new Date(rfq.deadline).toISOString().split('T')[0] : '',
        createdBy: rfq.created_by,
        createdAt: rfq.created_at,
        items: (rfq.rfq_items || []).map((item: any) => ({
          id: item.id,
          productName: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          estimatedPrice: item.estimated_price,
        })),
        assignedVendors: (rfq.rfq_vendors || []).map((rv: any) => rv.vendor_id),
        quotations: (rfq.quotations || []).map((q: any) => ({
          id: q.id,
          rfqId: q.rfq_id,
          vendorId: q.vendor_id,
          unitPrice: q.unit_price,
          totalPrice: q.total_price || (q.unit_price * totalQty),
          deliveryDays: q.delivery_days,
          notes: q.notes,
          status: q.status,
          submittedAt: q.created_at || q.submittedAt,
        })),
      };
    },
    create: async (data: any) => {
      if (USE_MOCK) {
        await delay(500);
        return mockDb.createRFQ(data);
      }
      
      const payload = {
        title: data.title,
        description: data.description,
        deadline: new Date(data.deadline).toISOString(),
        vendor_ids: data.assignedVendors || [],
        items: (data.items || []).map((item: any) => ({
          product_name: item.productName || 'Unknown Item',
          quantity: Number(item.quantity) || 1,
          unit: item.unit || 'pcs',
          estimated_price: Number(item.estimatedPrice || item.estimated_price || 1.0)
        }))
      };

      const response = await apiAxios.post('/api/rfqs', payload);
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
      return response.data.map((q: any) => {
        const totalQty = (q.rfq?.rfq_items || []).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
        return {
          id: q.id,
          rfqId: q.rfq_id,
          vendorId: q.vendor_id,
          unitPrice: q.unit_price,
          totalPrice: q.total_price || (q.unit_price * totalQty),
          deliveryDays: q.delivery_days,
          notes: q.notes,
          status: q.status,
          submittedAt: q.created_at,
        };
      });
    },
    submit: async (data: any) => {
      if (USE_MOCK) {
        await delay(500);
        return mockDb.submitQuotation(data);
      }
      const payload = {
        rfq_id: data.rfqId || data.rfq_id,
        unit_price: Number(data.unitPrice || data.unit_price || 0),
        delivery_days: Number(data.deliveryDays || data.delivery_days || 0),
        notes: data.notes,
      };
      const response = await apiAxios.post('/api/quotations', payload);
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
      const rawList = Array.isArray(response.data) ? response.data : (response.data.data || []);
      return rawList.map((app: any) => {
        const rfqItems = app.quotation?.rfq?.rfq_items || [];
        const totalQty = rfqItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
        const subtotal = app.quotation?.unit_price ? (app.quotation.unit_price * totalQty) : 0;
        const totalAmount = subtotal * 1.18; // Add 18% tax
        
        return {
          id: app.id,
          quotationId: app.quotation_id,
          requestedBy: app.requested_by,
          approverId: app.approver_id,
          status: app.status,
          remarks: app.remarks,
          createdAt: app.created_at,
          vendorName: app.quotation?.vendor?.name || 'Unknown Vendor',
          rfqTitle: app.quotation?.rfq?.title || 'Contract Purchase',
          totalAmount: totalAmount || app.quotation?.total_price || 0,
          requestedByName: app.requester?.name || 'Procurement Officer',
          rfqId: app.quotation?.rfq?.id,
          vendorId: app.quotation?.vendor?.id,
        };
      });
    },
    request: async (quotationId: string, officerId: string) => {
      if (USE_MOCK) {
        await delay(400);
        return mockDb.requestApproval(quotationId, officerId);
      }
      const response = await apiAxios.post('/api/approvals', { quotation_id: quotationId });
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
      return response.data.map((po: any) => ({
        id: po.id,
        poNumber: po.po_number,
        quotationId: po.quotation_id,
        vendorId: po.vendor_id,
        subtotal: po.subtotal,
        taxPercent: po.tax_percent,
        taxAmount: po.tax_amount,
        totalAmount: po.total_amount,
        status: po.status,
        issuedAt: po.issued_at,
        vendorName: po.vendor?.name || 'Unknown',
        rfqTitle: po.quotation?.rfq?.title || 'Contract Purchase',
      }));
    },
    get: async (id: string) => {
      if (USE_MOCK) {
        await delay(200);
        return mockDb.getPO(id);
      }
      const response = await apiAxios.get(`/api/purchase-orders/${id}`);
      const po = response.data;
      return {
        id: po.id,
        poNumber: po.po_number,
        quotationId: po.quotation_id,
        vendorId: po.vendor_id,
        subtotal: po.subtotal,
        taxPercent: po.tax_percent,
        taxAmount: po.tax_amount,
        totalAmount: po.total_amount,
        status: po.status,
        issuedAt: po.issued_at,
        vendor: po.vendor ? {
          id: po.vendor.id,
          name: po.vendor.name,
          category: po.vendor.category,
          gstNumber: po.vendor.gst_number,
          contactName: po.vendor.name,
          contactEmail: po.vendor.email,
          contactPhone: po.vendor.phone,
          address: po.vendor.address,
        } : undefined,
        rfq: po.quotation?.rfq ? {
          id: po.quotation.rfq.id,
          title: po.quotation.rfq.title,
          description: po.quotation.rfq.description,
          items: (po.quotation.rfq.rfq_items || []).map((item: any) => ({
            id: item.id,
            productName: item.product_name,
            quantity: item.quantity,
            unit: item.unit,
          })),
        } : undefined,
      };
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
      return response.data.map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        poId: inv.po_id,
        issuedDate: inv.issued_date ? new Date(inv.issued_date).toISOString().split('T')[0] : '',
        dueDate: inv.due_date ? new Date(inv.due_date).toISOString().split('T')[0] : '',
        status: inv.status,
        pdfUrl: inv.pdf_url,
        emailedAt: inv.emailed_at,
        createdAt: inv.created_at,
        poNumber: inv.purchase_order?.po_number || 'Unknown',
        vendorName: inv.vendor?.name || 'Unknown',
        totalAmount: inv.purchase_order?.total_amount || 0,
      }));
    },
    get: async (id: string) => {
      if (USE_MOCK) {
        await delay(200);
        return mockDb.getInvoice(id);
      }
      const response = await apiAxios.get(`/api/invoices/${id}`);
      const inv = response.data;
      return {
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        poId: inv.po_id,
        issuedDate: inv.issued_date ? new Date(inv.issued_date).toISOString().split('T')[0] : '',
        dueDate: inv.due_date ? new Date(inv.due_date).toISOString().split('T')[0] : '',
        status: inv.status,
        pdfUrl: inv.pdf_url,
        emailedAt: inv.emailed_at,
        createdAt: inv.created_at,
        po: inv.purchase_order ? {
          id: inv.purchase_order.id,
          poNumber: inv.purchase_order.po_number,
          subtotal: inv.purchase_order.subtotal,
          taxPercent: inv.purchase_order.tax_percent,
          taxAmount: inv.purchase_order.tax_amount,
          totalAmount: inv.purchase_order.total_amount,
          vendor: inv.vendor ? {
            id: inv.vendor.id,
            name: inv.vendor.name,
            category: inv.vendor.category,
            gstNumber: inv.vendor.gst_number,
            contactName: inv.vendor.name,
            contactEmail: inv.vendor.email,
            contactPhone: inv.vendor.phone,
            address: inv.vendor.address,
          } : undefined,
          rfq: inv.purchase_order.quotation?.rfq ? {
            id: inv.purchase_order.quotation.rfq.id,
            title: inv.purchase_order.quotation.rfq.title,
            items: (inv.purchase_order.quotation.rfq.rfq_items || []).map((item: any) => ({
              id: item.id,
              productName: item.product_name,
              quantity: item.quantity,
              unit: item.unit,
            })),
          } : undefined,
        } : undefined,
      };
    },
    create: async (poId: string) => {
      if (USE_MOCK) {
        await delay(400);
        return mockDb.createInvoice(poId);
      }
      const response = await apiAxios.post('/api/invoices', { po_id: poId });
      const inv = response.data;
      return {
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        poId: inv.po_id,
        issuedDate: inv.issued_date,
        dueDate: inv.due_date,
        status: inv.status,
      };
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
      const data = response.data;
      return {
        pendingApprovals: data.pending_approvals ?? 0,
        activeRFQs: data.active_rfqs ?? 0,
        posThisMonth: data.pos_this_month ?? 0,
        totalSpend: data.spend_this_month ?? 0,
      };
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
