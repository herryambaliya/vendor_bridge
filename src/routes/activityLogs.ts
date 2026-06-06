import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();
const prisma = new PrismaClient();

router.use(verifyToken);
router.use(requireRole(['officer', 'manager', 'admin']));

// ─── GET /api/activity-logs ───────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt((req.query['page'] as string) ?? '1', 10);
    const limit = parseInt((req.query['limit'] as string) ?? '20', 10);
    const entityType = req.query['entity_type'] as string | undefined;
    const skip = (page - 1) * limit;

    const where = entityType ? { entity_type: entityType } : {};

    const [data, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    res.status(200).json({ data, total, page, limit });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
