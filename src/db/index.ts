import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL!;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresClient?: ReturnType<typeof postgres>;
};

export const sqlClient =
  globalForDb.__arenaNextJsPostgresClient ??
  postgres(databaseUrl, {
    prepare: false, 
    max: 1, 
    idle_timeout: 10, 
    connect_timeout: 10, 
    max_pipeline: 0, 
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresClient = sqlClient;
}

export const db = drizzle(sqlClient);
