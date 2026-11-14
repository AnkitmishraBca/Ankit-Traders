import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

const client = postgres(connectionString, { 
  prepare: false, 
  max: 1,
  connect_timeout: 15, 
  idle_timeout: 20 
});

export const db = drizzle(client);
