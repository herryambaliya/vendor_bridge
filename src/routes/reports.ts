import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();
const prisma = new PrismaClient();

// All report routes: authentication + role guard
router.use(verifyToken);
router.use(requireRole(['officer', 'manager', 'admin']));

// ─── Types for raw query results ─────────────────────────────────────────────

interface MonthlySpendRow {
  month: Date;
  total: string | number;
}

interface VendorPerformanceRow {
  id: string;
  name: string;
  category: string;
  rating: number | string;
  po_count: bigint;
  avg_delivery_days: string | number | null;
  avg_unit_price: string | number | null;
}

interface CategorySpendRow {
  category: string;
  total: string | number;
}

// ─── GET /api/reports/dashboard-summary ─────────────────────────────────────

router.get('/dashboard-summary', async (_req: Request, res: Response): Promise<void> => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [pendingApprovals, activeRfqs, posThisMonth, spendThisMonth] = await Promise.all([
      prisma.approval.count({ where: { status: 'pending' } }),
      prisma.rfq.count({ where: { status: 'open' } }),
      prisma.purchaseOrder.count({
        where: { issued_at: { gte: startOfMonth } },
      }),
      prisma.purchaseOrder.aggregate({
        where: { issued_at: { gte: startOfMonth } },
        _sum: { total_amount: true },
      }),
    ]);

    res.status(200).json({
      pending_approvals: pendingApprovals,
      active_rfqs: activeRfqs,
      pos_this_month: posThisMonth,
      spend_this_month: spendThisMonth._sum.total_amount ?? 0,
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── GET /api/reports/monthly-spend ─────────────────────────────────────────

router.get('/monthly-spend', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await prisma.$queryRaw<MonthlySpendRow[]>`
      SELECT
        DATE_TRUNC('month', issued_at) AS month,
        SUM(total_amount)              AS total
      FROM purchase_orders
      WHERE issued_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', issued_at)
      ORDER BY month ASC
    `;

    const data = rows.map((row) => ({
      month: row.month instanceof Date ? row.month.toISOString() : String(row.month),
      total: Number(row.total),
    }));

    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── GET /api/reports/vendor-performance ─────────────────────────────────────

router.get('/vendor-performance', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await prisma.$queryRaw<VendorPerformanceRow[]>`
      SELECT
        v.id,
        v.name,
        v.category,
        v.rating,
        COUNT(po.id)            AS po_count,
        AVG(q.delivery_days)    AS avg_delivery_days,
        AVG(q.unit_price)       AS avg_unit_price
      FROM vendors v
      LEFT JOIN purchase_orders po ON po.vendor_id = v.id
      LEFT JOIN quotations      q  ON q.vendor_id  = v.id
      GROUP BY v.id, v.name, v.category, v.rating
      ORDER BY po_count DESC
    `;

    // BigInt from COUNT and Decimal from AVG must be serialised before JSON.stringify
    const data = rows.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      rating: Number(row.rating),
      po_count: Number(row.po_count),
      avg_delivery_days:
        row.avg_delivery_days !== null ? Number(row.avg_delivery_days) : null,
      avg_unit_price:
        row.avg_unit_price !== null ? Number(row.avg_unit_price) : null,
    }));

    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ─── GET /api/reports/category-spend ─────────────────────────────────────────

router.get('/category-spend', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await prisma.$queryRaw<CategorySpendRow[]>`
      SELECT
        v.category,
        SUM(po.total_amount) AS total
      FROM purchase_orders po
      JOIN vendors v ON v.id = po.vendor_id
      GROUP BY v.category
      ORDER BY total DESC
    `;

    const data = rows.map((row) => ({
      category: row.category,
      total: Number(row.total),
    }));

    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
