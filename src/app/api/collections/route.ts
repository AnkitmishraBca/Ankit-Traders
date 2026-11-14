import { eq } from "drizzle-orm";
import { db } from "@/db";
import { collectionEntries, doctors } from "@/db/schema";
import { getCollectionsPayload } from "@/lib/server/data";
import { round2 } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const payload = await getCollectionsPayload(
      url.searchParams.get("month") ?? undefined,
      url.searchParams.get("date") ?? undefined,
    );
    return Response.json(payload);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load collections" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      collectionDate?: string;
      doctorId?: number | string;
      amount?: number | string;
      paymentMode?: string;
      notes?: string;
    };

    const collectionDate = String(body.collectionDate ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(collectionDate)) {
      return Response.json({ error: "Valid collection date is required" }, { status: 400 });
    }
    const doctorId = Number(body.doctorId ?? 0);
    if (!Number.isFinite(doctorId) || doctorId <= 0) {
      return Response.json({ error: "Please select a doctor" }, { status: 400 });
    }
    const amount = round2(Number(body.amount ?? 0));
    if (!Number.isFinite(amount) || amount <= 0) {
      return Response.json({ error: "Enter a collection amount" }, { status: 400 });
    }

    const [doctor] = await db.select().from(doctors).where(eq(doctors.id, doctorId));
    if (!doctor) return Response.json({ error: "Doctor not found" }, { status: 404 });

    const [row] = await db
      .insert(collectionEntries)
      .values({
        collectionDate,
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorPhone: doctor.phone ?? "",
        doctorAddress: doctor.address ?? "",
        amount: amount.toFixed(2),
        paymentMode: String(body.paymentMode ?? "Cash").slice(0, 30),
        notes: String(body.notes ?? "").trim().slice(0, 240),
      })
      .returning();

    const payload = await getCollectionsPayload(collectionDate.slice(0, 7), collectionDate);
    return Response.json({ entry: row, collections: payload }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to save collection" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const entryId = Number(url.searchParams.get("id") ?? 0);
    if (!Number.isFinite(entryId) || entryId <= 0) {
      return Response.json({ error: "Invalid entry id" }, { status: 400 });
    }
    await db.delete(collectionEntries).where(eq(collectionEntries.id, entryId));
    return Response.json({ ok: true, id: entryId });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to delete entry" },
      { status: 500 },
    );
  }
}
