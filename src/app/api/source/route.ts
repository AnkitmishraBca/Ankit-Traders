import manifest from "@/generated/source-manifest.json";

export const dynamic = "force-dynamic";

export async function GET() {
  const files = Object.keys(manifest.files);
  return Response.json({
    count: files.length,
    files,
    download: "/api/source/file?path=<relative-path>",
  });
}
