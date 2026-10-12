import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
export const root = fileURLToPath(new URL('../../', import.meta.url));
dotenv.config({ path: path.join(root, '.env'), quiet: true });
export function readConfig(env = process.env) {
  const config = {
    nodeEnv: env.NODE_ENV || 'development',
    databaseUrl: env.DATABASE_URL,
    sessionSecret: env.SESSION_SECRET,
    frontendOrigin: env.FRONTEND_ORIGIN || 'http://localhost:5173',
    uploadDir: path.resolve(root, env.UPLOAD_DIR || 'backend/uploads'),
    bankAdapter: env.BANK_ADAPTER || 'unconfigured',
    allowMock: env.ALLOW_MOCK_BANK === 'true',
    bankTimeoutMs: Number(env.BANK_TIMEOUT_MS || 5000),
    port: Number(env.PORT || 3000),
    host: env.HOST || '127.0.0.1',
  };
  if (!config.databaseUrl) throw new Error('DATABASE_URL is required.');
  if (
    !config.sessionSecret ||
    config.sessionSecret.length < 32 ||
    config.sessionSecret.startsWith('replace_with')
  )
    throw new Error('Set a random SESSION_SECRET of at least 32 characters.');
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535)
    throw new Error('Invalid PORT.');
  if (
    !Number.isFinite(config.bankTimeoutMs) ||
    config.bankTimeoutMs < 10 ||
    config.bankTimeoutMs > 30000
  )
    throw new Error('Invalid BANK_TIMEOUT_MS.');
  if (!['unconfigured', 'mock'].includes(config.bankAdapter))
    throw new Error('No approved genuine bank adapter has been configured.');
  if (config.bankAdapter === 'mock' && (!config.allowMock || config.nodeEnv === 'production'))
    throw new Error(
      'Mock banking requires explicit local/test opt-in and is forbidden in production.'
    );
  return config;
}
