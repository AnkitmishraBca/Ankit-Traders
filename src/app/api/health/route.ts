import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

type ErrorDetails = {
  message?: string;
  code?: string;
  detail?: string;
  hint?: string;
  syscall?: string;
  errors?: { message?: string; code?: string }[];
  cause?: ErrorDetails;
};

function inspectDatabaseUrl(raw: string | undefined) {
  if (!raw) {
    return { present: false };
  }
  const hasSpaces = raw !== raw.trim();
  const wrappedInQuotes =
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"));

  try {
    const parsed = new URL(raw);
    return {
      present: true,
      hasSpaces,
      wrappedInQuotes,
      protocol: parsed.protocol,
      username: decodeURIComponent(parsed.username),
      passwordLength: decodeURIComponent(parsed.password).length,
      hostname: parsed.hostname,
      port: parsed.port || "(default 5432)",
      database: parsed.pathname.replace(/^\//, ""),
      search: parsed.search,
    };
  } catch (urlErr) {
    return {
      present: true,
      hasSpaces,
      wrappedInQuotes,
      urlParseError: urlErr instanceof Error ? urlErr.message : String(urlErr),
    };
  }
}

export async function GET() {
  const urlCheck = inspectDatabaseUrl(process.env.DATABASE_URL);

  try {
    const { db } = await import("@/db");
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch (error) {
    const err = (error ?? {}) as ErrorDetails;
    const cause = err.cause;

    return Response.json(
      {
        ok: false,
        error: err.message ?? String(error),
        cause: cause?.message ?? null,
        code: cause?.code ?? err.code ?? null,
        detail: cause?.detail ?? err.detail ?? null,
        hint: cause?.hint ?? err.hint ?? null,
        syscall: cause?.syscall ?? err.syscall ?? null,
        subErrors: Array.isArray(cause?.errors)
          ? cause.errors.map((e) => e?.message ?? e?.code ?? String(e))
          : null,
        urlCheck,
      },
      { status: 500 },
    );
  }
}
