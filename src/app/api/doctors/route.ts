import { db } from "@/db";
import { doctors } from "@/db/schema";
import { listDoctors } from "@/lib/server/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ doctors: await listDoctors() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load doctors" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      address?: string;
      phone?: string;
      discountPercent?: number | string;
    };
    const name = String(body.name ?? "").trim();
    if (!name) {
      return Response.json({ error: "Doctor name is required" }, { status: 400 });
    }
    const discount = Number(body.discountPercent ?? 0);
    const [row] = await db
      .insert(doctors)
      .values({
        name: name.slice(0, 160),
        address: String(body.address ?? "").trim().slice(0, 1000),
        phone: String(body.phone ?? "").trim().slice(0, 40),
        discountPercent: (Number.isFinite(discount) ? discount : 0).toFixed(2),
      })
      .returning();
    return Response.json({ doctor: row }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to save doctor" },
      { status: 500 },
    );
  }
}
