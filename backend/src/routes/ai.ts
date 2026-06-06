import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { z } from 'zod';
import { verifyToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All AI routes require authentication
router.use(verifyToken);

const AI_BASE_URL = 'http://localhost:8000';
const AI_TIMEOUT_MS = 5000;

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const recommendVendorsSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  budget: z.number().positive('Budget must be positive'),
  required_delivery_days: z
    .number()
    .int()
    .positive('Delivery days must be a positive integer'),
});

const rankQuotationsSchema = z.object({
  quotation_ids: z
    .array(z.string().uuid('Invalid quotation ID'))
    .min(1, 'At least one quotation ID is required'),
});

// ─── POST /api/ai/recommend-vendors ─────────────────────────────────────────

router.post('/recommend-vendors', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = recommendVendorsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }

    const body = parsed.data;

    try {
      // Attempt live AI service
      const response = await axios.post(`${AI_BASE_URL}/recommend-vendors`, body, {
        timeout: AI_TIMEOUT_MS,
      });
      res.json(response.data);
    } catch {
      // Graceful fallback — AI service down or timed out
      res.json({
        recommended: [
          {
            vendor_id: 'mock-1',
            name: 'TechSupplies Co',
            score: 0.95,
            reason: 'Best price history',
            category: body.category,
          },
          {
            vendor_id: 'mock-2',
            name: 'GlobalParts Ltd',
            score: 0.87,
            reason: 'Fast delivery record',
            category: body.category,
          },
          {
            vendor_id: 'mock-3',
            name: 'PrimeSources Inc',
            score: 0.79,
            reason: 'Reliable quality rating',
            category: body.category,
          },
        ],
        is_mock: true,
        message: 'AI service unavailable, showing mock recommendations',
      });
    }
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── POST /api/ai/rank-quotations ────────────────────────────────────────────

router.post('/rank-quotations', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = rankQuotationsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }

    const { quotation_ids } = parsed.data;

    try {
      // Attempt live AI service
      const response = await axios.post(
        `${AI_BASE_URL}/rank-quotations`,
        { quotation_ids },
        { timeout: AI_TIMEOUT_MS }
      );
      res.json(response.data);
    } catch {
      // Fallback: sort by unit_price ascending (cheapest = best)
      const quotations = await prisma.quotation.findMany({
        where: { id: { in: quotation_ids } },
        include: { vendor: { select: { name: true } } },
        orderBy: { unit_price: 'asc' },
      });

      const RANK_LABELS: Record<number, string> = {
        0: 'Best Price',
        1: 'Runner Up',
      };

      const ranked = quotations.map((q, idx) => ({
        quotation_id: q.id,
        vendor_name: q.vendor.name,
        unit_price: q.unit_price,
        delivery_days: q.delivery_days,
        ...(RANK_LABELS[idx] !== undefined ? { label: RANK_LABELS[idx] } : {}),
      }));

      res.json({
        ranked,
        is_mock: true,
        message: 'AI service unavailable, showing price-sorted ranking',
      });
    }
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
