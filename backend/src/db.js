import pg from 'pg';
export function createPool(connectionString) {
  return new pg.Pool({
    connectionString,
    max: 12,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });
}
export async function transaction(pool, work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const value = await work(client);
    await client.query('COMMIT');
    return value;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
