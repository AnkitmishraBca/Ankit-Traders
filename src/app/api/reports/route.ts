import { getReportsPayload } from "@/lib/server/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const payload = await getReportsPayload(
      url.searchParams.get("month") ?? undefined,
      url.searchParams.get("date") ?? undefined,
    );
    return Response.json(payload);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to load reports" },
      { status: 500 },
    );
  }
}
