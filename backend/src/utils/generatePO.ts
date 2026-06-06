import { PrismaClient, PurchaseOrder } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Creates a PurchaseOrder for the given quotation.
 * Subtotal is derived from the RFQ's estimated item prices.
 * Tax is fixed at 18%.
 */
export async function createPO(quotationId: string): Promise<PurchaseOrder> {
  // Fetch quotation with the associated RFQ and its line items
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      rfq: {
        include: {
          rfq_items: true,
        },
      },
    },
  });

  if (!quotation) {
    throw new Error(`Quotation not found: ${quotationId}`);
  }

  // Subtotal = sum of (estimated_price × quantity) for every RFQ item
  const subtotal = quotation.rfq.rfq_items.reduce(
    (acc, item) => acc + item.estimated_price * item.quantity,
    0
  );

  const taxPercent = 18;
  const taxAmount = subtotal * (taxPercent / 100);
  const totalAmount = subtotal + taxAmount;

  // Generate sequential PO number: PO-{YEAR}-{00001}
  const year = new Date().getFullYear();
  const count = await prisma.purchaseOrder.count();
  const poNumber = `PO-${year}-${String(count + 1).padStart(5, '0')}`;

  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      po_number: poNumber,
      quotation_id: quotationId,
      vendor_id: quotation.vendor_id,
      subtotal,
      tax_percent: taxPercent,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: 'issued',
    },
  });

  return purchaseOrder;
}
