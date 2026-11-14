import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * `DATABASE_URL` must be provided in the hosting environment (Vercel → Settings →
 * Environment Variables). During a production build the variable may be absent —
 * we then fall back to a placeholder so the build never crashes; the very first
 * query will surface a clear "set DATABASE_URL" error instead.
 */
const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

if (!process.env.DATABASE_URL) {
  console.warn(
    "[ankit-traders] DATABASE_URL is not set — add it in your hosting dashboard before using the app.",
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    max: 5,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
