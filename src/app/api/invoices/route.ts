import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { doctors, invoiceItems, invoices, medicines } from "@/db/schema";
import { generateInvoiceNo, listInvoices } from "@/lib/server/data";
import { round2 } from "@/lib/format";

export const dynamic = "force-dynamic";

type IncomingItem = {
  medicineId?: number | string | null;
  medicineName?: string;
  mrp?: number | string;
  quantity?: number | string;
  discountPercent?: number | string;
};

export async function GET() {
  try {
    return Response.json({ invoices: await listInvoices() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load invoices" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      doctorId?: number | string | null;
      discountPercent?: number | string;
      backDues?: number | string;
      items?: IncomingItem[];
    };

    const doctorId = Number(body.doctorId ?? 0);
    if (!Number.isFinite(doctorId) || doctorId <= 0) {
      return Response.json({ error: "Please select a doctor" }, { status: 400 });
    }

    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, doctorId));
    if (!doctor) return Response.json({ error: "Doctor not found" }, { status: 404 });

    const incoming = Array.isArray(body.items) ? body.items : [];
    if (incoming.length === 0) {
      return Response.json({ error: "Add at least one medicine" }, { status: 400 });
    }

    const medicineIds = incoming
      .map((item) => Number(item.medicineId ?? 0))
      .filter((id) => Number.isFinite(id) && id > 0);
    const catalog = medicineIds.length
      ? await db.select().from(medicines).where(inArray(medicines.id, medicineIds))
      : [];
    const catalogById = new Map(catalog.map((row) => [row.id, row]));

    const invoiceDiscount = Number(body.discountPercent ?? doctor.discountPercent ?? 0);
    const normalisedInvoiceDiscount = Number.isFinite(invoiceDiscount) ? invoiceDiscount : 0;

    const lines = incoming
      .map((item) => {
        const medicineId = Number(item.medicineId ?? 0);
        const catalogRow = catalogById.get(medicineId);
        const medicineName = (catalogRow?.name ?? String(item.medicineName ?? "")).trim();
        const mrp = Number(catalogRow?.mrp ?? item.mrp ?? 0);
        const quantity = Math.max(0, Math.round(Number(item.quantity ?? 0)));
        const requestedDiscount = Number(item.discountPercent ?? normalisedInvoiceDiscount);
        const discount = Number.isFinite(requestedDiscount) ? requestedDiscount : 0;
        const unitRate = round2(mrp * (1 - discount / 100));
        const lineTotal = round2(unitRate * quantity);
        return {
          medicineId: Number.isFinite(medicineId) && medicineId > 0 ? medicineId : null,
          medicineName,
          mrp: round2(mrp),
          discountPercent: discount,
          unitRate,
          quantity,
          lineTotal,
        };
      })
      .filter((line) => line.medicineName && line.quantity > 0);

    if (lines.length === 0) {
      return Response.json({ error: "Select medicine and quantity for each row" }, { status: 400 });
    }

    const itemsTotal = round2(lines.reduce((sum, line) => sum + line.lineTotal, 0));
    const backDues = round2(Number(body.backDues ?? 0) || 0);
    const grandTotal = round2(itemsTotal + backDues);
    const createdAt = new Date();
    const invoiceNo = generateInvoiceNo(createdAt);

    const [invoice] = await db
      .insert(invoices)
      .values({
        invoiceNo,
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorAddress: doctor.address ?? "",
        doctorPhone: doctor.phone ?? "",
        discountPercent: normalisedInvoiceDiscount.toFixed(2),
        itemsTotal: itemsTotal.toFixed(2),
        backDues: backDues.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        createdAt,
      })
      .returning();

    await db.insert(invoiceItems).values(
      lines.map((line) => ({
        invoiceId: invoice.id,
        medicineId: line.medicineId,
        medicineName: line.medicineName,
        mrp: line.mrp.toFixed(2),
        discountPercent: line.discountPercent.toFixed(2),
        unitRate: line.unitRate.toFixed(2),
        quantity: line.quantity,
        lineTotal: line.lineTotal.toFixed(2),
      })),
    );

    const saved = (await listInvoices()).find((row) => row.id === invoice.id);
    return Response.json({ invoice: saved ?? null }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to save invoice" },
      { status: 500 },
    );
  }
}
