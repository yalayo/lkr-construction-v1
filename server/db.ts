import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.PGDATABASE || !process.env.PGHOST || !process.env.PGPORT || !process.env.PGUSER || !process.env.PGPASSWORD) {
  throw new Error(
    "PostgreSQL environment variables must be set: PGDATABASE, PGHOST, PGPORT, PGUSER, PGPASSWORD."
  );
}

export const pool = new Pool({
  database: process.env.PGDATABASE,
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

export const db = drizzle(pool, { schema });