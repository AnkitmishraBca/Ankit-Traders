import { listDoctors, listMedicines } from "@/lib/server/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [doctors, medicines] = await Promise.all([listDoctors(), listMedicines()]);
    return Response.json({ doctors, medicines });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load masters" },
      { status: 500 },
    );
  }
}
