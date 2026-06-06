# 🛒 VendorBridge — Procurement & Vendor Management ERP
## Hackathon Roadmap | **4-Member Team (Frontend · Backend · AI/ML · DevOps)**

> **Project**: VendorBridge — Centralized Procurement ERP
> **Stack**: React 18 + TypeScript · Node.js (Express) · Python FastAPI · PostgreSQL · Prisma ORM · Tailwind CSS · Recharts
> **Goal**: Digitize end-to-end procurement — RFQ → Quotation → Approval → PO → Invoice — with AI-powered vendor recommendations
> **Duration**: 8 Hours (Hackathon)
> **Team Size**: 4 Members

---

## TABLE OF CONTENTS

1. [Project Overview & Problem Statement](#1-project-overview--problem-statement)
2. [System Architecture](#2-system-architecture)
3. [Database Schema](#3-database-schema)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Complete Procurement Workflow](#5-complete-procurement-workflow)
6. [Member 1 — Frontend Developer Roadmap](#6-member-1--frontend-developer-roadmap)
7. [Member 2 — Backend Developer Roadmap](#7-member-2--backend-developer-roadmap)
8. [Member 3 — AI/ML Engineer Roadmap](#8-member-3--aiml-engineer-roadmap)
9. [Member 4 — DevOps / Integration Support Roadmap](#9-member-4--devops--integration-support-roadmap)
10. [API Reference](#10-api-reference)
11. [Hour-by-Hour Team Build Order](#11-hour-by-hour-team-build-order)
12. [Role Boundary Rules — No Overlap](#12-role-boundary-rules--no-overlap)
13. [Hackathon Survival Rules](#13-hackathon-survival-rules)
14. [Demo Script](#14-demo-script)

---

## 1. Project Overview & Problem Statement

### The Problem
Organizations manage procurement through a mess of spreadsheets, email threads, and manual phone calls. Vendors are contacted ad-hoc, quotation comparisons happen on paper, approval chains are verbal, purchase orders are typed by hand, and invoices are generated in MS Word. This causes delayed procurement, pricing errors, vendor disputes, and zero audit trail.

### What VendorBridge Builds
A centralized Procurement ERP that handles the full procurement lifecycle:
- **Vendor Registry** — GST details, categories, contact info, status tracking
- **RFQ Module** — Create requests for quotation, assign vendors, set deadlines
- **Quotation Engine** — Vendors submit prices; procurement team sees side-by-side comparison
- **Approval Workflow** — Manager approves/rejects with remarks and timeline
- **PO & Invoice Generation** — Auto-generated PO number, tax calculations, PDF download, email send
- **AI Vendor Recommender** — Suggests best vendors for an RFQ based on past performance, pricing, delivery speed
- **Activity Logs & Analytics** — Full audit trail, spending summaries, monthly trends

### Who Uses It

| Role | What They Do |
|---|---|
| **Procurement Officer** | Creates RFQs, compares quotations, generates POs and invoices |
| **Vendor** | Submits quotations, tracks RFQ status, views purchase orders |
| **Manager / Approver** | Approves or rejects procurement requests, monitors workflows |
| **Admin** | Manages users and vendors, views analytics |

---

## 2. System Architecture

```
+-----------------------------------------------------------------------------------+
|                        VENDORBRIDGE PROCUREMENT ERP                               |
|                                                                                   |
|  +------------------+    +-----------------------+    +-------------------------+ |
|  |   FRONTEND        |    |  NODE.JS BACKEND       |    |  PYTHON AI MICROSERVICE | |
|  |  React 18 + TS    |<-->|  Express REST API      |<-->|  FastAPI + Uvicorn      | |
|  |  Tailwind CSS     |    |  JWT Auth (RBAC)       |    |  Vendor Recommender     | |
|  |  Recharts         |    |  Prisma ORM            |    |  Quotation Ranker       | |
|  |  React Hook Form  |    |  Nodemailer (email)    |    |  Spend Forecast         | |
|  |  React Query      |    |  PDFKit (invoice PDF)  |    |                         | |
|  +------------------+    +-----------------------+    +-------------------------+ |
|           |                         |                                             |
|           v                         v                                             |
|  +------------------+    +-----------------------+                               |
|  |  BROWSER STATE    |    |  POSTGRESQL DB         |                             |
|  |  Zustand Store    |    |  Vendors · RFQs        |                             |
|  |  React Query Cache|    |  Quotations · POs      |                             |
|  +------------------+    |  Invoices · Users      |                             |
|                           +-----------------------+                              |
+-----------------------------------------------------------------------------------+
```

> ⚡ **Key Architecture Decision**: Node.js is the **single gateway** for all frontend requests. Python AI service is an internal microservice — the frontend never calls it directly. All AI results flow through Node.js proxy routes.

### End-to-End Data Flow

```
Procurement Officer creates RFQ
        |
        v
[Node.js] → validate (Zod) → save RFQ + items + vendor assignments to PostgreSQL
        |
        +---> Vendors submit quotations → saved in DB
        |
        +---> [Python AI] POST /recommend-vendors   → ranked vendor suggestions for RFQ
        |
        +---> [Python AI] POST /rank-quotations     → scored + badged quotation ranking
        |
        +---> Officer selects winner → requests approval from Manager
        |
        +---> Manager approves → PO auto-generated (PO-2026-XXXXX)
        |
        +---> Invoice generated from PO → PDF available → email sent to vendor
        |
        +---> Every action logged → Dashboard analytics updated
```

---

## 3. Database Schema

```sql
-- USERS
users (
  id           UUID PRIMARY KEY,
  name         VARCHAR,
  email        VARCHAR UNIQUE,
  password_hash VARCHAR,
  role         ENUM('admin','procurement_officer','manager','vendor'),
  created_at   TIMESTAMP
)

-- VENDORS
vendors (
  id            UUID PRIMARY KEY,
  name          VARCHAR,
  category      VARCHAR,            -- IT, Furniture, Logistics, Stationery…
  gst_number    VARCHAR,
  contact_name  VARCHAR,
  contact_email VARCHAR,
  contact_phone VARCHAR,
  address       TEXT,
  status        ENUM('active','inactive','blacklisted'),
  rating        DECIMAL(3,2),       -- 0.00 – 5.00
  created_at    TIMESTAMP
)

-- RFQs (Request for Quotation)
rfqs (
  id          UUID PRIMARY KEY,
  title       VARCHAR,
  description TEXT,
  status      ENUM('draft','open','closed','cancelled'),
  deadline    DATE,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMP
)

-- RFQ LINE ITEMS
rfq_items (
  id           UUID PRIMARY KEY,
  rfq_id       UUID REFERENCES rfqs(id),
  product_name VARCHAR,
  quantity     INTEGER,
  unit         VARCHAR              -- pcs, kg, litre…
)

-- RFQ → VENDOR ASSIGNMENTS
rfq_vendors (
  rfq_id      UUID REFERENCES rfqs(id),
  vendor_id   UUID REFERENCES vendors(id),
  invited_at  TIMESTAMP,
  PRIMARY KEY (rfq_id, vendor_id)
)

-- QUOTATIONS
quotations (
  id             UUID PRIMARY KEY,
  rfq_id         UUID REFERENCES rfqs(id),
  vendor_id      UUID REFERENCES vendors(id),
  unit_price     DECIMAL(12,2),
  total_price    DECIMAL(12,2),
  delivery_days  INTEGER,
  notes          TEXT,
  status         ENUM('submitted','shortlisted','rejected','accepted'),
  submitted_at   TIMESTAMP
)

-- APPROVALS
approvals (
  id             UUID PRIMARY KEY,
  quotation_id   UUID REFERENCES quotations(id),
  requested_by   UUID REFERENCES users(id),
  approver_id    UUID REFERENCES users(id),
  status         ENUM('pending','approved','rejected'),
  remarks        TEXT,
  actioned_at    TIMESTAMP,
  created_at     TIMESTAMP
)

-- PURCHASE ORDERS
purchase_orders (
  id           UUID PRIMARY KEY,
  po_number    VARCHAR UNIQUE,      -- PO-2026-00001
  quotation_id UUID REFERENCES quotations(id),
  vendor_id    UUID REFERENCES vendors(id),
  subtotal     DECIMAL(12,2),
  tax_percent  DECIMAL(5,2),
  tax_amount   DECIMAL(12,2),
  total_amount DECIMAL(12,2),
  status       ENUM('issued','acknowledged','delivered','cancelled'),
  issued_at    TIMESTAMP
)

-- INVOICES
invoices (
  id             UUID PRIMARY KEY,
  invoice_number VARCHAR UNIQUE,    -- INV-2026-00001
  po_id          UUID REFERENCES purchase_orders(id),
  issued_date    DATE,
  due_date       DATE,
  status         ENUM('draft','sent','paid','overdue'),
  pdf_url        VARCHAR,
  emailed_at     TIMESTAMP,
  created_at     TIMESTAMP
)

-- ACTIVITY LOGS
activity_logs (
  id          UUID PRIMARY KEY,
  user_id     UUID REFERENCES users(id),
  entity_type VARCHAR,              -- rfq | quotation | approval | po | invoice
  entity_id   UUID,
  action      VARCHAR,              -- created | approved | rejected | emailed…
  metadata    JSONB,
  created_at  TIMESTAMP
)
```

---

## 4. User Roles & Permissions

| Action | Admin | Officer | Manager | Vendor |
|---|---|---|---|---|
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Register / edit vendors | ✅ | ✅ | ❌ | ❌ |
| Create RFQ | ❌ | ✅ | ❌ | ❌ |
| Assign vendors to RFQ | ❌ | ✅ | ❌ | ❌ |
| Submit quotation | ❌ | ❌ | ❌ | ✅ |
| View all quotations | ✅ | ✅ | ✅ | Own only |
| Compare quotations | ❌ | ✅ | ✅ | ❌ |
| Request approval | ❌ | ✅ | ❌ | ❌ |
| Approve / reject | ❌ | ❌ | ✅ | ❌ |
| Generate PO | ❌ | ✅ | ❌ | ❌ |
| Generate invoice | ❌ | ✅ | ❌ | ❌ |
| Download / email invoice | ❌ | ✅ | ❌ | ❌ |
| View analytics | ✅ | ✅ | ✅ | ❌ |
| View activity logs | ✅ | ✅ | ✅ | ❌ |

---

## 5. Complete Procurement Workflow

```
STEP 1 — VENDOR ONBOARDING
  Admin / Officer registers vendor → GST, category, contact → status: active

STEP 2 — RFQ CREATION
  Officer creates RFQ → title, line items, quantity, deadline
  → clicks "AI Suggest Vendors" → Python returns ranked vendor list
  → assigns top vendors → status: open → vendors notified

STEP 3 — QUOTATION SUBMISSION
  Vendor logs in → sees assigned open RFQs
  → submits quotation (unit price, delivery days, notes) → status: submitted

STEP 4 — QUOTATION COMPARISON
  Officer opens Comparison screen → side-by-side table
  → lowest price highlighted green
  → clicks "AI Rank Quotations" → badges appear: "Best Overall ⭐" / "Fastest Delivery 🚀"
  → Officer selects winner → status: shortlisted

STEP 5 — APPROVAL WORKFLOW
  Officer requests approval → Manager sees pending alert
  → Manager reviews quotation + vendor info → approves with remarks / rejects
  → status: approved / rejected

STEP 6 — PURCHASE ORDER
  On approval → PO auto-generated (PO-2026-XXXXX)
  → subtotal + 18% GST calculated → total computed → status: issued

STEP 7 — INVOICE
  Officer generates invoice from PO → INV-2026-XXXXX assigned
  → PDF generated via PDFKit → download available
  → "Send via Email" → Nodemailer sends PDF to vendor email → status: sent

STEP 8 — LOGS & ANALYTICS
  Every action logged in activity_logs
  Dashboard: pending approvals, active RFQs, monthly spend
  Reports: vendor performance, category spend, monthly trend chart
```

---

## 6. Member 1 — Frontend Developer Roadmap

**Owns**: All UI screens, components, routing, state management, charts, forms
**Never touches**: Express route files, Prisma schema, Python AI code, DB setup, Dockerfile

---

### Phase 0 — Setup & Foundation (Hour 1, first 30 min)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H1 0:00 | `npm create vite@latest frontend -- --template react-ts` → install: `react-router-dom zustand @tanstack/react-query axios recharts react-hook-form` | React 18 + TypeScript boots on `localhost:5173` |
| H1 0:10 | Install Tailwind: `npm i -D tailwindcss postcss autoprefixer` → `npx tailwindcss init -p` → add `content` paths in `tailwind.config.js` | Tailwind utility classes working |
| H1 0:15 | `lib/axios.ts` — Axios instance: `baseURL: import.meta.env.VITE_API_URL` + request interceptor injecting `Authorization: Bearer <token>` | All API calls carry JWT automatically |
| H1 0:20 | `store/auth.ts` — Zustand store: `{ user, token, role, login(), logout() }` persisted to `localStorage` | Auth state survives page refresh |
| H1 0:25 | `components/layout/PrivateRoute.tsx` — reads Zustand auth; if no token → redirect to `/login`; if wrong role → redirect to `/unauthorized` | Protected routes block unauthenticated + wrong-role access |
| H1 0:30 | Build base component library: `Button, Modal, Card, Badge, Table, Spinner, Toast, Skeleton, EmptyState` | Shared components ready for all pages |

✅ **Phase 0 Checkpoint**: App boots. Axios carries JWT. Auth store persists. PrivateRoute guards routes. Component library ready.

---

### Phase 1 — Auth + Dashboard (Hour 1 end → Hour 2)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H1 0:35 | `pages/Login.tsx` — email + password fields, React Hook Form validation, `POST /api/auth/login` → store token + role → redirect to `/dashboard` | Login flow complete |
| H1 0:45 | `pages/Signup.tsx` — name, email, password, role selector (officer / vendor / manager / admin) → `POST /api/auth/signup` | Signup flow complete |
| H1 0:55 | `components/layout/Sidebar.tsx` — role-based nav links: Officer sees Vendors, RFQs, POs, Invoices; Vendor sees My Quotations; Manager sees Approvals; Admin sees all + Analytics | Correct nav renders per role |
| H2 1:00 | `pages/Dashboard.tsx` — 4 stat cards: **Pending Approvals** · **Active RFQs** · **POs This Month** · **Total Spend** → fetched from `GET /api/reports/dashboard-summary` | Dashboard shows live procurement stats |
| H2 1:20 | `components/dashboard/RecentActivity.tsx` — last 5 activity log entries as timeline list → `GET /api/activity-logs?limit=5` | Recent actions visible on dashboard |
| H2 1:35 | `components/dashboard/QuickActions.tsx` — 3 buttons: "New RFQ", "Add Vendor", "View Reports" → each navigates to correct route | Quick action buttons work |

✅ **Phase 1 Checkpoint**: Login → Dashboard flow works end-to-end. Stat cards show real data. Role-based sidebar renders correctly.

---

### Phase 2 — Vendor Management + RFQ Screens (Hour 2 → Hour 3)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H2 1:40 | `pages/Vendors.tsx` — table: Name · Category · GST · Status · Rating · Actions; search bar + status filter dropdown → `GET /api/vendors?search=&status=` | Vendor list page loads with search + filter |
| H2 1:55 | `components/vendors/VendorModal.tsx` — modal form: name, category, GST number, contact name, contact email, phone, address → `POST /api/vendors`; on edit: `PATCH /api/vendors/:id` | Admin/Officer can create and edit vendors |
| H3 2:10 | `pages/RFQs.tsx` — table: Title · Status · Deadline · Vendors Assigned · Quotations Received; filter by status → `GET /api/rfqs` | RFQ list page loads |
| H3 2:25 | `pages/RFQCreate.tsx` — form: title, description, deadline picker; dynamic line-items table (add/remove rows: product name, quantity, unit); vendor multi-select with **"AI Suggest" button** → calls `POST /api/ai/recommend-vendors` → shows ranked vendor cards with scores | RFQ creation with AI vendor suggestion works |
| H3 2:45 | `pages/RFQDetail.tsx` — shows RFQ info + line items + assigned vendors + list of submitted quotations with status badges | Officer can see full RFQ detail |

✅ **Phase 2 Checkpoint**: Vendor CRUD works. RFQ creation with dynamic items and AI suggestion works. RFQ list and detail pages load.

---

### Phase 3 — Quotation + Comparison + Approval Screens (Hour 3 → Hour 4.5)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H3 3:00 | `pages/MyRFQs.tsx` (Vendor role) — lists open RFQs assigned to this vendor; click → view RFQ detail (read-only) | Vendor can see their assigned RFQs |
| H3 3:15 | `components/quotations/QuotationForm.tsx` (Vendor role) — unit price, total price, delivery days, notes textarea → `POST /api/quotations` | Vendor can submit quotation |
| H4 3:30 | `pages/QuotationComparison.tsx` — side-by-side table: Vendor · Unit Price · Total · Delivery Days · Rating; lowest price cell highlighted green; fastest delivery cell highlighted blue | Comparison table renders correctly |
| H4 3:45 | **"AI Rank Quotations" button** on comparison page → `POST /api/ai/rank-quotations` → each row gets a badge: `"Best Overall ⭐"` / `"Best Price 💰"` / `"Fastest 🚀"` / `"Recommended"` → highlighted winner row | AI badge overlay on comparison table works |
| H4 4:00 | **"Select This Vendor"** button → `PATCH /api/quotations/:id/status` body `{ status: "shortlisted" }` → show success toast → **"Request Approval"** button appears | Shortlisting flow works |
| H4 4:10 | `pages/Approvals.tsx` (Manager role) — list of pending approvals: Quotation summary · Vendor name · Total amount · Requested by; click row → approval detail modal | Manager sees pending approvals list |
| H4 4:20 | `components/approvals/ApprovalModal.tsx` — shows quotation details + vendor info; remarks textarea; **Approve** button → `POST /api/approvals/:id/approve`; **Reject** button → `POST /api/approvals/:id/reject`; approval timeline (Requested → Reviewed → Decided) | Manager can approve or reject with remarks |

✅ **Phase 3 Checkpoint**: Vendor submits quotation. Officer sees comparison with AI badges. Officer shortlists. Manager approves/rejects. Full approval flow works.

---

### Phase 4 — PO + Invoice + PDF + Email Screens (Hour 4.5 → Hour 6)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H5 4:30 | `pages/PurchaseOrders.tsx` — table: PO Number · Vendor · Total Amount · Status · Date; click → PO detail → `GET /api/purchase-orders` | PO list page loads |
| H5 4:45 | `pages/PODetail.tsx` — PO card: PO number, vendor name, line items table, subtotal, tax %, tax amount, grand total; status badge; **"Generate Invoice"** button → `POST /api/invoices` | Officer can view PO and generate invoice |
| H5 5:00 | `pages/Invoices.tsx` — table: Invoice Number · PO Ref · Issued Date · Due Date · Status; click → invoice detail | Invoice list page loads |
| H5 5:15 | `pages/InvoiceDetail.tsx` — full invoice layout: invoice number, dates, vendor info block, line items table, tax breakdown, grand total | Invoice detail renders correctly |
| H5 5:30 | **"Download PDF"** button → `GET /api/invoices/:id/pdf` → `response.blob()` → `URL.createObjectURL()` → trigger `<a download>` click | PDF downloads in browser |
| H5 5:40 | **"Print Invoice"** button → `window.print()` on invoice `div` with `@media print` CSS hiding nav/sidebar | Invoice prints cleanly |
| H5 5:50 | **"Send via Email"** button → `POST /api/invoices/:id/send-email` → show success toast: "Invoice sent to vendor@email.com ✅"; update status badge to `sent` | Email send confirmed in UI |

✅ **Phase 4 Checkpoint**: PO detail shows correct tax calculations. Invoice generates. PDF downloads. Print works. Email send triggers backend and shows confirmation.

---

### Phase 5 — Activity Logs + Analytics + Reports (Hour 6 → Hour 7)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H6 6:00 | `pages/ActivityLogs.tsx` — timeline view: icon + action label + entity type + entity ID + user name + timestamp; filter dropdown by entity type (rfq / quotation / po / invoice) → `GET /api/activity-logs` | Full audit log timeline renders |
| H6 6:20 | `pages/Reports.tsx` — three sections: Monthly Spend chart, Vendor Performance table, Category Spend chart | Reports page layout built |
| H6 6:25 | `components/charts/MonthlySpendChart.tsx` — Recharts `BarChart`; x-axis: months; y-axis: ₹ amount; data from `GET /api/reports/monthly-spend` | Monthly spending bar chart renders |
| H6 6:35 | `components/charts/CategorySpendChart.tsx` — Recharts `PieChart`; slices per vendor category; data from `GET /api/reports/category-spend` | Category spend pie chart renders |
| H6 6:45 | `components/reports/VendorPerformanceTable.tsx` — table: Vendor · Total POs · Avg Delivery Days · Avg Price · Rating; data from `GET /api/reports/vendor-performance` | Vendor performance table renders |

✅ **Phase 5 Checkpoint**: Activity log timeline shows all actions. All 3 analytics charts/tables render with real data.

---

### Phase 6 — Integration + Polish + Demo Prep (Hour 7 → Hour 8)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H7 7:00 | Replace all mock/hardcoded data with live API calls (React Query `useQuery` + `useMutation` for every page) | All pages show real backend data |
| H7 7:15 | Add `Skeleton` loaders on all pages while `isLoading` is true — no blank page flashes | Smooth loading states |
| H7 7:25 | Add `EmptyState` components: "No vendors yet", "No RFQs created", "No quotations received" | No blank white boxes |
| H7 7:35 | Add `ErrorBoundary` on each page — "Something went wrong" card with retry button | App doesn't white-screen on API error |
| H8 7:45 | Test complete flow in browser: Login → Vendor → RFQ → Quotation → Comparison → Approve → PO → Invoice → PDF | Zero broken steps in demo flow |
| H8 7:55 | Set up browser tabs for demo: Dashboard / Vendor List / RFQ Create / Comparison / Approval / Invoice | Demo tabs ready and preloaded |

✅ **Phase 6 Checkpoint**: All pages wired to live backend. Loading states and empty states present. Full flow works in browser. Demo tabs ready.

---

## 7. Member 2 — Backend Developer Roadmap

**Owns**: All Express routes, Prisma schema, business logic, JWT auth, PDF generation, email sending, AI proxy routes, analytics queries
**Never touches**: React component files, Python AI model code, DB server setup, Docker infrastructure

---

### Phase 0 — Setup + Auth API (Hour 1)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H1 0:00 | `npm init -y` → install: `express typescript ts-node prisma @prisma/client jsonwebtoken bcrypt zod nodemailer pdfkit cors dotenv` | Node.js + TypeScript project boots |
| H1 0:10 | Write `prisma/schema.prisma` — all 8 tables from Section 3 with correct enums and foreign keys | Prisma schema written |
| H1 0:15 | `npx prisma migrate dev --name init` → generates SQL and runs migration | PostgreSQL tables created |
| H1 0:20 | `middleware/auth.ts` — `verifyToken(req, res, next)`: reads `Authorization: Bearer <token>`, verifies JWT, attaches `req.user = { id, role }` | JWT middleware ready |
| H1 0:25 | `middleware/requireRole.ts` — `requireRole(['admin','officer'])` factory: checks `req.user.role`, returns 403 if unauthorized | Role guard middleware ready |
| H1 0:30 | `routes/auth.ts` — `POST /api/auth/signup`: hash password with bcrypt, save user, return JWT; `POST /api/auth/login`: verify password, return `{ token, role, user }` | Auth endpoints work |
| H1 0:50 | Helper: `utils/logActivity.ts` — `logActivity(userId, entityType, entityId, action, metadata?)` inserts row in `activity_logs` | Activity logger ready for all routes |

✅ **Phase 0 Checkpoint**: Express boots. Prisma connected to Postgres. Auth endpoints return JWT. Role middleware guards routes. Activity logger available.

---

### Phase 1 — Vendor + RFQ APIs (Hour 2)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H2 1:00 | `routes/vendors.ts` — `GET /api/vendors`: list with optional `?search=` (name ILIKE) + `?status=` filter; `POST /api/vendors`: create vendor (officer/admin only); `GET /api/vendors/:id`: detail; `PATCH /api/vendors/:id`: update fields + status | Vendor CRUD API complete |
| H2 1:20 | `routes/rfqs.ts` — `POST /api/rfqs`: create RFQ + bulk-insert `rfq_items` + bulk-insert `rfq_vendors`; `GET /api/rfqs`: list with `?status=` filter; `GET /api/rfqs/:id`: detail with items + vendors + quotation count | RFQ create and list APIs complete |
| H2 1:40 | `PATCH /api/rfqs/:id/status`: update RFQ status (open → closed → cancelled); log action | RFQ status update works |
| H2 1:50 | Call `logActivity()` inside every vendor and RFQ route mutation | All vendor/RFQ actions logged |

✅ **Phase 1 Checkpoint**: Vendor CRUD works. RFQ creation with items and vendor assignments works. All mutations logged.

---

### Phase 2 — Quotation + Approval APIs (Hour 3)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H3 2:00 | `routes/quotations.ts` — `GET /api/rfqs/:rfqId/quotations`: all quotations for an RFQ (officer/manager/admin); `POST /api/quotations`: vendor submits quotation (vendor role only, must be assigned to that RFQ); `PATCH /api/quotations/:id/status`: shortlist or reject | Quotation submission and status update work |
| H3 2:25 | `routes/approvals.ts` — `POST /api/approvals`: officer creates approval request for a shortlisted quotation → sets `approver_id` to a manager in the system; `GET /api/approvals`: manager sees all pending; officer sees own; paginated | Approval creation and list work |
| H3 2:45 | `POST /api/approvals/:id/approve`: set status → `approved`, save remarks, set `actioned_at` → **trigger PO creation** (calls internal `createPO()` function); log action | Approval triggers PO auto-generation |
| H3 2:55 | `POST /api/approvals/:id/reject`: set status → `rejected`, save remarks, log action | Rejection flow works |

✅ **Phase 2 Checkpoint**: Vendor quotation submission works. Officer can shortlist. Manager can approve (which auto-generates PO) or reject. All logged.

---

### Phase 3 — PO Auto-Generation + Invoice (Hour 3.5 → Hour 4.5)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H3 3:00 | `utils/generatePO.ts` — `createPO(quotationId)`: fetch quotation → compute `subtotal`, `tax_percent = 18`, `tax_amount`, `total_amount`; generate `po_number = PO-${year}-${padded 5-digit sequence}`; insert into `purchase_orders`; return PO | PO auto-generated on approval with correct tax math |
| H4 3:15 | `routes/purchaseOrders.ts` — `GET /api/purchase-orders`: list (officer/manager/admin); `GET /api/purchase-orders/:id`: detail with line items, vendor, tax breakdown; `PATCH /api/purchase-orders/:id/status`: issued → acknowledged → delivered | PO CRUD API complete |
| H4 3:30 | `routes/invoices.ts` — `POST /api/invoices`: officer generates invoice from PO → auto-generate `invoice_number = INV-${year}-${sequence}`; set `issued_date = today`, `due_date = today + 30 days`; status: `draft`; `GET /api/invoices`: list; `GET /api/invoices/:id`: detail | Invoice creation and list APIs complete |

✅ **Phase 3 Checkpoint**: Approval → PO → Invoice chain works end-to-end. PO number and invoice number auto-increment. Tax calculations correct.

---

### Phase 4 — PDF Generation + Email (Hour 4.5 → Hour 5.5)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H4 4:30 | `utils/generatePDF.ts` — using `pdfkit`: build invoice PDF layout: VendorBridge header, invoice number + dates, vendor block (name, GST, address), line items table (product · qty · unit price · total), divider line, subtotal row, GST 18% row, **Grand Total** row in bold, footer "Thank you for your business · VendorBridge" | Invoice PDF generates with correct layout |
| H5 5:00 | `GET /api/invoices/:id/pdf` — fetch invoice + PO + vendor from DB → call `generatePDF()` → `res.setHeader('Content-Type', 'application/pdf')` → stream PDF to client; also save file path to `invoices.pdf_url` | PDF endpoint streams downloadable PDF |
| H5 5:20 | `utils/sendEmail.ts` — Nodemailer transporter using Mailtrap SMTP (from `.env`); `sendInvoiceEmail(invoiceId)`: fetch invoice + vendor email → attach PDF → send; subject: `Invoice ${invoice_number} from VendorBridge` | Email utility sends PDF attachment |
| H5 5:35 | `POST /api/invoices/:id/send-email` — call `sendInvoiceEmail()` → update `invoices.emailed_at = now()`, `status = sent`; log action; return `{ success: true }` | Send-email endpoint works end-to-end |

✅ **Phase 4 Checkpoint**: PDF downloads correctly and has proper layout. Email arrives in Mailtrap with PDF attached. Invoice status updates to "sent".

---

### Phase 5 — Analytics + AI Proxy Routes (Hour 5.5 → Hour 7)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H6 5:45 | `routes/reports.ts` — `GET /api/reports/dashboard-summary`: counts: pending approvals, active RFQs, POs this month, sum of total_amount this month | Dashboard summary API complete |
| H6 6:00 | `GET /api/reports/monthly-spend` — `GROUP BY DATE_TRUNC('month', issued_at)`, `SUM(total_amount)` from `purchase_orders`; last 6 months | Monthly spend chart data ready |
| H6 6:10 | `GET /api/reports/vendor-performance` — per vendor: count of POs, avg delivery_days (from quotations), avg unit_price, avg rating | Vendor performance table data ready |
| H6 6:20 | `GET /api/reports/category-spend` — JOIN vendors → GROUP BY category → SUM total_amount | Category spend pie data ready |
| H6 6:30 | `GET /api/activity-logs` — paginated list with optional `?entity_type=` filter; include user name via JOIN | Activity logs API complete |
| H6 6:40 | **AI Proxy routes** — `POST /api/ai/recommend-vendors`: validate input with Zod → `axios.post('http://localhost:8000/recommend-vendors', body)` → return Python response; **hardcoded mock fallback** if Python is down | AI vendor recommender proxy with fallback |
| H6 6:55 | `POST /api/ai/rank-quotations`: proxy to `http://localhost:8000/rank-quotations`; **hardcoded mock fallback** (sort by price asc, label cheapest "Best Price") | AI quotation ranker proxy with fallback |

✅ **Phase 5 Checkpoint**: All analytics endpoints return correct aggregated data. AI proxy routes work when Python is up. Fallback mock response works when Python is down.

---

### Phase 6 — Integration + Testing (Hour 7 → Hour 8)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H7 7:00 | Test all endpoints in Postman: auth → vendor → RFQ → quotation → approval → PO → invoice → PDF → email | All endpoints return correct responses |
| H7 7:20 | Fix any Zod validation errors, Prisma query bugs, JWT middleware edge cases caught during M4 integration testing | All integration bugs fixed |
| H8 7:40 | Verify CORS is configured: `app.use(cors({ origin: 'http://localhost:5173' }))` | Frontend can call backend without CORS errors |
| H8 7:50 | Smoke test: trigger full flow via Postman: create RFQ → quotation → approval → PO → PDF download → email send | Full backend flow confirmed clean |

✅ **Phase 6 Checkpoint**: All routes tested. Bugs fixed. CORS working. Full backend flow verified.

---

## 8. Member 3 — AI/ML Engineer Roadmap

**Owns**: Python FastAPI microservice — vendor recommender, quotation ranker, spend forecaster, Pydantic schemas, all ML scoring logic
**Never touches**: Express route files, React component files, Prisma schema, PDF/email code, DB setup

---

### Phase 0 — Setup + Health Check (Hour 1, first 30 min)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H1 0:00 | `pip install fastapi uvicorn scikit-learn pandas numpy` → create `main.py` | FastAPI project boots |
| H1 0:05 | `main.py` — `app = FastAPI(title="VendorBridge AI Service")`; add CORS middleware: allow `http://localhost:3000` (Node.js origin) | CORS configured for Node.js proxy |
| H1 0:10 | `GET /health` → `{ "status": "ok", "service": "vendorbridge-ai" }` | Health check endpoint live |
| H1 0:15 | `schemas.py` — Pydantic models for all 3 endpoints (written first — share with M2 immediately): `VendorItem`, `RFQInput`, `QuotationItem`, `QuotationsInput`, `SpendPoint`, `SpendForecastInput` | **Schemas shared with M2 at Hour 1 end — M2 cannot build proxy without these** |
| H1 0:25 | `data/mock_vendors.json` — 8 mock vendors with: `id, name, category, avg_rating, avg_price, avg_delivery_days, total_pos` | Mock vendor data ready for recommender |

✅ **Phase 0 Checkpoint**: FastAPI boots on port 8000. Health check returns OK. Pydantic schemas written and shared with M2.

---

### Phase 1 — Vendor Recommendation Engine (Hour 1.5 → Hour 2.5)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H1 0:30 | `routers/recommend.py` — `POST /recommend-vendors` endpoint | Route file created |
| H2 1:00 | Input schema: `RFQInput { rfq_id, category, budget_estimate, deadline_days }` | Input validated via Pydantic |
| H2 1:10 | **Scoring logic**: for each vendor in the category: `rating_score = (avg_rating / 5) * 40`; `price_score = (1 - avg_price / max_price) * 30`; `delivery_score = (1 - avg_delivery_days / max_days) * 20`; `reliability_score = (total_pos / max_pos) * 10`; `total = sum` | Multi-criteria scoring formula implemented |
| H2 1:25 | Auto-generate `recommendation_reason` string: if rating top → "Top Rated"; if price lowest → "Best Price"; if delivery fastest → "Fastest Delivery"; combine for "Best Overall" | Human-readable reason per vendor |
| H2 1:35 | Return: `[{ vendor_id, vendor_name, score, rank, recommendation_reason }]` sorted by score desc | Endpoint returns ranked vendor list |
| H2 1:45 | Unit test: call with category "Furniture" → assert top vendor has highest total score | Recommender logic verified |

✅ **Phase 1 Checkpoint**: `/recommend-vendors` returns ranked vendor list with scores and human-readable reasons. Unit tested.

---

### Phase 2 — Quotation Ranking Engine (Hour 2.5 → Hour 3.5)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H2 2:00 | `routers/rank.py` — `POST /rank-quotations` endpoint | Route file created |
| H3 2:10 | Input schema: `QuotationsInput { rfq_id, quotations: [{ id, vendor_id, unit_price, delivery_days, vendor_rating }] }` | Input validated |
| H3 2:20 | **Scoring logic**: normalize each field 0–1 across all quotations: `price_score = (max_price - price) / (max_price - min_price) * 40`; `delivery_score = (max_days - days) / (max_days - min_days) * 30`; `rating_score = (rating / 5) * 30`; sum = `total_score` | Normalized multi-criteria scoring implemented |
| H3 2:35 | Assign badges: rank 1 overall → `"Best Overall ⭐"`; lowest price → `"Best Price 💰"`; fastest delivery → `"Fastest 🚀"`; rank 2 → `"Recommended"` | Badge assignment logic works |
| H3 2:45 | Return: `[{ quotation_id, vendor_id, total_score, rank, badge }]` sorted by rank asc | Endpoint returns ranked quotation list with badges |
| H3 2:55 | Edge case: if only 1 quotation → return it as "Best Overall" without dividing by zero | Zero-division guard added |

✅ **Phase 2 Checkpoint**: `/rank-quotations` returns ranked list with badges. Edge case (single quotation) handled.

---

### Phase 3 — Spend Forecaster (Hour 3.5 → Hour 4.5)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H3 3:00 | `routers/forecast.py` — `POST /spend-forecast` endpoint | Route file created |
| H4 3:15 | Input: `SpendForecastInput { monthly_spend: [{ month: "2026-01", amount: 420000 }] }` — last 6 months | Input schema validated |
| H4 3:25 | If `len(monthly_spend) < 3` → return `{ "error": "insufficient_data", "fallback": "need at least 3 months of data" }` | Guard against sparse data |
| H4 3:35 | Fit linear regression with `numpy.polyfit(x, y, 1)` where x = month index (0,1,2…); predict next 3 months | 3-month forecast generated |
| H4 3:50 | Assign confidence: if `r² > 0.8` → "high"; `0.5–0.8` → "medium"; `< 0.5` → "low"; compute r² using `numpy.corrcoef` | Confidence level assigned per forecast |
| H4 4:00 | Return: `{ forecast: [{ month, predicted_amount, confidence }], trend: "increasing/stable/decreasing" }` | Spend forecast endpoint complete |

✅ **Phase 3 Checkpoint**: `/spend-forecast` returns 3-month prediction with confidence levels and trend label.

---

### Phase 4 — Validation, Error Handling, Fallbacks (Hour 4.5 → Hour 5.5)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H4 4:30 | Wrap all endpoint logic in `try/except` → on error: return `HTTP 200` with `{ "error": "...", "fallback": <safe default response> }` | AI service never returns 500 to Node.js proxy |
| H5 4:45 | Fallback for `/recommend-vendors`: if scoring fails → return vendors sorted by `avg_rating` desc with `recommendation_reason: "Fallback: sorted by rating"` | Graceful degradation on recommender failure |
| H5 5:00 | Fallback for `/rank-quotations`: if scoring fails → sort by `unit_price` asc, assign `"Best Price"` badge to cheapest | Graceful degradation on ranker failure |
| H5 5:10 | Add request/response logging: `print(f"[AI] {endpoint} | input_size={n} | response_time={ms}ms")` to every route | Request tracing visible in terminal |
| H5 5:20 | Run `uvicorn main:app --host 0.0.0.0 --port 8000 --reload` — confirm all 3 endpoints accessible | AI service running and reachable from Node proxy |

✅ **Phase 4 Checkpoint**: All endpoints have try/except fallbacks. No 500s propagate to Node.js. Logging in place. Service running on port 8000.

---

### Phase 5 — Integration + Demo Prep (Hour 5.5 → Hour 8)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H6 5:30 | Coordinate with M2: confirm request/response JSON shapes match what Node.js proxy sends and expects | Zero shape mismatches between proxy and AI |
| H6 6:00 | Test via Postman: `POST http://localhost:8000/recommend-vendors` with real category/budget payload → verify ranked JSON response | Recommender confirmed end-to-end |
| H6 6:15 | Test via Node proxy: `POST http://localhost:3000/api/ai/recommend-vendors` → confirm response passes through unchanged | Proxy chain verified |
| H6 6:30 | Test quotation ranking with 4 sample quotations → verify badges assigned correctly | Ranker confirmed with multi-vendor input |
| H7 7:00 | Prepare 3 demo-ready payloads: RFQ with 4 vendors (recommender), 3 quotations (ranker), 6 months spend (forecast) — save as `.json` files | Demo payloads ready |
| H8 7:30 | Final sanity check: restart FastAPI → hit all 3 endpoints → confirm clean responses | All AI endpoints passing final check |

✅ **Phase 5 Checkpoint**: AI endpoints fully integrated with Node.js proxy. Demo payloads ready. All 3 AI features work end-to-end.

---

## 9. Member 4 — DevOps / Integration Support Roadmap

**Owns**: Database setup, `.env` configuration for all members, Prisma seed data, full integration testing, PDF/email infra config, bug triage, demo prep, deployment if time allows
**Never touches**: React component logic, Express business route handlers, Python ML scoring math, Pydantic schema definitions

---

### Phase 0 — Environment Setup for All Members (Hour 1)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H1 0:00 | Install + start PostgreSQL locally (or `docker run -e POSTGRES_PASSWORD=pass -p 5432:5432 postgres`) | PostgreSQL running on port 5432 |
| H1 0:05 | Create database: `psql -c "CREATE DATABASE vendorbridge_db;"` | DB exists and is accessible |
| H1 0:10 | Write `backend/.env` → share with M2 immediately: `DATABASE_URL`, `JWT_SECRET`, `PORT=3000`, `AI_SERVICE_URL=http://localhost:8000`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` | M2 has all credentials to start |
| H1 0:15 | Set up **Mailtrap** account (free) → copy SMTP credentials into `.env` | Email testing inbox ready |
| H1 0:20 | Write `ai/.env` → share with M3: `PORT=8000` | M3 can start Python service |
| H1 0:25 | Write `frontend/.env` → share with M1: `VITE_API_URL=http://localhost:3000` | M1 Axios base URL configured |

✅ **Phase 0 Checkpoint**: All 3 services have `.env` files. PostgreSQL running. Mailtrap SMTP credentials shared with M2. All members unblocked.

---

### Phase 1 — Prisma Migration + Seed Data (Hour 1.5 → Hour 2.5)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H1 0:30 | Once M2 writes `prisma/schema.prisma` → run: `npx prisma migrate dev --name init` | All 8 DB tables created |
| H1 0:40 | Verify migration in psql: `\dt` → confirm all tables present | Tables confirmed in database |
| H2 1:00 | Write `prisma/seed.ts` — **Users**: admin (admin@vb.com / Admin@123), officer (officer@vb.com / Officer@123), manager (manager@vb.com / Manager@123), vendor user (vendor@furnico.com / Vendor@123) | 4 demo-ready login accounts |
| H2 1:15 | Seed **8 Vendors** across 4 categories: IT (2), Furniture (2), Logistics (2), Stationery (2); each with realistic GST, rating, contact | Vendor list populated with realistic data |
| H2 1:25 | Seed **3 RFQs**: one `open` (Office Chairs, 2 line items, 3 vendors assigned), one `closed` with quotations, one `draft` | RFQ list shows variety of statuses |
| H2 1:35 | Seed **5 Quotations** across 2 open RFQs; one shortlisted | Quotation comparison has real data |
| H2 1:45 | Seed **1 approved Approval** → **1 issued PO** (PO-2026-00001) → **1 sent Invoice** (INV-2026-00001) | Dashboard and PO/Invoice pages show real records |
| H2 1:55 | Seed **10 activity_logs** entries spanning all entity types | Activity log timeline has realistic history |
| H2 2:00 | Run: `npx prisma db seed` → verify in Prisma Studio: `npx prisma studio` | Seed confirmed in Prisma Studio browser |

✅ **Phase 1 Checkpoint**: All 8 tables seeded with realistic demo data. 4 user accounts ready. Prisma Studio confirms data.

---

### Phase 2 — Backend API Testing (Hour 3 → Hour 4)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H3 2:30 | Import all API routes into **Postman collection** — organize into folders: Auth / Vendors / RFQs / Quotations / Approvals / POs / Invoices / Reports | Postman collection ready |
| H3 2:45 | Test auth: `POST /api/auth/login` with all 4 user credentials → verify JWT returned and role matches | Auth works for all roles |
| H3 3:00 | Test vendor CRUD: create → list → update status | Vendor endpoints confirmed |
| H3 3:15 | Test RFQ creation with items + vendor assignments → confirm DB has rfq_items and rfq_vendors rows | RFQ creation confirmed in DB |
| H3 3:30 | Test quotation submission (vendor token) → shortlist (officer token) → approval request → approval → PO auto-created | Full approval chain confirmed |
| H3 3:45 | Report any failures to M2 with exact request + response logged | M2 can fix bugs immediately |

✅ **Phase 2 Checkpoint**: All backend endpoints tested. Full chain from vendor → RFQ → quotation → approval → PO confirmed.

---

### Phase 3 — AI Service Integration Testing (Hour 4 → Hour 5)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H4 4:00 | Start Python FastAPI: `uvicorn main:app --port 8000` → test `GET http://localhost:8000/health` | AI service confirmed running |
| H4 4:10 | Test `POST http://localhost:8000/recommend-vendors` with 4-vendor Furniture payload → verify ranked JSON response | Recommender endpoint direct test passes |
| H4 4:20 | Test `POST http://localhost:8000/rank-quotations` with 3 quotations payload → verify badges assigned | Ranker endpoint direct test passes |
| H4 4:30 | Test **Node.js proxy**: `POST http://localhost:3000/api/ai/recommend-vendors` → confirm response passes through correctly | Proxy chain Node → Python works |
| H4 4:45 | **Simulate Python down**: stop FastAPI → test proxy → confirm Node.js returns fallback mock (not 500) | Graceful fallback confirmed |
| H4 4:55 | Report any shape mismatches between M2 proxy and M3 response to both members | M2 and M3 sync on payload shape |

✅ **Phase 3 Checkpoint**: AI endpoints tested directly and through proxy. Fallback works when Python is down.

---

### Phase 4 — PDF + Email Infrastructure Testing (Hour 5 → Hour 6)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H5 5:00 | Test `GET /api/invoices/INV-2026-00001/pdf` → verify response has `Content-Type: application/pdf` → open PDF in browser | PDF endpoint confirmed streaming correctly |
| H5 5:10 | Check PDF content visually: VendorBridge header, invoice number, vendor info, line items table, tax row, grand total row | PDF layout confirmed correct |
| H5 5:20 | Test `POST /api/invoices/INV-2026-00001/send-email` → check **Mailtrap inbox** → verify email received with subject and PDF attachment | Email with PDF attachment confirmed in Mailtrap |
| H5 5:30 | Verify `invoices.status` updated to `sent` and `emailed_at` populated in DB after email send | DB update after email confirmed |
| H5 5:40 | If PDF fails: assist M2 debugging PDFKit stream setup; if email fails: verify `.env` SMTP credentials match Mailtrap | PDF and email bugs resolved |

✅ **Phase 4 Checkpoint**: PDF downloads in browser with correct layout. Email arrives in Mailtrap with PDF attached. DB updated.

---

### Phase 5 — Full End-to-End Flow Testing (Hour 6 → Hour 7)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H6 6:00 | Open browser → start full flow test as each role in sequence: | |
| H6 6:05 | **Login as Officer** → Create new RFQ "IT Laptops Q3" → Add items → Click "AI Suggest Vendors" → Assign top 2 | RFQ created with AI suggestion working |
| H6 6:15 | **Login as Vendor** → View assigned RFQ → Submit quotation (₹85,000 / 10 days) | Quotation submitted from vendor side |
| H6 6:25 | **Login as Officer** → Quotation Comparison → Click "AI Rank" → See badge → Select vendor → Request approval | Comparison + AI rank + shortlist flow works |
| H6 6:35 | **Login as Manager** → Approvals → Approve with remark → PO auto-appears in PO list | Approval triggers PO generation |
| H6 6:45 | **Login as Officer** → PO Detail → Generate Invoice → Download PDF → Send Email | Full invoice flow works end-to-end |
| H6 6:55 | Check Dashboard → all 4 stat cards updated; Activity Logs → all 8+ actions logged | Dashboard and logs reflect all actions |
| H7 7:00 | Log all bugs found → assign to M1, M2, or M3 with exact steps to reproduce | Bug list with assignees |

✅ **Phase 5 Checkpoint**: Complete procurement flow works in browser with all 4 roles. All actions logged. Dashboard updated.

---

### Phase 6 — Demo Prep + Deployment (Hour 7 → Hour 8)

| ⏱ Time | Task | Deliverable |
|---|---|---|
| H7 7:15 | Re-run fresh seed: `npx prisma db seed` → verify clean demo state | Demo DB is clean and realistic |
| H7 7:20 | Confirm all 4 login credentials work: admin / officer / manager / vendor | All demo logins confirmed |
| H7 7:30 | Open and preload browser tabs for demo flow: Login · Dashboard · Vendor List · New RFQ · Quotation Comparison · Approvals · PO Detail · Invoice | 8 demo tabs preloaded in correct order |
| H7 7:40 | **Deployment (if time allows)**: push backend to Railway → Python FastAPI to Railway (separate service) → React to Vercel; update `.env` with production URLs | Live production URL available |
| H8 7:50 | Final pre-demo check: click through all 8 tabs → confirm no errors, data loads, AI badges show | Zero broken steps 10 min before demo |
| H8 7:58 | Paste production URL (or localhost URL) in demo notes → ready | Team ready to present |

✅ **Phase 6 Checkpoint**: Demo data fresh. All tabs preloaded. Deployed or localhost confirmed clean. Team ready.

---

## 10. API Reference

### Auth
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login → returns JWT + role |

### Vendors
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/vendors` | All | List with `?search=` and `?status=` filter |
| POST | `/api/vendors` | Admin, Officer | Create vendor |
| GET | `/api/vendors/:id` | All | Vendor detail |
| PATCH | `/api/vendors/:id` | Admin, Officer | Update vendor fields |

### RFQs
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/rfqs` | All | List with `?status=` filter |
| POST | `/api/rfqs` | Officer | Create RFQ with items + vendor assignments |
| GET | `/api/rfqs/:id` | All | RFQ detail with items + quotations |
| PATCH | `/api/rfqs/:id/status` | Officer | Update status |

### Quotations
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/rfqs/:rfqId/quotations` | Officer, Manager, Admin | All quotations for an RFQ |
| POST | `/api/quotations` | Vendor | Submit quotation |
| PATCH | `/api/quotations/:id/status` | Officer | Shortlist or reject |

### Approvals
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/approvals` | Officer | Request approval for shortlisted quotation |
| GET | `/api/approvals` | Manager, Officer | List approvals |
| POST | `/api/approvals/:id/approve` | Manager | Approve with remarks → triggers PO |
| POST | `/api/approvals/:id/reject` | Manager | Reject with remarks |

### Purchase Orders
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/purchase-orders` | Officer, Manager, Admin | List POs |
| GET | `/api/purchase-orders/:id` | Officer, Manager, Admin | PO detail with tax breakdown |
| PATCH | `/api/purchase-orders/:id/status` | Officer | Update status |

### Invoices
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/invoices` | Officer | Generate invoice from PO |
| GET | `/api/invoices` | Officer, Manager, Admin | List invoices |
| GET | `/api/invoices/:id` | Officer, Manager, Admin | Invoice detail |
| GET | `/api/invoices/:id/pdf` | Officer | Download PDF |
| POST | `/api/invoices/:id/send-email` | Officer | Send invoice email to vendor |

### Reports & Logs
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/reports/dashboard-summary` | All | Counts for dashboard cards |
| GET | `/api/reports/monthly-spend` | All | Monthly spend chart data |
| GET | `/api/reports/vendor-performance` | All | Vendor stats table |
| GET | `/api/reports/category-spend` | All | Spend by category |
| GET | `/api/activity-logs` | All | Paginated audit log |

### AI Proxy (Node → Python)
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/ai/recommend-vendors` | Officer | Ranked vendor suggestions for an RFQ |
| POST | `/api/ai/rank-quotations` | Officer | Rank quotations with badges |
| POST | `/api/ai/spend-forecast` | Admin, Manager | Predict next 3 months spend |

---

## 11. Hour-by-Hour Team Build Order

| Hour | M1 Frontend | M2 Backend | M3 AI/ML | M4 DevOps |
|---|---|---|---|---|
| **H1** (0–1h) | Project setup + Auth screens + Sidebar | Express setup + Prisma schema + Auth API | FastAPI setup + Pydantic schemas + health check | DB setup + `.env` for all 3 + Mailtrap |
| **H2** (1–2h) | Dashboard + Vendor list + Vendor modal | Vendor CRUD + RFQ APIs | Vendor recommender scoring engine | Prisma seed data + Prisma Studio verify |
| **H3** (2–3h) | RFQ create (with AI button) + RFQ list | Quotation + Approval APIs | Quotation ranking engine + badges | Postman API testing — report bugs to M2 |
| **H4** (3–4h) | Comparison table + AI badges + Approval UI | PO auto-generation + Invoice creation | Spend forecaster + Pydantic validation | AI proxy integration test + fallback verify |
| **H5** (4–5h) | PO detail + Invoice detail + PDF download | PDF generation (PDFKit) + Email send | Error handling + fallbacks + logging | PDF and email infra test via Postman |
| **H6** (5–6h) | Activity logs + Analytics charts | Analytics APIs + AI proxy routes | FastAPI integration + endpoint verify | Full end-to-end browser flow test |
| **H7** (6–7h) | Wire all pages to live API + skeleton loaders | Fix integration bugs from M4 testing | Demo payload prep + final endpoint checks | Bug triage → assign to M1/M2/M3 |
| **H8** (7–8h) | Polish + demo tab setup + empty states | Final smoke test via Postman | Final AI sanity check | Fresh seed + deployment / demo ready |

---

## 12. Role Boundary Rules — No Overlap

### ✅ Ownership Matrix

| | M1 Frontend | M2 Backend | M3 AI/ML | M4 DevOps |
|---|---|---|---|---|
| React components + pages | ✅ | ❌ | ❌ | ❌ |
| Tailwind CSS styling | ✅ | ❌ | ❌ | ❌ |
| Zustand + React Query | ✅ | ❌ | ❌ | ❌ |
| Axios API calls (frontend) | ✅ | ❌ | ❌ | ❌ |
| Express route handlers | ❌ | ✅ | ❌ | ❌ |
| Prisma schema + queries | ❌ | ✅ | ❌ | ❌ |
| PDF generation (PDFKit) | ❌ | ✅ | ❌ | ❌ |
| Email sending (Nodemailer) | ❌ | ✅ | ❌ | ❌ |
| Business logic (JS/TS) | ❌ | ✅ | ❌ | ❌ |
| Python FastAPI routes | ❌ | ❌ | ✅ | ❌ |
| ML scoring math | ❌ | ❌ | ✅ | ❌ |
| Pydantic schemas | ❌ | ❌ | ✅ | ❌ |
| DB server setup | ❌ | ❌ | ❌ | ✅ |
| `.env` files for all services | ❌ | ❌ | ❌ | ✅ |
| Prisma seed data | ❌ | ❌ | ❌ | ✅ |
| Integration testing | ❌ | ❌ | ❌ | ✅ |
| Deployment | ❌ | ❌ | ❌ | ✅ |

### ❌ Explicitly Forbidden Cross-Boundary Actions

| Forbidden | Why |
|---|---|
| M1 writing Express route files | Creates conflicting API logic, breaks M2's auth/validation chain |
| M2 editing React component files | Component state is M1's domain; edits break React Query cache and Zustand store |
| M3 modifying Node.js proxy handler code | M3 defines the Python API shape; M2 writes the proxy that calls it |
| M2 writing Python scoring math | Scoring belongs to M3; M2 only calls it via HTTP and handles the fallback |
| M4 adding business logic to Express routes | Route business logic is M2's domain; M4 only tests the output |
| M1 running Prisma migrations | Schema is M2's source of truth; M1 adapts API calls to what M2 defines |

### 🤝 Required Handshakes

| Handshake | Who | When | What to Share |
|---|---|---|---|
| **DB credentials** | M4 → M2 | H1 start | `DATABASE_URL`, psql access |
| **Email credentials** | M4 → M2 | H1 start | Mailtrap SMTP host/port/user/pass |
| **AI service URL** | M4 → M2 | H1 start | `AI_SERVICE_URL=http://localhost:8000` |
| **Frontend API URL** | M4 → M1 | H1 start | `VITE_API_URL=http://localhost:3000` |
| **Pydantic schemas / AI contracts** | M3 → M2 | H1 end | Exact request + response JSON for all 3 AI endpoints |
| **API endpoint list** | M2 → M1 | H2 start | All routes, methods, request/response shapes |
| **Seed data confirmed** | M4 → All | H2 end | "Seed ran, Prisma Studio shows data" |
| **Integration sync** | All 4 | H6 | Full browser flow test together |

---

## 13. Hackathon Survival Rules

| Rule | Detail |
|---|---|
| **M4 owns the DB — nobody else touches it** | Only M4 creates the database and runs seeds. M2 writes `schema.prisma`; M4 runs the migration. |
| **M3 shares AI contracts at Hour 1 end** | M3 must paste the exact request/response JSON for all 3 AI endpoints in the team chat by end of Hour 1. M2 cannot build the proxy without this. |
| **M1 uses mock data until Hour 7** | M1 should NOT wait for the backend. Hardcode realistic JSON for the first 6 hours. Wire live APIs in Hour 7. |
| **M2 stubs AI proxy routes immediately** | By Hour 3, M2 should have `/api/ai/*` routes returning hardcoded mock responses — real Python proxy replaces them in Hour 6. Demo never breaks if Python is down. |
| **Graceful AI fallback is mandatory** | If Python AI is down during demo, Node.js returns a hardcoded ranked response. The demo must not break. |
| **No shared file edits at the same time** | `package.json`, `.env`, `schema.prisma` — announce in team chat before editing. Last-write-wins causes lost work. |
| **Quick syncs at H2, H4, H6** | 5-minute check-in: what's done, what's blocked, what needs from another member. Do not skip. |
| **Fresh seed 30 minutes before demo** | M4 runs `npx prisma db seed` 30 min before demo to ensure clean, realistic data is visible. |
| **PDF must be verified 1 hour before demo** | Test PDF download in the actual browser being used for demo. Different browsers handle blobs differently. |

### Priority Cut List

```
MUST SHIP (Non-Negotiable Core):
  ✅ Login with 4 roles (officer, vendor, manager, admin)
  ✅ Vendor registration and list
  ✅ RFQ creation with line items and vendor assignment
  ✅ Vendor quotation submission
  ✅ Quotation comparison table (side-by-side)
  ✅ Approval workflow (request → approve / reject)
  ✅ PO auto-generation on approval with tax calculations
  ✅ Invoice generation from PO
  ✅ Invoice PDF download
  ✅ Dashboard with 4 stat cards

SHIP IF TIME:
  ⚡ AI vendor recommendation on RFQ creation
  ⚡ AI quotation ranking with badge highlights on comparison table
  ⚡ Send invoice via email (Nodemailer + Mailtrap)
  ⚡ Activity logs timeline screen
  ⚡ Monthly spending bar chart (Recharts)
  ⚡ Vendor performance analytics table
  ⚡ Category spend pie chart

STRETCH / DROP IF NEEDED:
  🔵 Spend forecast (3-month prediction chart)
  🔵 CSV export for reports
  🔵 Full deployment to Railway + Vercel
  🔵 Vendor email notification on RFQ invite
  🔵 Print invoice (window.print)
```

---

## 14. Demo Script

```
TIME    SPEAKER   ACTION
────────────────────────────────────────────────────────────────────────
0:00    M4        "Procurement in most organizations is a mess of
                   email threads, Excel sheets, and WhatsApp messages.
                   Quotations get lost. Approvals are verbal.
                   Invoices are typed in MS Word. There's no audit trail.
                   VendorBridge ends all of that."

0:20    M4        Problem slide: manual chaos vs VendorBridge workflow

0:35    M1        Open browser → Login as Admin → Dashboard
                  Show: 2 pending approvals | 3 active RFQs | ₹4.2L spend this month
                  "The dashboard gives your procurement team a live view of
                   everything — no spreadsheet needed."

0:55    M1        Vendors tab → Show vendor list (8 vendors, categories, ratings)
                  Click "Add Vendor" → fill: FurniCo, Furniture, GST 27ABCDE1234F1Z5
                  → Submit → vendor appears instantly in list

1:15    M1        Login as Procurement Officer
                  Click "New RFQ" → title: "Office Chairs Q3", deadline: 15 days
                  Add items: "Ergonomic Chair × 50", "Standing Desk × 20"

1:30    M1        Click "AI Suggest Vendors" →
                  Ranked list appears:
                  1. FurniCo — Score 87 — "Best Price + Fast Delivery"
                  2. OfficeWorld — Score 74 — "Top Rated"
                  3. DeskMart — Score 61 — "Reliable"
                  Assign top 3 → Submit RFQ

1:45    M3        "Our vendor recommendation engine scores every supplier
                   on past rating, price competitiveness, delivery speed,
                   and order reliability — all normalized and weighted.
                   No more guessing who to invite."

2:00    M1        Login as Vendor (FurniCo) → sees "Office Chairs Q3" RFQ
                  Click "Submit Quotation" → ₹8,500/unit | 12 days delivery
                  → Submit → status: submitted ✅

2:15    M1        Login as Officer → Quotation Comparison for "Office Chairs Q3"
                  Side-by-side table: 3 vendors, prices, delivery days, ratings
                  FurniCo row highlighted green (lowest price)
                  Click "AI Rank Quotations" →
                  FurniCo badge: "Best Overall ⭐" | OfficeWorld: "Fastest 🚀"

2:30    M2        "Every comparison is data-driven. AI normalizes price, speed,
                   and rating across all quotations and assigns a transparent score.
                   The procurement team sees exactly why a vendor ranks first."

2:45    M1        Click "Select FurniCo" → Request Approval
                  Login as Manager → Approvals screen
                  See: "Office Chairs Q3 — FurniCo — ₹4,25,000"
                  Click Approve → remark: "Verified GST and delivery terms"
                  → Status: Approved ✅

3:00    M1        Purchase Orders tab → PO-2026-00001 auto-generated
                  Show: Ergonomic Chair ×50 | ₹4,25,000 subtotal
                  GST 18%: ₹76,500 | Grand Total: ₹5,01,500
                  Click "Generate Invoice" → INV-2026-00001 created

3:15    M1        Invoice detail screen → all line items visible
                  Click "Download PDF" → PDF opens in browser tab
                  (Professional layout: VendorBridge header, GST breakdown, totals)
                  Click "Send via Email" →
                  "Invoice sent to vendor@furnico.com ✅"

3:25    M4        Open Mailtrap inbox live → show received email
                  Subject: "Invoice INV-2026-00001 from VendorBridge"
                  PDF attachment visible and downloadable

3:35    M1        Dashboard → Activity Logs → full timeline:
                  RFQ created → Quotation submitted → Approved → PO generated →
                  Invoice sent — every action, every actor, every timestamp

3:45    M4        "From vendor registration to signed invoice in under
                   4 minutes. AI-powered. Role-based. Fully auditable.
                   PDF-ready. Email-ready. This is VendorBridge.
                   Thank you."
────────────────────────────────────────────────────────────────────────
```

---

*📋 VendorBridge — Procurement & Vendor Management ERP — Hackathon Roadmap*
*4-Member Team | 8 Hours | Roles: Frontend · Backend · AI/ML · DevOps*
*"Right vendor. Right price. Right time. Every time."*
