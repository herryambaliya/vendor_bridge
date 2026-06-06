import { Router, Request, Response } from 'express';
import { PrismaClient, PurchaseOrderStatus } from '@prisma/client';
import { z } from 'zod';
import { verifyToken, AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { logActivity } from '../utils/logActivity';

const router = Router();
const prisma = new PrismaClient();

// All PO routes require authentication
router.use(verifyToken);

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const updateStatusSchema = z.object({
  status: z.enum(['acknowledged', 'delivered']),
});

// Valid status transitions
const TRANSITIONS: Record<string, PurchaseOrderStatus> = {
  issued: 'acknowledged',
  acknowledged: 'delivered',
};

// ─── GET /api/purchase-orders ─────────────────────────────────────────────────

router.get(
  '/',
  requireRole(['officer', 'manager', 'admin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const status = req.query['status'] as string | undefined;

      const where: Record<string, unknown> = {};
      if (
        status &&
        Object.values(PurchaseOrderStatus).includes(status as PurchaseOrderStatus)
      ) {
        where['status'] = status as PurchaseOrderStatus;
      }

      const purchaseOrders = await prisma.purchaseOrder.findMany({
        where,
        orderBy: { issued_at: 'desc' },
        include: {
          vendor: { select: { id: true, name: true, email: true } },
        },
      });

      res.status(200).json(purchaseOrders);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
);

// ─── GET /api/purchase-orders/:id ────────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        quotation: {
          include: {
            rfq: {
              include: {
                rfq_items: true,
              },
            },
          },
        },
      },
    });

    if (!po) {
      res.status(404).json({ error: 'Purchase order not found' });
      return;
    }

    res.status(200).json(po);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── PATCH /api/purchase-orders/:id/status ────────────────────────────────────

router.patch(
  '/:id/status',
  requireRole(['officer', 'admin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const parsed = updateStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
      }

      const po = await prisma.purchaseOrder.findUnique({ where: { id } });
      if (!po) {
        res.status(404).json({ error: 'Purchase order not found' });
        return;
      }

      // Validate status transition
      const allowedNext = TRANSITIONS[po.status];
      if (!allowedNext || allowedNext !== parsed.data.status) {
        res.status(400).json({
          error: `Invalid transition: '${po.status}' → '${parsed.data.status}'. Allowed: '${po.status}' → '${allowedNext ?? 'none'}'`,
        });
        return;
      }

      const updated = await prisma.purchaseOrder.update({
        where: { id },
        data: { status: parsed.data.status },
      });

      const userId = (req as AuthenticatedRequest).user.id;
      logActivity(userId, 'purchase_order', id, `status_updated_to_${parsed.data.status}`);

      res.status(200).json(updated);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
);

export default router;
