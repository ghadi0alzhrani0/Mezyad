import { readConfig } from './config.js';
import { createPool } from './db.js';
import { createApp } from './app.js';
import { hashPassword, randomToken } from './security.js';
const config = readConfig();
config.dummyPasswordHash = await hashPassword(randomToken());
const pool = createPool(config.databaseUrl);
await pool.query('SELECT 1');
const app = createApp({ pool, config });
const server = app.listen(config.port, config.host, () =>
  console.log(
    `Mezyad API listening on ${config.host}:${config.port}; bank adapter: ${config.bankAdapter}`
  )
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  });
