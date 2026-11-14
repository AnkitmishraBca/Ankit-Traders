import { eq } from "drizzle-orm";
import { db } from "@/db";
import { doctors } from "@/db/schema";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const doctorId = Number(id);
    if (!Number.isFinite(doctorId)) {
      return Response.json({ error: "Invalid doctor id" }, { status: 400 });
    }
    const body = (await request.json()) as {
      name?: string;
      address?: string;
      phone?: string;
      discountPercent?: number | string;
    };
    const patch: Record<string, string> = {};
    if (body.name !== undefined) patch.name = String(body.name).trim().slice(0, 160);
    if (body.address !== undefined) patch.address = String(body.address).trim().slice(0, 1000);
    if (body.phone !== undefined) patch.phone = String(body.phone).trim().slice(0, 40);
    if (body.discountPercent !== undefined) {
      const discount = Number(body.discountPercent);
      patch.discountPercent = (Number.isFinite(discount) ? discount : 0).toFixed(2);
    }
    if (Object.keys(patch).length === 0) {
      return Response.json({ error: "Nothing to update" }, { status: 400 });
    }
    const [row] = await db.update(doctors).set(patch).where(eq(doctors.id, doctorId)).returning();
    if (!row) return Response.json({ error: "Doctor not found" }, { status: 404 });
    return Response.json({ doctor: row });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to update doctor" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const doctorId = Number(id);
    if (!Number.isFinite(doctorId)) {
      return Response.json({ error: "Invalid doctor id" }, { status: 400 });
    }
    await db.delete(doctors).where(eq(doctors.id, doctorId));
    return Response.json({ ok: true, id: doctorId });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to delete doctor" },
      { status: 500 },
    );
  }
}
