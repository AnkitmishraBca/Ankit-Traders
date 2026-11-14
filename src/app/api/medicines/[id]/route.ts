import { eq } from "drizzle-orm";
import { db } from "@/db";
import { medicines } from "@/db/schema";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const medicineId = Number(id);
    if (!Number.isFinite(medicineId)) {
      return Response.json({ error: "Invalid medicine id" }, { status: 400 });
    }
    const body = (await request.json()) as { name?: string; mrp?: number | string };
    const patch: Record<string, string> = {};
    if (body.name !== undefined) patch.name = String(body.name).trim().slice(0, 180);
    if (body.mrp !== undefined) {
      const mrp = Number(body.mrp);
      if (!Number.isFinite(mrp) || mrp < 0) {
        return Response.json({ error: "Valid MRP is required" }, { status: 400 });
      }
      patch.mrp = mrp.toFixed(2);
    }
    if (Object.keys(patch).length === 0) {
      return Response.json({ error: "Nothing to update" }, { status: 400 });
    }
    const [row] = await db
      .update(medicines)
      .set(patch)
      .where(eq(medicines.id, medicineId))
      .returning();
    if (!row) return Response.json({ error: "Medicine not found" }, { status: 404 });
    return Response.json({ medicine: row });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to update medicine" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const medicineId = Number(id);
    if (!Number.isFinite(medicineId)) {
      return Response.json({ error: "Invalid medicine id" }, { status: 400 });
    }
    await db.delete(medicines).where(eq(medicines.id, medicineId));
    return Response.json({ ok: true, id: medicineId });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to delete medicine" },
      { status: 500 },
    );
  }
}
