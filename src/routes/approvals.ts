import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { verifyToken, AuthenticatedRequest } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { logActivity } from '../utils/logActivity';
import { createPO } from '../utils/generatePO';

const router = Router();
const prisma = new PrismaClient();

// All approval routes require authentication
router.use(verifyToken);

// ─── Zod Schemas ────────────────────────────────────────────────────────────

const createApprovalSchema = z.object({
  quotation_id: z.string().uuid('Invalid quotation ID'),
  remarks: z.string().optional(),
});

const approveSchema = z.object({
  remarks: z.string().optional(),
});

const rejectSchema = z.object({
  remarks: z.string().min(1, 'Remarks are required when rejecting'),
});

// ─── POST /api/approvals ──────────────────────────────────────────────────────

router.post(
  '/',
  requireRole(['officer']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = createApprovalSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
      }

      const { quotation_id, remarks } = parsed.data;
      const userId = (req as AuthenticatedRequest).user.id;

      // Quotation must exist and be shortlisted
      const quotation = await prisma.quotation.findUnique({
        where: { id: quotation_id },
      });

      if (!quotation) {
        res.status(404).json({ error: 'Quotation not found' });
        return;
      }

      if (quotation.status !== 'shortlisted') {
        res.status(400).json({
          error: 'Approval can only be requested for shortlisted quotations',
        });
        return;
      }

      // Find first manager to act as approver
      const manager = await prisma.user.findFirst({
        where: { role: 'manager' },
      });

      if (!manager) {
        res.status(400).json({ error: 'No manager found to assign as approver' });
        return;
      }

      const approval = await prisma.approval.create({
        data: {
          quotation_id,
          requested_by: userId,
          approver_id: manager.id,
          status: 'pending',
          remarks: remarks ?? null,
        },
        include: {
          quotation: {
            include: { vendor: { select: { id: true, name: true } } },
          },
          requester: { select: { id: true, name: true, role: true } },
          approver: { select: { id: true, name: true, role: true } },
        },
      });

      logActivity(userId, 'approval', approval.id, 'created');

      res.status(201).json(approval);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
);

// ─── GET /api/approvals ───────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { role, id: userId } = authReq.user;

    const page = parseInt((req.query['page'] as string) ?? '1', 10);
    const limit = parseInt((req.query['limit'] as string) ?? '10', 10);
    const skip = (page - 1) * limit;

    // Managers see all pending; officers see only their own requests
    const where =
      role === 'manager'
        ? { status: 'pending' as const }
        : { requested_by: userId };

    const [approvals, total] = await Promise.all([
      prisma.approval.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          quotation: {
            include: {
              vendor: { select: { id: true, name: true, category: true } },
              rfq: { select: { id: true, title: true } },
            },
          },
          requester: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
        },
      }),
      prisma.approval.count({ where }),
    ]);

    res.status(200).json({ data: approvals, total, page, limit });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── POST /api/approvals/:id/approve ─────────────────────────────────────────

router.post(
  '/:id/approve',
  requireRole(['manager']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as AuthenticatedRequest).user.id;

      const parsed = approveSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
      }

      const approval = await prisma.approval.findUnique({ where: { id } });
      if (!approval) {
        res.status(404).json({ error: 'Approval not found' });
        return;
      }

      if (approval.status !== 'pending') {
        res.status(400).json({ error: 'Only pending approvals can be approved' });
        return;
      }

      // Persist the approval decision
      const updatedApproval = await prisma.approval.update({
        where: { id },
        data: {
          status: 'approved',
          actioned_at: new Date(),
          remarks: parsed.data.remarks ?? null,
        },
      });

      // Auto-generate Purchase Order
      const purchaseOrder = await createPO(approval.quotation_id);

      logActivity(userId, 'approval', id, 'approved');

      res.status(200).json({ approval: updatedApproval, purchase_order: purchaseOrder });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
);

// ─── POST /api/approvals/:id/reject ──────────────────────────────────────────

router.post(
  '/:id/reject',
  requireRole(['manager']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as AuthenticatedRequest).user.id;

      const parsed = rejectSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
      }

      const approval = await prisma.approval.findUnique({ where: { id } });
      if (!approval) {
        res.status(404).json({ error: 'Approval not found' });
        return;
      }

      if (approval.status !== 'pending') {
        res.status(400).json({ error: 'Only pending approvals can be rejected' });
        return;
      }

      const updatedApproval = await prisma.approval.update({
        where: { id },
        data: {
          status: 'rejected',
          actioned_at: new Date(),
          remarks: parsed.data.remarks,
        },
      });

      logActivity(userId, 'approval', id, 'rejected');

      res.status(200).json(updatedApproval);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
);

export default router;
