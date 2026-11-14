import { db } from "@/db";
import { medicines } from "@/db/schema";
import { listMedicines } from "@/lib/server/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ medicines: await listMedicines() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load medicines" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; mrp?: number | string };
    const name = String(body.name ?? "").trim();
    const mrp = Number(body.mrp ?? 0);
    if (!name) return Response.json({ error: "Medicine name is required" }, { status: 400 });
    if (!Number.isFinite(mrp) || mrp <= 0) {
      return Response.json({ error: "Valid MRP is required" }, { status: 400 });
    }
    const [row] = await db
      .insert(medicines)
      .values({ name: name.slice(0, 180), mrp: mrp.toFixed(2) })
      .returning();
    return Response.json({ medicine: row }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to save medicine" },
      { status: 500 },
    );
  }
}
