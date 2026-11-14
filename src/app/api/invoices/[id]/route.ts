import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invoiceItems, invoices } from "@/db/schema";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const invoiceId = Number(id);
    if (!Number.isFinite(invoiceId)) {
      return Response.json({ error: "Invalid invoice id" }, { status: 400 });
    }
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    if (!invoice) return Response.json({ error: "Invoice not found" }, { status: 404 });
    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId));
    return Response.json({
      invoice: {
        id: invoice.id,
        invoiceNo: invoice.invoiceNo,
        doctorId: invoice.doctorId,
        doctorName: invoice.doctorName,
        doctorAddress: invoice.doctorAddress ?? "",
        doctorPhone: invoice.doctorPhone ?? "",
        discountPercent: invoice.discountPercent ?? "0",
        itemsTotal: invoice.itemsTotal,
        backDues: invoice.backDues ?? "0",
        grandTotal: invoice.grandTotal,
        createdAt: invoice.createdAt.toISOString(),
        items: items.map((item) => ({
          id: item.id,
          invoiceId: item.invoiceId,
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          mrp: item.mrp,
          discountPercent: item.discountPercent ?? "0",
          unitRate: item.unitRate,
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        })),
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load invoice" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const invoiceId = Number(id);
    if (!Number.isFinite(invoiceId)) {
      return Response.json({ error: "Invalid invoice id" }, { status: 400 });
    }
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
    await db.delete(invoices).where(eq(invoices.id, invoiceId));
    return Response.json({ ok: true, id: invoiceId });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to delete invoice" },
      { status: 500 },
    );
  }
}
