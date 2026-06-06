import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRouter from './routes/auth';
import vendorsRouter from './routes/vendors';
import rfqsRouter from './routes/rfqs';
import quotationsRouter from './routes/quotations';
import approvalsRouter from './routes/approvals';
import purchaseOrdersRouter from './routes/purchaseOrders';
import invoicesRouter from './routes/invoices';
import reportsRouter from './routes/reports';
import aiRouter from './routes/ai';
import activityLogsRouter from './routes/activityLogs';

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/rfqs', rfqsRouter);
app.use('/api/quotations', quotationsRouter);
app.use('/api/approvals', approvalsRouter);
app.use('/api/purchase-orders', purchaseOrdersRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/activity-logs', activityLogsRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT ?? 5000;

import { PrismaClient } from '@prisma/client';
const prismaClient = new PrismaClient();

async function fixVendorUserLinks() {
  try {
    const vendorUser = await prismaClient.user.findFirst({
      where: { role: 'vendor', email: 'vendor@furnico.com' },
    });
    if (vendorUser) {
      const vendor = await prismaClient.vendor.findFirst({
        where: { email: 'vendor@furnico.com' },
      });
      if (vendor && !vendor.user_id) {
        await prismaClient.vendor.update({
          where: { id: vendor.id },
          data: { user_id: vendorUser.id },
        });
        console.log('🔗 Automatically linked vendor@furnico.com user to FurniCo vendor profile.');
      }
    }
  } catch (err) {
    console.error('Error auto-linking vendor user:', err);
  } finally {
    await prismaClient.$disconnect();
  }
}

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await fixVendorUserLinks();
});

export default app;
