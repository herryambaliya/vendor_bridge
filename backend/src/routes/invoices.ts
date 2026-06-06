import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { verifyToken, AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { logActivity } from '../utils/logActivity';
import { generatePDF } from '../utils/generatePDF';
import { sendInvoiceEmail } from '../utils/sendEmail';

const router = Router();
const prisma = new PrismaClient();

// All invoice routes require authentication
router.use(verifyToken);

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const createInvoiceSchema = z.object({
  po_id: z.string().uuid('Invalid PO ID'),
});

// ─── POST /api/invoices ───────────────────────────────────────────────────────

router.post(
  '/',
  requireRole(['officer']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = createInvoiceSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
      }

      const { po_id } = parsed.data;
      const userId = (req as AuthenticatedRequest).user.id;

      // PO must exist
      const po = await prisma.purchaseOrder.findUnique({ where: { id: po_id } });
      if (!po) {
        res.status(404).json({ error: 'Purchase order not found' });
        return;
      }

      // Prevent duplicate invoices for the same PO
      const existing = await prisma.invoice.findFirst({ where: { po_id } });
      if (existing) {
        res.status(400).json({ error: 'An invoice already exists for this purchase order' });
        return;
      }

      // Generate sequential invoice number: INV-{YEAR}-{00001}
      const year = new Date().getFullYear();
      const count = await prisma.invoice.count();
      const invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;

      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 30);

      const invoice = await prisma.invoice.create({
        data: {
          invoice_number: invoiceNumber,
          po_id,
          vendor_id: po.vendor_id,
          issued_date: today,
          due_date: dueDate,
          status: 'draft',
        },
      });

      logActivity(userId, 'invoice', invoice.id, 'created');

      res.status(201).json(invoice);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
);

// ─── GET /api/invoices ────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
        purchase_order: { select: { id: true, po_number: true, total_amount: true } },
      },
    });

    res.status(200).json(invoices);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── GET /api/invoices/:id ────────────────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        vendor: true,
        purchase_order: {
          include: {
            quotation: {
              include: {
                rfq: { include: { rfq_items: true } },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    res.status(200).json(invoice);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── GET /api/invoices/:id/pdf ────────────────────────────────────────────────

router.get('/:id/pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // Generate PDF buffer
    const pdfBuffer = await generatePDF(id);

    // Persist PDF to uploads/invoices/
    const uploadsDir = path.join(process.cwd(), 'uploads', 'invoices');
    fs.mkdirSync(uploadsDir, { recursive: true });

    const fileName = `${invoice.invoice_number}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    // Update pdf_url on invoice record
    await prisma.invoice.update({
      where: { id },
      data: { pdf_url: filePath },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── POST /api/invoices/:id/send-email ───────────────────────────────────────

router.post('/:id/send-email', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user.id;

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // Send email with PDF attachment
    await sendInvoiceEmail(id);

    // Update emailed_at and status
    await prisma.invoice.update({
      where: { id },
      data: {
        emailed_at: new Date(),
        status: 'sent',
      },
    });

    logActivity(userId, 'invoice', id, 'emailed');

    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
