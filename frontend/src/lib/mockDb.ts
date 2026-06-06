// Stateful mock database using localStorage

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'procurement_officer' | 'manager' | 'vendor';
  vendorId?: string; // If role is vendor, link to their vendor profile
  createdAt: string;
}

export interface MockVendor {
  id: string;
  name: string;
  category: 'IT' | 'Furniture' | 'Logistics' | 'Stationery' | string;
  gstNumber: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  status: 'active' | 'inactive' | 'blacklisted';
  rating: number; // 0 - 5
  createdAt: string;
  // Metadata for AI scoring
  avgPrice: number; // Avg cost relative to standard
  avgDeliveryDays: number;
  totalPOs: number;
}

export interface MockRFQItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
}

export interface MockRFQ {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'open' | 'closed' | 'cancelled';
  deadline: string;
  createdBy: string; // User ID
  createdAt: string;
  items: MockRFQItem[];
  assignedVendors: string[]; // Vendor IDs
}

export interface MockQuotation {
  id: string;
  rfqId: string;
  vendorId: string;
  unitPrice: number;
  totalPrice: number;
  deliveryDays: number;
  notes: string;
  status: 'submitted' | 'shortlisted' | 'rejected' | 'accepted';
  submittedAt: string;
  badge?: string; // AI badges like "Best Price", "Fastest", etc.
  totalScore?: number; // AI score
}

export interface MockApproval {
  id: string;
  quotationId: string;
  requestedBy: string; // User ID (officer)
  approverId?: string; // User ID (manager)
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string;
  actionedAt?: string;
  createdAt: string;
}

export interface MockPO {
  id: string;
  poNumber: string; // PO-2026-00001
  quotationId: string;
  vendorId: string;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  status: 'issued' | 'acknowledged' | 'delivered' | 'cancelled';
  issuedAt: string;
}

export interface MockInvoice {
  id: string;
  invoiceNumber: string; // INV-2026-00001
  poId: string;
  issuedDate: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  pdfUrl?: string;
  emailedAt?: string;
  createdAt: string;
}

export interface MockActivityLog {
  id: string;
  userId: string;
  userName: string;
  entityType: 'rfq' | 'quotation' | 'approval' | 'po' | 'invoice' | 'vendor';
  entityId: string;
  action: string;
  metadata?: any;
  createdAt: string;
}

// Initial seed data
const SEED_USERS: MockUser[] = [
  { id: 'usr-admin', name: 'Admin User', email: 'admin@vb.com', role: 'admin', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'usr-officer', name: 'Officer John', email: 'officer@vb.com', role: 'procurement_officer', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'usr-manager', name: 'Manager Sarah', email: 'manager@vb.com', role: 'manager', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'usr-vendor-1', name: 'FurniCo Agent', email: 'vendor@furnico.com', role: 'vendor', vendorId: 'ven-furnico', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'usr-vendor-2', name: 'ByteCraft Sales', email: 'sales@bytecraft.com', role: 'vendor', vendorId: 'ven-bytecraft', createdAt: '2026-01-01T00:00:00Z' }
];

const SEED_VENDORS: MockVendor[] = [
  { id: 'ven-bytecraft', name: 'ByteCraft Solutions', category: 'IT', gstNumber: '29ABCDE1234F1Z5', contactName: 'Rajesh Kumar', contactEmail: 'sales@bytecraft.com', contactPhone: '+91 98765 43210', address: '12th Cross, Tech Park, Bangalore', status: 'active', rating: 4.8, createdAt: '2026-01-05T10:00:00Z', avgPrice: 8500, avgDeliveryDays: 5, totalPOs: 12 },
  { id: 'ven-techcore', name: 'TechCore Systems', category: 'IT', gstNumber: '29FGHIJ5678K2Z6', contactName: 'Anjali Sharma', contactEmail: 'info@techcore.com', contactPhone: '+91 98765 00112', address: 'Electronic City Phase 1, Bangalore', status: 'active', rating: 4.2, createdAt: '2026-01-06T11:00:00Z', avgPrice: 9000, avgDeliveryDays: 7, totalPOs: 8 },
  { id: 'ven-furnico', name: 'FurniCo', category: 'Furniture', gstNumber: '27ABCDE1234F1Z5', contactName: 'David Miller', contactEmail: 'vendor@furnico.com', contactPhone: '+91 91234 56789', address: 'Industrial Area Phase 2, Pune', status: 'active', rating: 4.7, createdAt: '2026-01-10T09:00:00Z', avgPrice: 4200, avgDeliveryDays: 10, totalPOs: 22 },
  { id: 'ven-officeworld', name: 'OfficeWorld', category: 'Furniture', gstNumber: '27OPQRS9876M3Z8', contactName: 'Nisha Patil', contactEmail: 'orders@officeworld.com', contactPhone: '+91 92233 44556', address: 'MG Road, Pune', status: 'active', rating: 4.5, createdAt: '2026-01-12T14:30:00Z', avgPrice: 4500, avgDeliveryDays: 8, totalPOs: 15 },
  { id: 'ven-deskmart', name: 'DeskMart', category: 'Furniture', gstNumber: '27TUVWX4321N4Z9', contactName: 'Rohit Deshmukh', contactEmail: 'support@deskmart.com', contactPhone: '+91 93344 55667', address: 'Chinchwad, Pune', status: 'active', rating: 3.9, createdAt: '2026-01-15T10:15:00Z', avgPrice: 3800, avgDeliveryDays: 14, totalPOs: 5 },
  { id: 'ven-fastcargo', name: 'FastCargo', category: 'Logistics', gstNumber: '19XYZAB8765D5Z0', contactName: 'Vikram Singh', contactEmail: 'logistics@fastcargo.com', contactPhone: '+91 94455 66778', address: 'Salt Lake Sector 5, Kolkata', status: 'active', rating: 4.6, createdAt: '2026-01-20T16:00:00Z', avgPrice: 1500, avgDeliveryDays: 3, totalPOs: 30 },
  { id: 'ven-safetrans', name: 'SafeTrans Logistics', category: 'Logistics', gstNumber: '19CDEFG4321H6Z1', contactName: 'Rahul Sen', contactEmail: 'dispatch@safetrans.com', contactPhone: '+91 95566 77889', address: 'Howrah, West Bengal', status: 'active', rating: 4.1, createdAt: '2026-01-22T12:00:00Z', avgPrice: 1300, avgDeliveryDays: 5, totalPOs: 18 },
  { id: 'ven-writestyle', name: 'WriteStyle Stationers', category: 'Stationery', gstNumber: '07ABCDE4321F1Z9', contactName: 'Amit Verma', contactEmail: 'sales@writestyle.com', contactPhone: '+91 96677 88990', address: 'Connaught Place, New Delhi', status: 'active', rating: 4.4, createdAt: '2026-01-25T09:30:00Z', avgPrice: 120, avgDeliveryDays: 2, totalPOs: 40 }
];

const SEED_RFQS: MockRFQ[] = [
  {
    id: 'rfq-1',
    title: 'Office Chairs Upgrade Q3',
    description: 'Procurement of ergonomic mesh office chairs for new employees in the Pune headquarters.',
    status: 'open',
    deadline: '2026-06-25',
    createdBy: 'usr-officer',
    createdAt: '2026-06-01T10:00:00Z',
    items: [
      { id: 'item-1-1', productName: 'Ergonomic Mesh Chair (High Back)', quantity: 50, unit: 'pcs' },
      { id: 'item-1-2', productName: 'Standing Desk Converter', quantity: 15, unit: 'pcs' }
    ],
    assignedVendors: ['ven-furnico', 'ven-officeworld', 'ven-deskmart']
  },
  {
    id: 'rfq-2',
    title: 'Developer Laptops Batch B',
    description: 'High-performance laptops for engineering teams. Requires i7/32GB RAM/1TB SSD.',
    status: 'closed',
    deadline: '2026-06-05',
    createdBy: 'usr-officer',
    createdAt: '2026-05-20T09:00:00Z',
    items: [
      { id: 'item-2-1', productName: 'Developer Laptop 16" (32GB RAM)', quantity: 10, unit: 'pcs' }
    ],
    assignedVendors: ['ven-bytecraft', 'ven-techcore']
  },
  {
    id: 'rfq-3',
    title: 'Stationery & Printing Paper Supplies',
    description: 'Bulk order of A4 printer papers and basic office stationary items.',
    status: 'draft',
    deadline: '2026-06-30',
    createdBy: 'usr-officer',
    createdAt: '2026-06-05T15:30:00Z',
    items: [
      { id: 'item-3-1', productName: 'A4 Copier Paper Ream (75 GSM)', quantity: 100, unit: 'pcs' },
      { id: 'item-3-2', productName: 'Whiteboard Marker Pens (Black)', quantity: 50, unit: 'pcs' }
    ],
    assignedVendors: []
  }
];

const SEED_QUOTATIONS: MockQuotation[] = [
  {
    id: 'q-2-1',
    rfqId: 'rfq-2',
    vendorId: 'ven-bytecraft',
    unitPrice: 85000,
    totalPrice: 850000,
    deliveryDays: 5,
    notes: 'In-stock. Ready to deliver. Price includes 1 year warranty.',
    status: 'accepted',
    submittedAt: '2026-05-22T11:00:00Z',
    badge: 'Best Overall ⭐',
    totalScore: 92
  },
  {
    id: 'q-2-2',
    rfqId: 'rfq-2',
    vendorId: 'ven-techcore',
    unitPrice: 88000,
    totalPrice: 880000,
    deliveryDays: 4,
    notes: 'Fast delivery from local warehouse. Optional extended warranty available.',
    status: 'rejected',
    submittedAt: '2026-05-23T14:00:00Z',
    badge: 'Fastest 🚀',
    totalScore: 84
  },
  {
    id: 'q-1-1',
    rfqId: 'rfq-1',
    vendorId: 'ven-deskmart',
    unitPrice: 3800,
    totalPrice: 247000, // (3800 * 50) + converter price calculated
    deliveryDays: 12,
    notes: 'Competitive pricing for bulk order of basic mesh chairs. Custom desk heights.',
    status: 'submitted',
    submittedAt: '2026-06-03T10:15:00Z'
  },
  {
    id: 'q-1-2',
    rfqId: 'rfq-1',
    vendorId: 'ven-officeworld',
    unitPrice: 4500,
    totalPrice: 292500,
    deliveryDays: 7,
    notes: 'Premium commercial ergonomic chairs. Quick delivery. 3 year replacement warranty.',
    status: 'submitted',
    submittedAt: '2026-06-04T12:30:00Z'
  }
];

const SEED_APPROVALS: MockApproval[] = [
  {
    id: 'app-1',
    quotationId: 'q-2-1',
    requestedBy: 'usr-officer',
    approverId: 'usr-manager',
    status: 'approved',
    remarks: 'Pricing is within department budget. ByteCraft has excellent history. Approved.',
    actionedAt: '2026-05-25T10:00:00Z',
    createdAt: '2026-05-24T16:00:00Z'
  }
];

const SEED_POS: MockPO[] = [
  {
    id: 'po-1',
    poNumber: 'PO-2026-00001',
    quotationId: 'q-2-1',
    vendorId: 'ven-bytecraft',
    subtotal: 850000,
    taxPercent: 18,
    taxAmount: 153000,
    totalAmount: 1003000,
    status: 'issued',
    issuedAt: '2026-05-25T10:05:00Z'
  }
];

const SEED_INVOICES: MockInvoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-00001',
    poId: 'po-1',
    issuedDate: '2026-05-26',
    dueDate: '2026-06-25',
    status: 'sent',
    pdfUrl: '#',
    emailedAt: '2026-05-26T14:30:00Z',
    createdAt: '2026-05-26T14:25:00Z'
  }
];

const SEED_ACTIVITY_LOGS: MockActivityLog[] = [
  { id: 'log-1', userId: 'usr-officer', userName: 'Officer John', entityType: 'rfq', entityId: 'rfq-2', action: 'created', metadata: { title: 'Developer Laptops Batch B' }, createdAt: '2026-05-20T09:00:00Z' },
  { id: 'log-2', userId: 'usr-vendor-2', userName: 'ByteCraft Sales', entityType: 'quotation', entityId: 'q-2-1', action: 'submitted', metadata: { amount: 850000 }, createdAt: '2026-05-22T11:00:00Z' },
  { id: 'log-3', userId: 'usr-officer', userName: 'Officer John', entityType: 'quotation', entityId: 'q-2-1', action: 'shortlisted', metadata: {}, createdAt: '2026-05-24T15:00:00Z' },
  { id: 'log-4', userId: 'usr-officer', userName: 'Officer John', entityType: 'approval', entityId: 'app-1', action: 'requested', metadata: {}, createdAt: '2026-05-24T16:00:00Z' },
  { id: 'log-5', userId: 'usr-manager', userName: 'Manager Sarah', entityType: 'approval', entityId: 'app-1', action: 'approved', metadata: { remarks: 'Pricing matches budget.' }, createdAt: '2026-05-25T10:00:00Z' },
  { id: 'log-6', userId: 'usr-system', userName: 'System', entityType: 'po', entityId: 'po-1', action: 'created', metadata: { poNumber: 'PO-2026-00001' }, createdAt: '2026-05-25T10:05:00Z' },
  { id: 'log-7', userId: 'usr-officer', userName: 'Officer John', entityType: 'invoice', entityId: 'inv-1', action: 'created', metadata: { invoiceNumber: 'INV-2026-00001' }, createdAt: '2026-05-26T14:25:00Z' },
  { id: 'log-8', userId: 'usr-officer', userName: 'Officer John', entityType: 'invoice', entityId: 'inv-1', action: 'emailed', metadata: { email: 'sales@bytecraft.com' }, createdAt: '2026-05-26T14:30:00Z' },
  { id: 'log-9', userId: 'usr-officer', userName: 'Officer John', entityType: 'rfq', entityId: 'rfq-1', action: 'created', metadata: { title: 'Office Chairs Upgrade Q3' }, createdAt: '2026-06-01T10:00:00Z' }
];

// Helper to access and save states
class MockDb {
  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem('vb_users')) localStorage.setItem('vb_users', JSON.stringify(SEED_USERS));
    if (!localStorage.getItem('vb_vendors')) localStorage.setItem('vb_vendors', JSON.stringify(SEED_VENDORS));
    if (!localStorage.getItem('vb_rfqs')) localStorage.setItem('vb_rfqs', JSON.stringify(SEED_RFQS));
    if (!localStorage.getItem('vb_quotations')) localStorage.setItem('vb_quotations', JSON.stringify(SEED_QUOTATIONS));
    if (!localStorage.getItem('vb_approvals')) localStorage.setItem('vb_approvals', JSON.stringify(SEED_APPROVALS));
    if (!localStorage.getItem('vb_pos')) localStorage.setItem('vb_pos', JSON.stringify(SEED_POS));
    if (!localStorage.getItem('vb_invoices')) localStorage.setItem('vb_invoices', JSON.stringify(SEED_INVOICES));
    if (!localStorage.getItem('vb_logs')) localStorage.setItem('vb_logs', JSON.stringify(SEED_ACTIVITY_LOGS));
  }

  // Generic Getters/Setters
  private getItems<T>(key: string): T[] {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  private setItems<T>(key: string, items: T[]): void {
    localStorage.setItem(key, JSON.stringify(items));
  }

  reset() {
    localStorage.removeItem('vb_users');
    localStorage.removeItem('vb_vendors');
    localStorage.removeItem('vb_rfqs');
    localStorage.removeItem('vb_quotations');
    localStorage.removeItem('vb_approvals');
    localStorage.removeItem('vb_pos');
    localStorage.removeItem('vb_invoices');
    localStorage.removeItem('vb_logs');
    this.init();
  }

  // Users Auth APIs
  login(email: string): { user: MockUser; token: string } {
    const users = this.getItems<MockUser>('vb_users');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('User not found');
    return { user, token: `mock-jwt-token-for-${user.id}` };
  }

  signup(name: string, email: string, role: string): MockUser {
    const users = this.getItems<MockUser>('vb_users');
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email already exists');
    }
    const newUser: MockUser = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role: role as any,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    this.setItems('vb_users', users);

    // Log action
    this.logActivity('usr-system', 'System', 'vendor', newUser.id, 'registered', { name, role });
    return newUser;
  }

  // Vendors CRUD APIs
  getVendors(search = '', status = ''): MockVendor[] {
    let vendors = this.getItems<MockVendor>('vb_vendors');
    if (search) {
      vendors = vendors.filter(v => v.name.toLowerCase().includes(search.toLowerCase()) || v.category.toLowerCase().includes(search.toLowerCase()));
    }
    if (status) {
      vendors = vendors.filter(v => v.status === status);
    }
    return vendors;
  }

  getVendor(id: string): MockVendor {
    const vendors = this.getItems<MockVendor>('vb_vendors');
    const v = vendors.find(x => x.id === id);
    if (!v) throw new Error('Vendor not found');
    return v;
  }

  createVendor(data: Omit<MockVendor, 'id' | 'createdAt' | 'rating' | 'avgPrice' | 'avgDeliveryDays' | 'totalPOs'>): MockVendor {
    const vendors = this.getItems<MockVendor>('vb_vendors');
    const newVendor: MockVendor = {
      ...data,
      id: `ven-${Date.now()}`,
      rating: 4.0, // Default rating
      createdAt: new Date().toISOString(),
      avgPrice: 5000,
      avgDeliveryDays: 7,
      totalPOs: 0
    };
    vendors.push(newVendor);
    this.setItems('vb_vendors', vendors);
    this.logActivity('usr-officer', 'Officer John', 'vendor', newVendor.id, 'created', { name: newVendor.name });
    return newVendor;
  }

  updateVendor(id: string, data: Partial<MockVendor>): MockVendor {
    const vendors = this.getItems<MockVendor>('vb_vendors');
    const index = vendors.findIndex(x => x.id === id);
    if (index === -1) throw new Error('Vendor not found');
    vendors[index] = { ...vendors[index], ...data };
    this.setItems('vb_vendors', vendors);
    this.logActivity('usr-officer', 'Officer John', 'vendor', id, 'updated', { name: vendors[index].name });
    return vendors[index];
  }

  // RFQ APIs
  getRFQs(status = ''): MockRFQ[] {
    let rfqs = this.getItems<MockRFQ>('vb_rfqs');
    if (status) {
      rfqs = rfqs.filter(r => r.status === status);
    }
    return rfqs;
  }

  getRFQ(id: string): MockRFQ & { quotations?: MockQuotation[] } {
    const rfqs = this.getItems<MockRFQ>('vb_rfqs');
    const rfq = rfqs.find(x => x.id === id);
    if (!rfq) throw new Error('RFQ not found');

    const quotations = this.getItems<MockQuotation>('vb_quotations').filter(q => q.rfqId === id);
    return { ...rfq, quotations };
  }

  createRFQ(data: Omit<MockRFQ, 'id' | 'createdAt' | 'status'>): MockRFQ {
    const rfqs = this.getItems<MockRFQ>('vb_rfqs');
    const newRfq: MockRFQ = {
      ...data,
      id: `rfq-${Date.now()}`,
      status: 'open',
      createdAt: new Date().toISOString()
    };
    rfqs.push(newRfq);
    this.setItems('vb_rfqs', rfqs);
    this.logActivity('usr-officer', 'Officer John', 'rfq', newRfq.id, 'created', { title: newRfq.title });
    return newRfq;
  }

  updateRFQStatus(id: string, status: MockRFQ['status']): MockRFQ {
    const rfqs = this.getItems<MockRFQ>('vb_rfqs');
    const index = rfqs.findIndex(x => x.id === id);
    if (index === -1) throw new Error('RFQ not found');
    rfqs[index].status = status;
    this.setItems('vb_rfqs', rfqs);
    this.logActivity('usr-officer', 'Officer John', 'rfq', id, 'status_updated', { status });
    return rfqs[index];
  }

  // Quotation APIs
  getQuotations(rfqId: string): MockQuotation[] {
    return this.getItems<MockQuotation>('vb_quotations').filter(q => q.rfqId === rfqId);
  }

  submitQuotation(data: Omit<MockQuotation, 'id' | 'status' | 'submittedAt'>): MockQuotation {
    const quotations = this.getItems<MockQuotation>('vb_quotations');

    // Calculate total price if not provided (qty * unit price)
    const rfq = this.getRFQ(data.rfqId);
    let totalQty = rfq.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = data.totalPrice || (data.unitPrice * totalQty);

    const newQ: MockQuotation = {
      ...data,
      id: `q-${Date.now()}`,
      totalPrice,
      status: 'submitted',
      submittedAt: new Date().toISOString()
    };
    quotations.push(newQ);
    this.setItems('vb_quotations', quotations);

    const vendor = this.getVendor(data.vendorId);
    this.logActivity(data.vendorId, `${vendor.name} Agent`, 'quotation', newQ.id, 'submitted', { amount: totalPrice });
    return newQ;
  }

  updateQuotationStatus(id: string, status: MockQuotation['status']): MockQuotation {
    const quotations = this.getItems<MockQuotation>('vb_quotations');
    const index = quotations.findIndex(x => x.id === id);
    if (index === -1) throw new Error('Quotation not found');
    quotations[index].status = status;
    this.setItems('vb_quotations', quotations);

    this.logActivity('usr-officer', 'Officer John', 'quotation', id, status, { amount: quotations[index].totalPrice });
    return quotations[index];
  }

  // Approval Workflow APIs
  getApprovals(): (MockApproval & { vendorName: string; rfqTitle: string; totalAmount: number; requestedByName: string; rfqId?: string; vendorId?: string })[] {
    const approvals = this.getItems<MockApproval>('vb_approvals');
    const quotations = this.getItems<MockQuotation>('vb_quotations');
    const rfqs = this.getItems<MockRFQ>('vb_rfqs');
    const vendors = this.getItems<MockVendor>('vb_vendors');
    const users = this.getItems<MockUser>('vb_users');

    return approvals.map(app => {
      const q = quotations.find(x => x.id === app.quotationId)!;
      const r = rfqs.find(x => x.id === q?.rfqId)!;
      const v = vendors.find(x => x.id === q?.vendorId)!;
      const u = users.find(x => x.id === app.requestedBy)!;

      return {
        ...app,
        vendorName: v?.name || 'Unknown',
        rfqTitle: r?.title || 'Unknown',
        totalAmount: q?.totalPrice || 0,
        requestedByName: u?.name || 'Officer',
        rfqId: r?.id,
        vendorId: v?.id
      };
    });
  }

  requestApproval(quotationId: string, officerId: string): MockApproval {
    const approvals = this.getItems<MockApproval>('vb_approvals');

    // Mark quotation as shortlisted
    this.updateQuotationStatus(quotationId, 'shortlisted');

    const newApp: MockApproval = {
      id: `app-${Date.now()}`,
      quotationId,
      requestedBy: officerId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    approvals.push(newApp);
    this.setItems('vb_approvals', approvals);

    this.logActivity(officerId, 'Officer John', 'approval', newApp.id, 'requested', {});
    return newApp;
  }

  approveApproval(id: string, approverId: string, remarks: string): MockApproval {
    const approvals = this.getItems<MockApproval>('vb_approvals');
    const index = approvals.findIndex(x => x.id === id);
    if (index === -1) throw new Error('Approval not found');

    approvals[index].status = 'approved';
    approvals[index].remarks = remarks;
    approvals[index].approverId = approverId;
    approvals[index].actionedAt = new Date().toISOString();
    this.setItems('vb_approvals', approvals);

    // Accept quotation
    const q = this.updateQuotationStatus(approvals[index].quotationId, 'accepted');

    // Close RFQ
    this.updateRFQStatus(q.rfqId, 'closed');

    // Trigger PO generation
    this.createPO(q.id);

    this.logActivity(approverId, 'Manager Sarah', 'approval', id, 'approved', { remarks });
    return approvals[index];
  }

  rejectApproval(id: string, approverId: string, remarks: string): MockApproval {
    const approvals = this.getItems<MockApproval>('vb_approvals');
    const index = approvals.findIndex(x => x.id === id);
    if (index === -1) throw new Error('Approval not found');

    approvals[index].status = 'rejected';
    approvals[index].remarks = remarks;
    approvals[index].approverId = approverId;
    approvals[index].actionedAt = new Date().toISOString();
    this.setItems('vb_approvals', approvals);

    // Reject quotation
    this.updateQuotationStatus(approvals[index].quotationId, 'rejected');

    this.logActivity(approverId, 'Manager Sarah', 'approval', id, 'rejected', { remarks });
    return approvals[index];
  }

  // PO APIs
  getPOs(): (MockPO & { vendorName: string; rfqTitle: string })[] {
    const pos = this.getItems<MockPO>('vb_pos');
    const quotations = this.getItems<MockQuotation>('vb_quotations');
    const rfqs = this.getItems<MockRFQ>('vb_rfqs');
    const vendors = this.getItems<MockVendor>('vb_vendors');

    return pos.map(po => {
      const q = quotations.find(x => x.id === po.quotationId)!;
      const r = rfqs.find(x => x.id === q?.rfqId)!;
      const v = vendors.find(x => x.id === po.vendorId)!;

      return {
        ...po,
        vendorName: v?.name || 'Unknown',
        rfqTitle: r?.title || 'Unknown'
      };
    });
  }

  getPO(id: string): MockPO & { vendor: MockVendor; rfq: MockRFQ; quotation: MockQuotation } {
    const pos = this.getItems<MockPO>('vb_pos');
    const po = pos.find(x => x.id === id);
    if (!po) throw new Error('PO not found');

    const quotation = this.getItems<MockQuotation>('vb_quotations').find(q => q.id === po.quotationId)!;
    const vendor = this.getVendor(po.vendorId);
    const rfq = this.getRFQ(quotation.rfqId);

    return { ...po, vendor, rfq, quotation };
  }

  private createPO(quotationId: string): MockPO {
    const pos = this.getItems<MockPO>('vb_pos');
    const quotations = this.getItems<MockQuotation>('vb_quotations');
    const q = quotations.find(x => x.id === quotationId)!;

    const subtotal = q.totalPrice;
    const taxPercent = 18; // Standard 18% GST
    const taxAmount = parseFloat((subtotal * (taxPercent / 100)).toFixed(2));
    const totalAmount = subtotal + taxAmount;

    // Generate PO Number PO-2026-0000X
    const year = new Date().getFullYear();
    const count = pos.filter(p => p.poNumber.startsWith(`PO-${year}`)).length + 1;
    const padded = String(count).padStart(5, '0');
    const poNumber = `PO-${year}-${padded}`;

    const newPo: MockPO = {
      id: `po-${Date.now()}`,
      poNumber,
      quotationId,
      vendorId: q.vendorId,
      subtotal,
      taxPercent,
      taxAmount,
      totalAmount,
      status: 'issued',
      issuedAt: new Date().toISOString()
    };
    pos.push(newPo);
    this.setItems('vb_pos', pos);

    // Update Vendor stats
    const vendors = this.getItems<MockVendor>('vb_vendors');
    const vi = vendors.findIndex(x => x.id === q.vendorId);
    if (vi !== -1) {
      vendors[vi].totalPOs += 1;
      this.setItems('vb_vendors', vendors);
    }

    this.logActivity('usr-system', 'System', 'po', newPo.id, 'created', { poNumber });
    return newPo;
  }

  updatePOStatus(id: string, status: MockPO['status']): MockPO {
    const pos = this.getItems<MockPO>('vb_pos');
    const index = pos.findIndex(x => x.id === id);
    if (index === -1) throw new Error('PO not found');
    pos[index].status = status;
    this.setItems('vb_pos', pos);
    this.logActivity('usr-officer', 'Officer John', 'po', id, `status_${status}`, {});
    return pos[index];
  }

  // Invoice APIs
  getInvoices(): (MockInvoice & { poNumber: string; vendorName: string; totalAmount: number })[] {
    const invoices = this.getItems<MockInvoice>('vb_invoices');
    const pos = this.getItems<MockPO>('vb_pos');
    const vendors = this.getItems<MockVendor>('vb_vendors');

    return invoices.map(inv => {
      const po = pos.find(x => x.id === inv.poId)!;
      const v = vendors.find(x => x.id === po?.vendorId)!;

      return {
        ...inv,
        poNumber: po?.poNumber || '',
        vendorName: v?.name || '',
        totalAmount: po?.totalAmount || 0
      };
    });
  }

  getInvoice(id: string): MockInvoice & { po: MockPO & { vendor: MockVendor; rfq: MockRFQ; quotation: MockQuotation } } {
    const invoices = this.getItems<MockInvoice>('vb_invoices');
    const invoice = invoices.find(x => x.id === id);
    if (!invoice) throw new Error('Invoice not found');

    const po = this.getPO(invoice.poId);
    return { ...invoice, po };
  }

  createInvoice(poId: string): MockInvoice {
    const invoices = this.getItems<MockInvoice>('vb_invoices');
    this.getPO(poId);

    // Generate Invoice Number INV-2026-0000X
    const year = new Date().getFullYear();
    const count = invoices.filter(i => i.invoiceNumber.startsWith(`INV-${year}`)).length + 1;
    const padded = String(count).padStart(5, '0');
    const invoiceNumber = `INV-${year}-${padded}`;

    const newInv: MockInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      poId,
      issuedDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days due
      status: 'draft',
      createdAt: new Date().toISOString(),
      pdfUrl: '#'
    };
    invoices.push(newInv);
    this.setItems('vb_invoices', invoices);

    this.logActivity('usr-officer', 'Officer John', 'invoice', newInv.id, 'created', { invoiceNumber });
    return newInv;
  }

  sendInvoiceEmail(id: string): MockInvoice {
    const invoices = this.getItems<MockInvoice>('vb_invoices');
    const index = invoices.findIndex(x => x.id === id);
    if (index === -1) throw new Error('Invoice not found');

    invoices[index].status = 'sent';
    invoices[index].emailedAt = new Date().toISOString();
    this.setItems('vb_invoices', invoices);

    const po = this.getPO(invoices[index].poId);
    this.logActivity('usr-officer', 'Officer John', 'invoice', id, 'emailed', { email: po.vendor.contactEmail });
    return invoices[index];
  }

  updateInvoiceStatus(id: string, status: MockInvoice['status']): MockInvoice {
    const invoices = this.getItems<MockInvoice>('vb_invoices');
    const index = invoices.findIndex(x => x.id === id);
    if (index === -1) throw new Error('Invoice not found');
    invoices[index].status = status;
    this.setItems('vb_invoices', invoices);
    this.logActivity('usr-officer', 'Officer John', 'invoice', id, `status_${status}`, {});
    return invoices[index];
  }

  // Reports / Analytics APIs
  getDashboardSummary() {
    const rfqs = this.getItems<MockRFQ>('vb_rfqs');
    const approvals = this.getItems<MockApproval>('vb_approvals');
    const pos = this.getItems<MockPO>('vb_pos');

    const pendingApprovalsCount = approvals.filter(a => a.status === 'pending').length;
    const activeRFQsCount = rfqs.filter(r => r.status === 'open').length;

    // POs this month
    const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const monthlyPOs = pos.filter(po => po.issuedAt.startsWith(thisMonth));
    const posThisMonthCount = monthlyPOs.length;

    // Total spend this month
    const totalSpendThisMonth = monthlyPOs.reduce((sum, po) => sum + po.totalAmount, 0);

    return {
      pendingApprovals: pendingApprovalsCount,
      activeRFQs: activeRFQsCount,
      posThisMonth: posThisMonthCount,
      totalSpend: totalSpendThisMonth
    };
  }

  getMonthlySpend() {
    const pos = this.getItems<MockPO>('vb_pos');
    // Group spend by month for the last 6 months
    const spendMap: Record<string, number> = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mKey = d.toISOString().substring(0, 7); // "2026-06"
      spendMap[mKey] = 0;
    }

    pos.forEach(po => {
      const mKey = po.issuedAt.substring(0, 7);
      if (spendMap[mKey] !== undefined) {
        spendMap[mKey] += po.totalAmount;
      }
    });

    return Object.entries(spendMap).map(([key, val]) => {
      const date = new Date(key + '-02');
      return {
        month: date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear().toString().slice(-2),
        amount: val
      };
    });
  }

  getCategorySpend() {
    const pos = this.getItems<MockPO>('vb_pos');
    const vendors = this.getItems<MockVendor>('vb_vendors');
    const catMap: Record<string, number> = {};

    pos.forEach(po => {
      const vendor = vendors.find(v => v.id === po.vendorId);
      const cat = vendor?.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + po.totalAmount;
    });

    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  }

  getVendorPerformance() {
    const pos = this.getItems<MockPO>('vb_pos');
    const vendors = this.getItems<MockVendor>('vb_vendors');

    return vendors.map(v => {
      const vPos = pos.filter(p => p.vendorId === v.id);
      const totalPoAmt = vPos.reduce((sum, p) => sum + p.totalAmount, 0);
      const avgDeliveryDays = v.avgDeliveryDays;

      return {
        vendorName: v.name,
        category: v.category,
        totalPOs: vPos.length,
        totalSpend: totalPoAmt,
        avgDeliveryDays,
        rating: v.rating
      };
    }).sort((a, b) => b.totalSpend - a.totalSpend);
  }

  // Activity Logs
  getActivityLogs(limit = 20) {
    const logs = this.getItems<MockActivityLog>('vb_logs');
    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
  }

  private logActivity(userId: string, userName: string, entityType: MockActivityLog['entityType'], entityId: string, action: string, metadata?: any) {
    const logs = this.getItems<MockActivityLog>('vb_logs');
    const newLog: MockActivityLog = {
      id: `log-${Date.now()}`,
      userId,
      userName,
      entityType,
      entityId,
      action,
      metadata,
      createdAt: new Date().toISOString()
    };
    logs.push(newLog);
    this.setItems('vb_logs', logs);
  }

  // AI RECOMMEND VENDORS
  aiRecommendVendors(category: string): { vendorId: string; vendorName: string; score: number; rank: number; reason: string }[] {
    const vendors = this.getItems<MockVendor>('vb_vendors').filter(v => v.category.toLowerCase() === category.toLowerCase() && v.status === 'active');

    if (vendors.length === 0) return [];

    // Calculate maximums to normalize
    const maxRating = 5.0;
    const maxPrice = Math.max(...vendors.map(v => v.avgPrice), 1000);
    const maxDays = Math.max(...vendors.map(v => v.avgDeliveryDays), 5);
    const maxPos = Math.max(...vendors.map(v => v.totalPOs), 1);

    const scored = vendors.map(v => {
      // Normalize values (0 - 1)
      const ratingNorm = v.rating / maxRating;
      const priceNorm = 1 - (v.avgPrice / maxPrice); // lower price is better
      const deliveryNorm = 1 - (v.avgDeliveryDays / maxDays); // lower days is better
      const reliabilityNorm = v.totalPOs / maxPos;

      // Scoring formula: rating 40%, price 30%, delivery 20%, reliability 10%
      const totalScore = Math.round((
        ratingNorm * 40 +
        priceNorm * 30 +
        deliveryNorm * 20 +
        reliabilityNorm * 10
      ));

      // Build recommendation reasons
      let reason = 'Competitive alternative';
      if (v.rating >= 4.7) reason = 'Top Rated & High Quality ⭐';
      else if (v.avgDeliveryDays <= 3) reason = 'Extremely Fast Dispatch 🚀';
      else if (v.avgPrice <= maxPrice * 0.7) reason = 'Highly Budget-Friendly 💰';
      else if (v.totalPOs >= 20) reason = 'Highly Reliable & Trusted Vendor';

      return {
        vendorId: v.id,
        vendorName: v.name,
        score: totalScore,
        reason
      };
    });

    // Sort by score desc, assign rank
    return scored
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        // Override top one
        reason: index === 0 ? 'Best Overall Match (AI Recommended)' : item.reason
      }));
  }

  // AI RANK QUOTATIONS
  aiRankQuotations(rfqId: string): MockQuotation[] {
    const quotations = this.getItems<MockQuotation>('vb_quotations');
    const rfqQuotes = quotations.filter(q => q.rfqId === rfqId);

    if (rfqQuotes.length === 0) return [];

    const vendors = this.getItems<MockVendor>('vb_vendors');

    // Multi-criteria ranking scoring
    const maxPrice = Math.max(...rfqQuotes.map(q => q.totalPrice), 1000);
    const minPrice = Math.min(...rfqQuotes.map(q => q.totalPrice), 0);
    const maxDays = Math.max(...rfqQuotes.map(q => q.deliveryDays), 5);
    const minDays = Math.min(...rfqQuotes.map(q => q.deliveryDays), 0);

    const scored = rfqQuotes.map(q => {
      const vendor = vendors.find(v => v.id === q.vendorId)!;

      // Normalize price
      const priceRange = maxPrice - minPrice;
      const priceScore = priceRange > 0 ? ((maxPrice - q.totalPrice) / priceRange) * 40 : 40;

      // Normalize delivery speed
      const daysRange = maxDays - minDays;
      const deliveryScore = daysRange > 0 ? ((maxDays - q.deliveryDays) / daysRange) * 30 : 30;

      // Normalize vendor rating
      const ratingScore = (vendor.rating / 5) * 30;

      const totalScore = Math.round(priceScore + deliveryScore + ratingScore);

      return { q, totalScore };
    });

    // Sort by score desc
    const sorted = scored.sort((a, b) => b.totalScore - a.totalScore);

    // Identify minimum price & minimum delivery
    const minPriceId = rfqQuotes.reduce((min, cur) => cur.totalPrice < min.totalPrice ? cur : min, rfqQuotes[0]).id;
    const minDaysId = rfqQuotes.reduce((min, cur) => cur.deliveryDays < min.deliveryDays ? cur : min, rfqQuotes[0]).id;

    // Apply scores and badges
    const updated = quotations.map(item => {
      const scoreObj = sorted.find(s => s.q.id === item.id);
      if (!scoreObj) return item;

      let badge = '';
      if (scoreObj.q.id === sorted[0].q.id) {
        badge = 'Best Overall ⭐';
      } else if (scoreObj.q.id === minPriceId) {
        badge = 'Best Price 💰';
      } else if (scoreObj.q.id === minDaysId) {
        badge = 'Fastest 🚀';
      } else if (scoreObj.q.id === sorted[1]?.q.id) {
        badge = 'Recommended';
      }

      return {
        ...item,
        totalScore: scoreObj.totalScore,
        badge
      };
    });

    this.setItems('vb_quotations', updated);
    this.logActivity('usr-officer', 'Officer John', 'rfq', rfqId, 'ai_ranked_quotations', {});

    return updated.filter(q => q.rfqId === rfqId);
  }

  // Spend Forecast API
  aiSpendForecast(monthlySpend: { month: string; amount: number }[]) {
    if (monthlySpend.length < 3) {
      return {
        error: 'insufficient_data',
        fallback: 'Requires at least 3 months of historical data for AI modeling.'
      };
    }

    // Fit a simple linear trend using polyfit simulation (y = mx + c)
    const n = monthlySpend.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += monthlySpend[i].amount;
      sumXY += i * monthlySpend[i].amount;
      sumXX += i * i;
    }

    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const c = (sumY - m * sumX) / n;

    // Project next 3 months
    const forecast = [];
    const lastDateParts = monthlySpend[n - 1].month.split(' '); // e.g., "Jun 26"
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let monthIdx = months.indexOf(lastDateParts[0]);
    let year = parseInt('20' + lastDateParts[1]);

    for (let j = 1; j <= 3; j++) {
      monthIdx += 1;
      if (monthIdx > 11) {
        monthIdx = 0;
        year += 1;
      }
      const valIdx = n - 1 + j;
      const predictedAmount = Math.max(Math.round(m * valIdx + c), 10000);
      forecast.push({
        month: `${months[monthIdx]} ${String(year).slice(-2)}`,
        predictedAmount,
        confidence: m > 0 ? 'High' : 'Medium'
      });
    }

    return {
      forecast,
      trend: m > 0.05 ? 'increasing' : m < -0.05 ? 'decreasing' : 'stable'
    };
  }
}

export const mockDb = new MockDb();
export default mockDb;
