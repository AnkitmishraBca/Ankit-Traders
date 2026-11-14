import { eq } from "drizzle-orm";
import { db } from "@/db";
import { daySaves } from "@/db/schema";
import { getCollectionsPayload } from "@/lib/server/data";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { date?: string; notes?: string };
    const date = String(body.date ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json({ error: "Valid date is required" }, { status: 400 });
    }
    const notes = String(body.notes ?? "").trim().slice(0, 400);

    const [existing] = await db.select().from(daySaves).where(eq(daySaves.dayDate, date));
    const row = existing
      ? (
          await db
            .update(daySaves)
            .set({ notes, savedAt: new Date() })
            .where(eq(daySaves.dayDate, date))
            .returning()
        )[0]
      : (await db.insert(daySaves).values({ dayDate: date, notes }).returning())[0];

    const payload = await getCollectionsPayload(date.slice(0, 7), date);
    return Response.json({ daySave: row, collections: payload });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to save day collection" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get("date") ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json({ error: "Valid date is required" }, { status: 400 });
    }
    await db.delete(daySaves).where(eq(daySaves.dayDate, date));
    const payload = await getCollectionsPayload(date.slice(0, 7), date);
    return Response.json({ ok: true, collections: payload });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to unlock day" },
      { status: 500 },
    );
  }
}
