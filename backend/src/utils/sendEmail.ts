import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { generatePDF } from './generatePDF';

const prisma = new PrismaClient();

// ─── Nodemailer Transporter ──────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.EMAIL_PORT ?? '587', 10),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── sendInvoiceEmail ────────────────────────────────────────────────────────

/**
 * Generates an invoice PDF and emails it to the vendor.
 *
 * @param invoiceId - The UUID of the invoice to send
 * @param registeredUserEmail - Optional email address of the registered user to receive a copy
 */
export async function sendInvoiceEmail(invoiceId: string, registeredUserEmail?: string): Promise<void> {
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

  const recipients = new Set<string>();
  if (vendor.email) {
    recipients.add(vendor.email.trim());
  }
  if (registeredUserEmail) {
    recipients.add(registeredUserEmail.trim());
  }

  if (recipients.size === 0) {
    throw new Error(`No recipient email address available for invoice ${invoiceId}`);
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"VendorBridge" <noreply@vendorbridge.com>',
    to: Array.from(recipients).join(', '),
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
