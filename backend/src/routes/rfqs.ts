import { Router, Request, Response } from 'express';
import { PrismaClient, RfqStatus } from '@prisma/client';
import { z } from 'zod';
import { verifyToken, AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { logActivity } from '../utils/logActivity';

const router = Router();
const prisma = new PrismaClient();

// All RFQ routes require authentication
router.use(verifyToken);

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const rfqItemSchema = z.object({
  product_name: z.string().min(1, 'Product name is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  unit: z.string().min(1, 'Unit is required'),
  estimated_price: z.number().positive('Estimated price must be positive'),
});

const createRfqSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  deadline: z.string().datetime({ message: 'Invalid deadline datetime' }),
  items: z.array(rfqItemSchema).min(1, 'At least one item is required'),
  vendor_ids: z.array(z.string().uuid('Invalid vendor ID')).min(1, 'At least one vendor is required'),
});

const updateRfqStatusSchema = z.object({
  status: z.enum(['open', 'closed', 'cancelled']),
});

// ─── POST /api/rfqs ──────────────────────────────────────────────────────────

router.post(
  '/',
  requireRole(['officer', 'admin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = createRfqSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
      }

      const { title, description, deadline, items, vendor_ids } = parsed.data;
      const userId = (req as AuthenticatedRequest).user.id;

      const rfq = await prisma.$transaction(async (tx) => {
        // 1. Create the RFQ
        const createdRfq = await tx.rfq.create({
          data: {
            title,
            description,
            deadline: new Date(deadline),
            created_by: userId,
          },
        });

        // 2. Create RFQ items
        await tx.rfqItem.createMany({
          data: items.map((item) => ({
            rfq_id: createdRfq.id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit: item.unit,
            estimated_price: item.estimated_price,
          })),
        });

        // 3. Associate vendors with the RFQ
        await tx.rfqVendor.createMany({
          data: vendor_ids.map((vendorId) => ({
            rfq_id: createdRfq.id,
            vendor_id: vendorId,
          })),
        });

        return createdRfq;
      });

      logActivity(userId, 'rfq', rfq.id, 'created');

      res.status(201).json(rfq);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
);

// ─── GET /api/rfqs ───────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query['status'] as string | undefined;

    const where: Record<string, unknown> = {};

    if (status && Object.values(RfqStatus).includes(status as RfqStatus)) {
      where['status'] = status as RfqStatus;
    }

    const rfqs = await prisma.rfq.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        rfq_items: true,
        rfq_vendors: true,
        quotations: {
          include: {
            vendor: { select: { id: true, name: true } }
          }
        },
        _count: {
          select: {
            rfq_items: true,
            rfq_vendors: true,
            quotations: true,
          },
        },
      },
    });

    res.status(200).json(rfqs);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── GET /api/rfqs/:rfqId/quotations ─────────────────────────────────────────

router.get(
  '/:rfqId/quotations',
  requireRole(['officer', 'manager', 'admin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { rfqId } = req.params;

      const quotations = await prisma.quotation.findMany({
        where: { rfq_id: rfqId },
        include: {
          vendor: {
            select: { id: true, name: true, email: true, category: true },
          },
        },
        orderBy: { created_at: 'asc' },
      });

      res.status(200).json(quotations);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
);

// ─── GET /api/rfqs/:id ───────────────────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response): Promise<void> => {

  try {
    const { id } = req.params;

    const rfq = await prisma.rfq.findUnique({
      where: { id },
      include: {
        rfq_items: true,
        rfq_vendors: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                email: true,
                category: true,
                status: true,
              },
            },
          },
        },
        quotations: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                email: true,
                category: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            quotations: true,
          },
        },
      },
    });

    if (!rfq) {
      res.status(404).json({ error: 'RFQ not found' });
      return;
    }

    res.status(200).json(rfq);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── PATCH /api/rfqs/:id/status ─────────────────────────────────────────────

router.patch(
  '/:id/status',
  requireRole(['officer', 'admin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const parsed = updateRfqStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
      }

      // Check RFQ exists
      const existing = await prisma.rfq.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: 'RFQ not found' });
        return;
      }

      const rfq = await prisma.rfq.update({
        where: { id },
        data: { status: parsed.data.status },
      });

      const userId = (req as AuthenticatedRequest).user.id;
      logActivity(userId, 'rfq', id, `status_updated_to_${parsed.data.status}`);

      res.status(200).json(rfq);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
);

export default router;
