import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

if (!process.env.DATABASE_URL) {
  console.warn(
    "[ankit-traders] DATABASE_URL is not set - add it in your hosting dashboard before using the app."
  );
}

const isLocalDatabase = databaseUrl.includes("127.0.0.1") || databaseUrl.includes("localhost");
const urlHasSslParam = databaseUrl.includes("sslmode=");

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresClient?: ReturnType<typeof postgres>;
};

export const sqlClient =
  globalForDb.__arenaNextJsPostgresClient ??
  postgres(databaseUrl, {
    prepare: false, // -- Supabase Transaction Pooler (6543) / PgBouncer
    max: Number(process.env.PG_POOL_MAX ?? 5),
    idle_timeout: 20,
    connect_timeout: 15,
    ssl: isLocalDatabase || urlHasSslParam ? undefined : "require",
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresClient = sqlClient;
}

export const db = drizzle(sqlClient);
