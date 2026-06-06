import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { generatePDF } from './generatePDF';

const prisma = new PrismaClient();

// ─── Nodemailer Transporter ──────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? '2525', 10),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ─── sendInvoiceEmail ────────────────────────────────────────────────────────

/**
 * Generates an invoice PDF and emails it to the vendor.
 *
 * @param invoiceId - The UUID of the invoice to send
 */
export async function sendInvoiceEmail(invoiceId: string): Promise<void> {
  // Fetch invoice with vendor + purchase_order (for total_amount)
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      vendor: true,
      purchase_order: true,
    },
  });

  if (!invoice) throw new Error(`Invoice not found: ${invoiceId}`);

  const vendor = invoice.vendor;
  const po = invoice.purchase_order;

  // Generate PDF buffer
  const pdfBuffer = await generatePDF(invoiceId);

  const dueDateStr = invoice.due_date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  await transporter.sendMail({
    from: '"VendorBridge" <noreply@vendorbridge.com>',
    to: vendor.email,
    subject: `Invoice ${invoice.invoice_number} from VendorBridge`,
    text: [
      `Dear ${vendor.name},`,
      '',
      `Please find attached your invoice ${invoice.invoice_number}.`,
      `Amount Due: ₹${po.total_amount.toFixed(2)}`,
      `Due Date: ${dueDateStr}`,
      '',
      'Thank you for your business.',
      '',
      '— VendorBridge Team',
    ].join('\n'),
    attachments: [
      {
        filename: `${invoice.invoice_number}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}
