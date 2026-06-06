import { Router, Request, Response } from 'express';
import { PrismaClient, VendorStatus } from '@prisma/client';
import { z } from 'zod';
import { verifyToken, AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { logActivity } from '../utils/logActivity';

const router = Router();
const prisma = new PrismaClient();

// All vendor routes require authentication
router.use(verifyToken);

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const createVendorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().min(1, 'Address is required'),
  gst_number: z.string().min(1, 'GST number is required'),
  category: z.string().min(1, 'Category is required'),
});

const updateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  gst_number: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  status: z.enum(['active', 'inactive', 'blacklisted']).optional(),
  rating: z.number().min(0).max(5).optional(),
});

// ─── GET /api/vendors ────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const search = req.query['search'] as string | undefined;
    const status = req.query['status'] as string | undefined;
    const page = parseInt((req.query['page'] as string) ?? '1', 10);
    const limit = parseInt((req.query['limit'] as string) ?? '10', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where['name'] = { contains: search, mode: 'insensitive' };
    }

    if (status && Object.values(VendorStatus).includes(status as VendorStatus)) {
      where['status'] = status as VendorStatus;
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.vendor.count({ where }),
    ]);

    res.status(200).json({ data: vendors, total, page, limit });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── POST /api/vendors ───────────────────────────────────────────────────────

router.post(
  '/',
  requireRole(['officer', 'admin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = createVendorSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
      }

      const userId = (req as AuthenticatedRequest).user.id;

      const vendor = await prisma.vendor.create({
        data: {
          ...parsed.data,
          created_by: userId,
        },
      });

      logActivity(userId, 'vendor', vendor.id, 'created');

      res.status(201).json(vendor);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
);

// ─── GET /api/vendors/:id ────────────────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const vendor = await prisma.vendor.findUnique({ where: { id } });

    if (!vendor) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }

    res.status(200).json(vendor);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── PATCH /api/vendors/:id ──────────────────────────────────────────────────

router.patch(
  '/:id',
  requireRole(['officer', 'admin']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const parsed = updateVendorSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
      }

      // Check vendor exists
      const existing = await prisma.vendor.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: 'Vendor not found' });
        return;
      }

      const vendor = await prisma.vendor.update({
        where: { id },
        data: parsed.data,
      });

      const userId = (req as AuthenticatedRequest).user.id;
      logActivity(userId, 'vendor', id, 'updated');

      res.status(200).json(vendor);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
);

export default router;
