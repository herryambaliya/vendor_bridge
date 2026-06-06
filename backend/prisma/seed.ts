// prisma/seed.ts
// VendorBridge — Complete Seed File
// Member 4 — Run with: npx prisma db seed

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting VendorBridge seed...");

  // ─────────────────────────────────────────────
  // STEP 1 — CLEAN ALL TABLES (safe re-seed)
  // ─────────────────────────────────────────────
  await prisma.activityLog.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.rfqVendor.deleteMany();
  await prisma.rfqItem.deleteMany();
  await prisma.rfq.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();

  console.log("🗑️  Cleared existing data");

  // ─────────────────────────────────────────────
  // STEP 2 — USERS (4 demo accounts)
  // ─────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const officerPassword = await bcrypt.hash("Officer@123", 10);
  const managerPassword = await bcrypt.hash("Manager@123", 10);
  const vendorPassword = await bcrypt.hash("Vendor@123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Arjun Mehta",
      email: "admin@vb.com",
      password: adminPassword,
      role: "admin",
    },
  });

  const officer = await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "officer@vb.com",
      password: officerPassword,
      role: "officer",
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: "Ravi Patel",
      email: "manager@vb.com",
      password: managerPassword,
      role: "manager",
    },
  });

  const vendorUser = await prisma.user.create({
    data: {
      name: "FurniCo Sales",
      email: "vendor@furnico.com",
      password: vendorPassword,
      role: "vendor",
    },
  });

  console.log("✅ Users seeded (4 accounts)");

  // ─────────────────────────────────────────────
  // STEP 3 — VENDORS (8 vendors, 4 categories)
  // ─────────────────────────────────────────────

  // --- IT Vendors ---
  const techSupply = await prisma.vendor.create({
    data: {
      name: "TechSupply Co",
      category: "IT",
      gst_number: "27AABCT1234C1ZP",
      email: "suresh@techsupply.com",
      phone: "9876543210",
      address: "42, Tech Park, Pune, Maharashtra 411001",
      status: "active",
      created_by: admin.id,
      rating: 4.5,
    },
  });

  const digiMart = await prisma.vendor.create({
    data: {
      name: "DigiMart Solutions",
      category: "IT",
      gst_number: "29AABCD5678E1ZQ",
      email: "kavita@digimart.com",
      phone: "9123456789",
      address: "15, Electronic City, Bangalore, Karnataka 560100",
      status: "active",
      created_by: admin.id,
      rating: 4.1,
    },
  });

  // --- Furniture Vendors ---
  const furniCo = await prisma.vendor.create({
    data: {
      name: "FurniCo",
      category: "Furniture",
      gst_number: "27ABCDE1234F1Z5",
      email: "vendor@furnico.com",
      phone: "9988776655",
      address: "8, Industrial Area, Surat, Gujarat 395003",
      status: "active",
      created_by: admin.id,
      rating: 4.2,
    },
  });

  const officeWorld = await prisma.vendor.create({
    data: {
      name: "OfficeWorld",
      category: "Furniture",
      gst_number: "24AABCO9012G1ZR",
      email: "sales@officeworld.in",
      phone: "9871234560",
      address: "22, Furniture Hub, Ahmedabad, Gujarat 380015",
      status: "active",
      created_by: admin.id,
      rating: 3.9,
    },
  });

  // --- Logistics Vendors ---
  const fastShip = await prisma.vendor.create({
    data: {
      name: "FastShip Logistics",
      category: "Logistics",
      gst_number: "06AABCF3456H1ZS",
      email: "amit@fastship.com",
      phone: "9001234567",
      address: "5, Logistics Hub, Gurugram, Haryana 122001",
      status: "active",
      created_by: admin.id,
      rating: 4.3,
    },
  });

  const quickMove = await prisma.vendor.create({
    data: {
      name: "QuickMove Cargo",
      category: "Logistics",
      gst_number: "08AABCQ7890I1ZT",
      email: "sneha@quickmove.in",
      phone: "9112345678",
      address: "18, Transport Nagar, Jaipur, Rajasthan 302013",
      status: "active",
      created_by: admin.id,
      rating: 3.7,
    },
  });

  // --- Stationery Vendors ---
  const paperPlus = await prisma.vendor.create({
    data: {
      name: "PaperPlus",
      category: "Stationery",
      gst_number: "27AABCP2345J1ZU",
      email: "neha@paperplus.com",
      phone: "9345678901",
      address: "3, Stationery Market, Mumbai, Maharashtra 400003",
      status: "active",
      created_by: admin.id,
      rating: 4.0,
    },
  });

  const statZone = await prisma.vendor.create({
    data: {
      name: "StatZone",
      category: "Stationery",
      gst_number: "09AABCS6789K1ZV",
      email: "vikram@statzone.in",
      phone: "9456789012",
      address: "11, Office Complex, Noida, UP 201301",
      status: "inactive",
      created_by: admin.id,
      rating: 3.5,
    },
  });

  console.log("✅ Vendors seeded (8 vendors across 4 categories)");

  // ─────────────────────────────────────────────
  // STEP 4 — RFQs (3 RFQs with different statuses)
  // ─────────────────────────────────────────────

  // RFQ 1 — OPEN (main demo RFQ)
  const rfq1 = await prisma.rfq.create({
    data: {
      title: "Office Chairs Q3",
      description:
        "Procurement of ergonomic office chairs and standing desks for the new office wing. Vendors must provide GST invoice.",
      status: "open",
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      created_by: officer.id,
    },
  });

  // RFQ 1 line items
  await prisma.rfqItem.createMany({
    data: [
      {
        rfq_id: rfq1.id,
        product_name: "Ergonomic Chair",
        quantity: 50,
        unit: "pcs",
        estimated_price: 8500.0,
      },
      {
        rfq_id: rfq1.id,
        product_name: "Standing Desk",
        quantity: 20,
        unit: "pcs",
        estimated_price: 12000.0,
      },
    ],
  });

  // RFQ 1 vendor assignments
  await prisma.rfqVendor.createMany({
    data: [
      { rfq_id: rfq1.id, vendor_id: furniCo.id },
      { rfq_id: rfq1.id, vendor_id: officeWorld.id },
      { rfq_id: rfq1.id, vendor_id: digiMart.id },
    ],
  });

  // RFQ 2 — CLOSED (has quotations and full approved chain)
  const rfq2 = await prisma.rfq.create({
    data: {
      title: "IT Laptops Q2",
      description:
        "Bulk procurement of laptops for the engineering and design teams. Must include warranty and AMC support.",
      status: "closed",
      deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      created_by: officer.id,
    },
  });

  await prisma.rfqItem.createMany({
    data: [
      {
        rfq_id: rfq2.id,
        product_name: 'Laptop 15" (i7, 16GB RAM, 512GB SSD)',
        quantity: 30,
        unit: "pcs",
        estimated_price: 85000.0,
      },
      {
        rfq_id: rfq2.id,
        product_name: "Laptop Bag",
        quantity: 30,
        unit: "pcs",
        estimated_price: 1500.0,
      },
      {
        rfq_id: rfq2.id,
        product_name: "External Mouse",
        quantity: 30,
        unit: "pcs",
        estimated_price: 800.0,
      },
    ],
  });

  await prisma.rfqVendor.createMany({
    data: [
      { rfq_id: rfq2.id, vendor_id: techSupply.id },
      { rfq_id: rfq2.id, vendor_id: digiMart.id },
    ],
  });

  // RFQ 3 — DRAFT
  const rfq3 = await prisma.rfq.create({
    data: {
      title: "Annual Stationery Supply",
      description:
        "Annual stationery procurement for all departments. Includes pens, notebooks, files, and printer cartridges.",
      status: "draft",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      created_by: officer.id,
    },
  });

  await prisma.rfqItem.createMany({
    data: [
      {
        rfq_id: rfq3.id,
        product_name: "A4 Notebooks (200 pages)",
        quantity: 500,
        unit: "pcs",
        estimated_price: 80.0,
      },
      {
        rfq_id: rfq3.id,
        product_name: "Ball Pens (Blue)",
        quantity: 1000,
        unit: "pcs",
        estimated_price: 10.0,
      },
      {
        rfq_id: rfq3.id,
        product_name: "Printer Cartridge (HP 803)",
        quantity: 50,
        unit: "pcs",
        estimated_price: 3000.0,
      },
    ],
  });

  console.log("✅ RFQs seeded (open, closed, draft)");

  // ─────────────────────────────────────────────
  // STEP 5 — QUOTATIONS (5 quotations)
  // ─────────────────────────────────────────────

  // Quotations for RFQ 1 (Office Chairs) — 3 vendors quoted
  const q1 = await prisma.quotation.create({
    data: {
      rfq_id: rfq1.id,
      vendor_id: furniCo.id,
      unit_price: 8500.0,
      delivery_days: 12,
      notes:
        "Includes 1-year warranty and free installation. GST invoice provided.",
      status: "submitted",
    },
  });

  const q2 = await prisma.quotation.create({
    data: {
      rfq_id: rfq1.id,
      vendor_id: officeWorld.id,
      unit_price: 9200.0,
      delivery_days: 8,
      notes:
        "Premium ergonomic range. Fastest delivery. Bulk discount applicable on 100+ units.",
      status: "submitted",
    },
  });

  const q3 = await prisma.quotation.create({
    data: {
      rfq_id: rfq1.id,
      vendor_id: digiMart.id,
      unit_price: 10100.0,
      delivery_days: 18,
      notes: "Imported chairs with 2-year warranty. Subject to GST @ 18%.",
      status: "submitted",
    },
  });

  // Quotations for RFQ 2 (IT Laptops) — 2 vendors, one shortlisted (for demo chain)
  const q4 = await prisma.quotation.create({
    data: {
      rfq_id: rfq2.id,
      vendor_id: techSupply.id,
      unit_price: 85000.0,
      delivery_days: 10,
      notes:
        "Dell Inspiron 15. Includes 3-year on-site warranty and 1-year AMC. Certified reseller.",
      status: "shortlisted",
    },
  });

  const q5 = await prisma.quotation.create({
    data: {
      rfq_id: rfq2.id,
      vendor_id: digiMart.id,
      unit_price: 88000.0,
      delivery_days: 14,
      notes:
        "HP ProBook 450. Includes 2-year warranty. Delivery from central warehouse.",
      status: "rejected",
    },
  });

  console.log("✅ Quotations seeded (5 quotations, 1 shortlisted)");

  // ─────────────────────────────────────────────
  // STEP 6 — APPROVAL (1 approved → triggers PO)
  // ─────────────────────────────────────────────

  const approval = await prisma.approval.create({
    data: {
      quotation_id: q4.id,
      requested_by: officer.id,
      approver_id: manager.id,
      status: "approved",
      remarks:
        "Verified GST registration and delivery terms. TechSupply has excellent track record. Approved.",
      actioned_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  });

  console.log("✅ Approval seeded (approved)");

  // ─────────────────────────────────────────────
  // STEP 7 — PURCHASE ORDER (auto-generated from approval)
  // ─────────────────────────────────────────────

  const subtotal = 2550000.0;
  const taxPercent = 18;
  const taxAmount = subtotal * (taxPercent / 100); // 459000
  const totalAmount = subtotal + taxAmount; // 3009000

  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      po_number: "PO-2026-00001",
      quotation_id: q4.id,
      vendor_id: techSupply.id,
      subtotal: subtotal,
      tax_percent: taxPercent,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: "issued",
      issued_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("✅ Purchase Order seeded (PO-2026-00001)");

  // ─────────────────────────────────────────────
  // STEP 8 — INVOICE (generated from PO)
  // ─────────────────────────────────────────────

  const issuedDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // yesterday
  const dueDate = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000); // 29 days from now

  const invoice = await prisma.invoice.create({
    data: {
      invoice_number: "INV-2026-00001",
      po_id: purchaseOrder.id,
      vendor_id: purchaseOrder.vendor_id,
      issued_date: issuedDate,
      due_date: dueDate,
      status: "sent",
      pdf_url: "/invoices/INV-2026-00001.pdf",
      emailed_at: new Date(Date.now() - 23 * 60 * 60 * 1000), // 23 hours ago
    },
  });

  console.log("✅ Invoice seeded (INV-2026-00001)");

  // ─────────────────────────────────────────────
  // STEP 9 — ACTIVITY LOGS (10 realistic entries)
  // ─────────────────────────────────────────────

  const logs = [
    {
      user_id: officer.id,
      entity_type: "rfq",
      entity_id: rfq2.id,
      action: "created",
      metadata: { title: "IT Laptops Q2", vendors_assigned: 2 },
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
    {
      user_id: officer.id,
      entity_type: "rfq",
      entity_id: rfq1.id,
      action: "created",
      metadata: { title: "Office Chairs Q3", vendors_assigned: 3 },
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      user_id: vendorUser.id,
      entity_type: "quotation",
      entity_id: q4.id,
      action: "submitted",
      metadata: {
        vendor: "TechSupply Co",
        unit_price: 85000,
        rfq: "IT Laptops Q2",
      },
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      user_id: vendorUser.id,
      entity_type: "quotation",
      entity_id: q1.id,
      action: "submitted",
      metadata: {
        vendor: "FurniCo",
        unit_price: 8500,
        rfq: "Office Chairs Q3",
      },
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      user_id: officer.id,
      entity_type: "quotation",
      entity_id: q4.id,
      action: "shortlisted",
      metadata: { vendor: "TechSupply Co", reason: "Best price and delivery" },
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      user_id: officer.id,
      entity_type: "approval",
      entity_id: approval.id,
      action: "requested",
      metadata: {
        quotation_id: q4.id,
        vendor: "TechSupply Co",
        amount: 3009000,
      },
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      user_id: manager.id,
      entity_type: "approval",
      entity_id: approval.id,
      action: "approved",
      metadata: { remarks: "Verified GST and delivery terms", amount: 3009000 },
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      user_id: officer.id,
      entity_type: "po",
      entity_id: purchaseOrder.id,
      action: "created",
      metadata: {
        po_number: "PO-2026-00001",
        vendor: "TechSupply Co",
        total: 3009000,
      },
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      user_id: officer.id,
      entity_type: "invoice",
      entity_id: invoice.id,
      action: "created",
      metadata: {
        invoice_number: "INV-2026-00001",
        po_number: "PO-2026-00001",
      },
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      user_id: officer.id,
      entity_type: "invoice",
      entity_id: invoice.id,
      action: "emailed",
      metadata: {
        invoice_number: "INV-2026-00001",
        sent_to: "suresh@techsupply.com",
      },
      created_at: new Date(Date.now() - 23 * 60 * 60 * 1000),
    },
  ];

  for (const log of logs) {
    await prisma.activityLog.create({ data: log });
  }

  console.log("✅ Activity logs seeded (10 entries)");

  // ─────────────────────────────────────────────
  // DONE
  // ─────────────────────────────────────────────
  console.log("");
  console.log("🎉 VendorBridge seed complete!");
  console.log("");
  console.log("📋 Demo Login Credentials:");
  console.log("   Admin    → admin@vb.com       / Admin@123");
  console.log("   Officer  → officer@vb.com     / Officer@123");
  console.log("   Manager  → manager@vb.com     / Manager@123");
  console.log("   Vendor   → vendor@furnico.com / Vendor@123");
  console.log("");
  console.log("📦 Seeded Data Summary:");
  console.log("   Users:          4");
  console.log(
    "   Vendors:        8  (IT×2, Furniture×2, Logistics×2, Stationery×2)"
  );
  console.log("   RFQs:           3  (open, closed, draft)");
  console.log("   Quotations:     5  (1 shortlisted, 1 rejected, 3 submitted)");
  console.log("   Approvals:      1  (approved)");
  console.log("   Purchase Orders:1  (PO-2026-00001, issued)");
  console.log("   Invoices:       1  (INV-2026-00001, sent)");
  console.log("   Activity Logs:  10 entries");
  console.log("");
  console.log("🔍 Verify with: npx prisma studio");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
