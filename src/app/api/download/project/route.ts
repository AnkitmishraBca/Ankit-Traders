import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const ZIP = "ankit-traders-project.zip";

export async function GET() {
  const file = path.join(process.cwd(), "public", ZIP);
  try {
    const data = await fs.readFile(file);
    return new Response(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${ZIP}"`,
        "Content-Length": String(data.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json(
      { error: "Source ZIP not built. Run: node scripts/build-project-zip.mjs" },
      { status: 404 },
    );
  }
}
