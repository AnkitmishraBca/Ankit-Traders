import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

function getConnectionString(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    return "postgresql://postgres:postgres@127.0.0.1:5432/app_db";
  }
  try {
    const url = new URL(raw.trim());
    url.searchParams.delete("sslmode");
    url.searchParams.delete("sslrootcert");
    url.searchParams.delete("pgbouncer");
    return url.toString();
  } catch {
    return raw.trim();
  }
}

const connectionString = getConnectionString();
const isLocal =
  connectionString.includes("127.0.0.1") || connectionString.includes("localhost");

const globalForDb = globalThis as typeof globalThis & {
  __ankitTradersPool?: Pool;
};

function createPool(): Pool {
  const instance = new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  instance.on("error", () => {
    // Pooler dwara band kiye gaye idle connections pg khud replace kar deta hai
  });
  return instance;
}

export const pool = globalForDb.__ankitTradersPool ?? createPool();
globalForDb.__ankitTradersPool = pool;

export const db = drizzle(pool);
