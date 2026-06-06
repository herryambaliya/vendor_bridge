import PDFDocument from 'pdfkit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function formatCurrency(value: number): string {
  return `₹${value.toFixed(2)}`;
}

// ─── Main PDF Generator ──────────────────────────────────────────────────────

export async function generatePDF(invoiceId: string): Promise<Buffer> {
  // Fetch all necessary data
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      vendor: true,
      purchase_order: {
        include: {
          quotation: {
            include: {
              rfq: {
                include: {
                  rfq_items: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!invoice) throw new Error(`Invoice not found: ${invoiceId}`);

  const po = invoice.purchase_order;
  const quotation = po.quotation;
  const rfqItems = quotation.rfq.rfq_items;
  const vendor = invoice.vendor;
  const unitPrice = quotation.unit_price;

  // ─── Build PDF ─────────────────────────────────────────────────────────────

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;    // 595.28
    const margin = 50;
    const usableWidth = pageWidth - margin * 2; // 495.28

    // ── 1. HEADER ─────────────────────────────────────────────────────────────
    const headerY = margin;
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#1a1a2e')
      .text('VendorBridge', margin, headerY, { width: usableWidth / 2 });

    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#4f46e5')
      .text('INVOICE', margin + usableWidth / 2, headerY, {
        width: usableWidth / 2,
        align: 'right',
      });

    const lineY = headerY + 35;
    doc
      .moveTo(margin, lineY)
      .lineTo(pageWidth - margin, lineY)
      .lineWidth(2)
      .strokeColor('#4f46e5')
      .stroke();

    // ── 2. INVOICE DETAILS (left) + VENDOR BLOCK (right) ────────────────────
    const detailY = lineY + 20;
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#666666');
    doc.text('INVOICE DETAILS', margin, detailY);
    doc.text('VENDOR', margin + usableWidth / 2 + 10, detailY);

    const subY = detailY + 14;
    doc.font('Helvetica').fontSize(10).fillColor('#1a1a2e');

    // Left column
    doc.text(`Invoice Number:`, margin, subY);
    doc.font('Helvetica-Bold').text(invoice.invoice_number, margin + 100, subY);
    doc.font('Helvetica').text(`Issued Date:`, margin, subY + 18);
    doc.text(formatDate(invoice.issued_date), margin + 100, subY + 18);
    doc.text(`Due Date:`, margin, subY + 36);
    doc.text(formatDate(invoice.due_date), margin + 100, subY + 36);

    // Right column
    const rightX = margin + usableWidth / 2 + 10;
    doc.font('Helvetica').text(`Vendor:`, rightX, subY);
    doc.font('Helvetica-Bold').text(vendor.name, rightX + 65, subY);
    doc.font('Helvetica').text(`GST:`, rightX, subY + 18);
    doc.text(vendor.gst_number, rightX + 65, subY + 18);
    doc.text(`Address:`, rightX, subY + 36);
    doc.text(vendor.address, rightX + 65, subY + 36, {
      width: usableWidth / 2 - 75,
    });

    // ── 3. LINE ITEMS TABLE ──────────────────────────────────────────────────
    const tableTop = subY + 80;

    // Column layout: Product | Qty | Unit | Unit Price | Total
    const cols = {
      product:   { x: margin,       w: 175 },
      qty:       { x: margin + 175, w: 50  },
      unit:      { x: margin + 225, w: 60  },
      unitPrice: { x: margin + 285, w: 100 },
      total:     { x: margin + 385, w: 110 },
    };
    const tableRight = margin + usableWidth; // 545

    // Header background
    doc
      .rect(margin, tableTop - 4, usableWidth, 22)
      .fill('#1a1a2e');

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
    doc.text('PRODUCT',    cols.product.x + 4,   tableTop);
    doc.text('QTY',        cols.qty.x + 4,        tableTop);
    doc.text('UNIT',       cols.unit.x + 4,       tableTop);
    doc.text('UNIT PRICE', cols.unitPrice.x + 4,  tableTop);
    doc.text('TOTAL',      cols.total.x + 4,      tableTop, { width: cols.total.w - 4, align: 'right' });

    let rowY = tableTop + 24;

    rfqItems.forEach((item, idx) => {
      const rowTotal = item.quantity * unitPrice;
      const rowHeight = 22;

      // Alternating row background
      if (idx % 2 === 0) {
        doc.rect(margin, rowY - 3, usableWidth, rowHeight).fill('#f0f0f8');
      }

      doc.font('Helvetica').fontSize(9).fillColor('#1a1a2e');
      doc.text(item.product_name, cols.product.x + 4,   rowY, { width: cols.product.w - 8 });
      doc.text(String(item.quantity), cols.qty.x + 4,    rowY);
      doc.text(item.unit,            cols.unit.x + 4,    rowY);
      doc.text(formatCurrency(unitPrice), cols.unitPrice.x + 4, rowY);
      doc.text(formatCurrency(rowTotal),  cols.total.x + 4,  rowY, {
        width: cols.total.w - 8,
        align: 'right',
      });

      rowY += rowHeight;
    });

    // Bottom border of table
    doc
      .moveTo(margin, rowY)
      .lineTo(tableRight, rowY)
      .lineWidth(1)
      .strokeColor('#cccccc')
      .stroke();

    // ── 4. TOTALS SECTION (right aligned) ────────────────────────────────────
    rowY += 15;
    const totalsLabelX = margin + 300;
    const totalsValueX = margin + 420;
    const totalsValueW = usableWidth - 420;

    doc.font('Helvetica').fontSize(10).fillColor('#555555');

    // Subtotal
    doc.text('Subtotal:', totalsLabelX, rowY);
    doc.fillColor('#1a1a2e').text(formatCurrency(po.subtotal), totalsValueX, rowY, {
      width: totalsValueW,
      align: 'right',
    });

    // GST
    rowY += 18;
    doc.fillColor('#555555').text(`GST ${po.tax_percent}%:`, totalsLabelX, rowY);
    doc.fillColor('#1a1a2e').text(formatCurrency(po.tax_amount), totalsValueX, rowY, {
      width: totalsValueW,
      align: 'right',
    });

    // Divider
    rowY += 14;
    doc
      .moveTo(totalsLabelX, rowY)
      .lineTo(tableRight, rowY)
      .lineWidth(2)
      .strokeColor('#4f46e5')
      .stroke();

    // Grand Total
    rowY += 10;
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#4f46e5');
    doc.text('GRAND TOTAL:', totalsLabelX, rowY);
    doc.text(formatCurrency(po.total_amount), totalsValueX, rowY, {
      width: totalsValueW,
      align: 'right',
    });

    // ── 5. FOOTER ─────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 70;
    doc
      .moveTo(margin, footerY)
      .lineTo(pageWidth - margin, footerY)
      .lineWidth(1)
      .strokeColor('#cccccc')
      .stroke();

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#888888')
      .text(
        'Thank you for your business · VendorBridge',
        margin,
        footerY + 12,
        { align: 'center', width: usableWidth }
      );

    doc.end();
  });
}
