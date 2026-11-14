import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

const client = postgres(connectionString, { 
  prepare: false, 
  max: 1,
  connect_timeout: 10, // 10 sec mein connect nahi hua toh error dega (hang nahi hoga)
  idle_timeout: 20,
  max_pipeline: 0 // Query pipelining band karein (yeh hang hone se bachata hai)
});

export const db = drizzle(client);
