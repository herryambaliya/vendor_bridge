import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { z } from 'zod';
import { verifyToken, AuthenticatedRequest } from '../middleware/auth';

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

const spendPointSchema = z.object({
  month: z.string(),
  total: z.number(),
});

const spendForecastSchema = z.object({
  monthly_spend: z.array(spendPointSchema),
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

    // Fetch all active/inactive vendors to populate AI recommendation input
    const vendors = await prisma.vendor.findMany({
      include: {
        purchase_orders: { select: { id: true } },
        quotations: { select: { unit_price: true, delivery_days: true } },
      },
    });

    const vendorItems = vendors.map((v) => {
      const total_pos = v.purchase_orders.length;
      const avg_price =
        v.quotations.length > 0
          ? v.quotations.reduce((sum, q) => sum + q.unit_price, 0) / v.quotations.length
          : 5000;
      const avg_delivery_days =
        v.quotations.length > 0
          ? Math.round(v.quotations.reduce((sum, q) => sum + q.delivery_days, 0) / v.quotations.length)
          : 10;

      return {
        vendor_id: v.id,
        vendor_name: v.name,
        category: v.category,
        avg_rating: v.rating,
        avg_price,
        avg_delivery_days,
        total_pos,
      };
    });

    const aiPayload = {
      rfq_id: 'temp-rfq-recommend',
      category: body.category,
      budget_estimate: body.budget,
      deadline_days: body.required_delivery_days,
      vendors: vendorItems,
    };

    try {
      // Attempt live AI service
      const response = await axios.post(`${AI_BASE_URL}/recommend-vendors`, aiPayload, {
        timeout: AI_TIMEOUT_MS,
      });
      res.json(response.data);
    } catch (err: any) {
      console.error('[AI Recommendation Proxy Error]:', err.message);
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

    const quotations = await prisma.quotation.findMany({
      where: { id: { in: quotation_ids } },
      include: { vendor: { select: { name: true, rating: true } } },
    });

    if (quotations.length === 0) {
      res.json({ ranked: [], message: 'No quotations found to rank' });
      return;
    }

    const aiPayload = {
      rfq_id: quotations[0]?.rfq_id ?? 'temp-rfq',
      quotations: quotations.map((q) => ({
        id: q.id,
        vendor_id: q.vendor_id,
        vendor_name: q.vendor.name,
        unit_price: q.unit_price,
        delivery_days: q.delivery_days,
        vendor_rating: q.vendor.rating,
      })),
    };

    try {
      // Attempt live AI service
      const response = await axios.post(`${AI_BASE_URL}/rank-quotations`, aiPayload, {
        timeout: AI_TIMEOUT_MS,
      });
      res.json(response.data);
    } catch (err: any) {
      console.error('[AI Quotation Ranking Proxy Error]:', err.message);
      // Fallback: sort by unit_price ascending (cheapest = best)
      const sortedQuotations = [...quotations].sort((a, b) => a.unit_price - b.unit_price);

      const RANK_LABELS: Record<number, string> = {
        0: 'Best Price',
        1: 'Runner Up',
      };

      const ranked = sortedQuotations.map((q, idx) => ({
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

// ─── POST /api/ai/spend-forecast ─────────────────────────────────────────────

router.post('/spend-forecast', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = spendForecastSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten().fieldErrors });
      return;
    }

    const { monthly_spend } = parsed.data;

    const mappedSpend = monthly_spend.map((item) => {
      const date = new Date(item.month);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return {
        month: `${year}-${month}`,
        amount: item.total,
      };
    });

    const aiPayload = {
      monthly_spend: mappedSpend,
    };

    try {
      // Attempt live AI service
      const response = await axios.post(`${AI_BASE_URL}/spend-forecast`, aiPayload, {
        timeout: AI_TIMEOUT_MS,
      });
      
      const responseData = response.data;
      const mappedForecast = responseData.forecast.map((pt: any) => ({
        month: pt.month,
        predictedAmount: pt.predicted_amount,
        confidence: pt.confidence.charAt(0).toUpperCase() + pt.confidence.slice(1),
      }));

      res.json({
        forecast: mappedForecast,
        trend: responseData.trend,
      });
    } catch (err: any) {
      console.error('[AI Spend Forecasting Proxy Error]:', err.message);
      // Fallback
      res.json({
        forecast: [
          { month: '2026-06', predictedAmount: 450000, confidence: 'Medium' },
          { month: '2026-07', predictedAmount: 480000, confidence: 'Medium' },
          { month: '2026-08', predictedAmount: 510000, confidence: 'Medium' },
        ],
        trend: 'increasing',
        is_mock: true,
        message: 'AI service unavailable, showing mock forecast',
      });
    }
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
