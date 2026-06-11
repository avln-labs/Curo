import { Pool } from 'pg';
import { env } from './env';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export async function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}
