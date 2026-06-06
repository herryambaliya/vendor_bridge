# VendorBridge — Backend API

> **Member 2 (Backend Developer)** contribution for the VendorBridge Procurement Management System.

A production-ready **Node.js + TypeScript + Express** REST API backend with PostgreSQL (via Prisma ORM), JWT authentication, PDF generation, email delivery, AI proxy routes, and analytics.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js + TypeScript | Runtime + Type Safety |
| Express.js | HTTP Framework |
| Prisma ORM | Database ORM |
| PostgreSQL | Relational Database |
| JWT (jsonwebtoken) | Authentication Tokens |
| bcrypt | Password Hashing |
| Zod | Request Validation |
| PDFKit | Invoice PDF Generation |
| Nodemailer | Email Sending (Mailtrap) |
| Axios | AI Service Proxy |
| cors + dotenv | CORS & Environment Config |

---

## 📁 Project Structure

```
src/
├── index.ts                  # Express app entry point
├── middleware/
│   ├── auth.ts               # JWT verifyToken middleware
│   └── requireRole.ts        # Role-based access guard
├── routes/
│   ├── auth.ts               # POST /signup, /login
│   ├── vendors.ts            # Vendor CRUD
│   ├── rfqs.ts               # RFQ management
│   ├── quotations.ts         # Quotation submission & status
│   ├── approvals.ts          # Approval workflow
│   ├── purchaseOrders.ts     # PO management
│   ├── invoices.ts           # Invoice + PDF + Email
│   ├── reports.ts            # Analytics endpoints
│   ├── ai.ts                 # AI proxy routes with fallback
│   └── activityLogs.ts       # Activity log listing
└── utils/
    ├── logActivity.ts        # Fire-and-forget activity logger
    ├── generatePO.ts         # Auto PO number + tax calculation
    ├── generatePDF.ts        # PDFKit invoice layout
    └── sendEmail.ts          # Nodemailer + PDF attachment
prisma/
├── schema.prisma             # All 10 database tables
└── migrations/               # SQL migration history
```

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/herryambaliya/vendor_bridge.git
cd vendor_bridge
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```
Edit `.env` and fill in your values:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/vendorbridge"
PORT=5000
JWT_SECRET=your_secret_key_here
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_mailtrap_user
EMAIL_PASS=your_mailtrap_pass
```

### 4. Run database migration
```bash
npx prisma migrate dev --name init
```

### 5. Start the development server
```bash
npm run dev
```

Server runs at: `http://localhost:5000`

Health check: `http://localhost:5000/health`

---

## 🔐 Authentication

All protected routes require:
```
Authorization: Bearer <JWT_TOKEN>
```

Roles: `admin`, `officer`, `manager`, `vendor`

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |

### Vendors
| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/api/vendors` | All | List vendors (search + filter) |
| POST | `/api/vendors` | officer, admin | Create vendor |
| GET | `/api/vendors/:id` | All | Get vendor detail |
| PATCH | `/api/vendors/:id` | officer, admin | Update vendor |

### RFQs
| Method | Endpoint | Roles | Description |
|---|---|---|---|
| POST | `/api/rfqs` | officer, admin | Create RFQ with items + vendor assignments |
| GET | `/api/rfqs` | All | List RFQs |
| GET | `/api/rfqs/:id` | All | RFQ detail with items + quotation count |
| PATCH | `/api/rfqs/:id/status` | officer, admin | Update RFQ status |
| GET | `/api/rfqs/:rfqId/quotations` | officer, manager, admin | List quotations for RFQ |

### Quotations
| Method | Endpoint | Roles | Description |
|---|---|---|---|
| POST | `/api/quotations` | vendor | Submit quotation |
| PATCH | `/api/quotations/:id/status` | officer, admin | Shortlist or reject |

### Approvals
| Method | Endpoint | Roles | Description |
|---|---|---|---|
| POST | `/api/approvals` | officer | Create approval request |
| GET | `/api/approvals` | officer, manager, admin | List approvals |
| POST | `/api/approvals/:id/approve` | manager, admin | Approve → auto-generates PO |
| POST | `/api/approvals/:id/reject` | manager, admin | Reject with remarks |

### Purchase Orders
| Method | Endpoint | Roles | Description |
|---|---|---|---|
| GET | `/api/purchase-orders` | officer, manager, admin | List POs |
| GET | `/api/purchase-orders/:id` | officer, manager, admin | PO detail with tax breakdown |
| PATCH | `/api/purchase-orders/:id/status` | officer, admin | Update status |

### Invoices
| Method | Endpoint | Roles | Description |
|---|---|---|---|
| POST | `/api/invoices` | officer, admin | Create invoice from PO |
| GET | `/api/invoices` | officer, manager, admin | List invoices |
| GET | `/api/invoices/:id` | officer, manager, admin | Invoice detail |
| GET | `/api/invoices/:id/pdf` | officer, manager, admin | Download PDF |
| POST | `/api/invoices/:id/send-email` | officer, admin | Email invoice to vendor |

### Reports & Analytics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports/dashboard-summary` | Pending approvals, active RFQs, monthly POs + spend |
| GET | `/api/reports/monthly-spend` | Last 6 months spend chart data |
| GET | `/api/reports/vendor-performance` | Per-vendor PO count, avg price, delivery, rating |
| GET | `/api/reports/category-spend` | Spend grouped by vendor category |

### AI Proxy (with fallback mock)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/recommend-vendors` | Proxy to Python AI service |
| POST | `/api/ai/rank-quotations` | Proxy to Python AI service |

### Activity Logs
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/activity-logs` | Paginated logs with optional `?entity_type=` filter |

---

## 🧮 Business Logic

- **PO Auto-generation**: On approval, `generatePO()` computes `subtotal`, `tax_amount` (18% GST), `total_amount` and assigns sequential `PO-YEAR-00001` number
- **Invoice numbering**: Auto-incremented `INV-YEAR-00001`, due date = issued + 30 days
- **AI fallback**: If Python service is down, returns hardcoded mock recommendations
- **Activity logging**: Every mutation fires `logActivity()` (non-blocking, fire-and-forget)

---

## 👤 Member 2 Responsibilities

This repository contains **only Member 2 (Backend Developer)** work:
- ✅ All Express routes and business logic
- ✅ Prisma schema (10 tables)
- ✅ JWT auth + role middleware
- ✅ PDF generation (PDFKit)
- ✅ Email sending (Nodemailer)
- ✅ AI proxy routes
- ✅ Analytics queries
- ✅ Activity logger

**Not included** (other members' work):
- ❌ React frontend (Member 1)
- ❌ Python AI model (Member 3)
- ❌ Docker / DB server setup / Postman testing (Member 4)