import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const FILE = "ankit-traders-billing.html";
const candidates = [
  path.join(process.cwd(), "public", FILE),
  path.join(process.cwd(), "public", "standalone", FILE),
];

export async function GET() {
  for (const file of candidates) {
    try {
      const html = await fs.readFile(file);
      return new Response(new Uint8Array(html), {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="${FILE}"`,
          "Content-Length": String(html.byteLength),
          "Cache-Control": "no-store",
        },
      });
    } catch {
      /* try the next location */
    }
  }
  return Response.json(
    { error: "Single-file app not built. Run: node scripts/build-standalone.mjs" },
    { status: 404 },
  );
}
