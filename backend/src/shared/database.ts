import { Pool } from 'pg';
import { env } from './env';

// Supabase requires SSL; local Postgres works with ssl: false
const isSupabase = env.DATABASE_URL.includes('supabase.com') ||
                   env.DATABASE_URL.includes('pooler.supabase.com');

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

/**
 * Typed query helper.
 * Usage: const { rows } = await db.query<MyType>('SELECT ...', [params]);
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

export const db = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async query<T extends Row = Row>(
    text: string,
    params?: unknown[]
  ): Promise<import('pg').QueryResult<T>> {
    return pool.query<T>(text, params);
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async queryOne<T extends Row = Row>(
    text: string,
    params?: unknown[]
  ): Promise<T | null> {
    const result = await pool.query<T>(text, params);
    return result.rows[0] ?? null;
  },

  async transaction<T>(
    fn: (client: import('pg').PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

/** Test database connectivity on startup */
export async function testConnection(): Promise<void> {
  try {
    const { rows } = await pool.query('SELECT NOW() as now');
    console.log(`[DB] Connected to database ✓  (${rows[0].now})`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[DB] Database not reachable — running in offline/demo mode. (${message})`);
  }
}

// Keep backward-compat alias
export async function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}
