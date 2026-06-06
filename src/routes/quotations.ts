import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { verifyToken, AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { logActivity } from '../utils/logActivity';

const router = Router();
const prisma = new PrismaClient();

// All quotation routes require authentication
router.use(verifyToken);

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const createQuotationSchema = z.object({
  rfq_id: z.string().uuid('Invalid RFQ ID'),
  unit_price: z.number().positive('Unit price must be positive'),
  delivery_days: z.number().int().positive('Delivery days must be a positive integer'),
  notes: z.string().optional(),
});

const updateQuotationStatusSchema = z.object({
  status: z.enum(['shortlisted', 'rejected']),
});


// ─── POST /api/quotations ────────────────────────────────────────────────────

router.post(
  '/',
  requireRole(['vendor']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = createQuotationSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
      }

      const userId = (req as AuthenticatedRequest).user.id;
      const { rfq_id, unit_price, delivery_days, notes } = parsed.data;

      // Resolve vendor record linked to this user account
      const vendor = await prisma.vendor.findUnique({
        where: { user_id: userId },
      });

      if (!vendor) {
        res.status(404).json({ error: 'No vendor profile found for your account' });
        return;
      }

      // Confirm vendor is assigned to the RFQ
      const assignment = await prisma.rfqVendor.findFirst({
        where: { rfq_id, vendor_id: vendor.id },
      });

      if (!assignment) {
        res.status(403).json({ error: 'You are not assigned to this RFQ' });
        return;
      }

      // Prevent duplicate submissions
      const duplicate = await prisma.quotation.findFirst({
        where: { rfq_id, vendor_id: vendor.id },
      });

      if (duplicate) {
        res.status(400).json({ error: 'A quotation for this RFQ has already been submitted' });
        return;
      }

      const quotation = await prisma.quotation.create({
        data: {
          rfq_id,
          vendor_id: vendor.id,
          unit_price,
          delivery_days,
          notes: notes ?? null,
          status: 'submitted',
        },
      });

      logActivity(userId, 'quotation', quotation.id, 'submitted');

      res.status(201).json(quotation);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
);

// ─── PATCH /api/quotations/:id/status ────────────────────────────────────────

router.patch(
  '/:id/status',
  requireRole(['officer', 'admin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const parsed = updateQuotationStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
      }

      const existing = await prisma.quotation.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: 'Quotation not found' });
        return;
      }

      const quotation = await prisma.quotation.update({
        where: { id },
        data: { status: parsed.data.status },
        include: {
          vendor: { select: { id: true, name: true, email: true } },
        },
      });

      const userId = (req as AuthenticatedRequest).user.id;
      logActivity(userId, 'quotation', id, `status_updated_to_${parsed.data.status}`);

      res.status(200).json(quotation);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
);

export default router;
