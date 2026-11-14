import manifest from "@/generated/source-manifest.json";

export const dynamic = "force-dynamic";

const files = manifest.files as Record<string, string>;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requested = (url.searchParams.get("path") ?? "").replace(/^\/+/, "");
  const inline = url.searchParams.get("inline") === "1";

  if (!requested) {
    return Response.json(
      { error: "Add ?path=src/app/page.tsx (see /api/source for the file list)" },
      { status: 400 },
    );
  }
  if (!Object.prototype.hasOwnProperty.call(files, requested)) {
    return Response.json({ error: `File not found: ${requested}` }, { status: 404 });
  }

  const content = files[requested];
  const filename = requested.split("/").pop() || "file.txt";
  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": inline
        ? "text/plain; charset=utf-8"
        : "application/octet-stream; charset=utf-8",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
