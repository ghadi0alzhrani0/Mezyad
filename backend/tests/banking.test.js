import { describe, it, expect } from 'vitest';
import {
  createBankAdapter,
  MockBankAdapter,
  UnconfiguredBankAdapter,
  verifiedOperation,
} from '../src/banking.js';
import { readConfig } from '../src/config.js';
const config = {
  DATABASE_URL: 'postgresql://dummy@localhost/test',
  SESSION_SECRET: 'test-secret-at-least-32-characters-long',
};
describe('Bank adapter contract (local mock only)', () => {
  it('HTTP-like success without explicit eligibility is invalid', async () => {
    const adapter = { startSandboxOperation: async () => ({ status: 200, reference: 'test:ok' }) };
    await expect(verifiedOperation(adapter, {}, 100)).rejects.toMatchObject({
      code: 'BANK_INVALID_RESPONSE',
    });
  });
  it('mock success carries explicit eligibility and non-sensitive reference', async () => {
    const outcome = await verifiedOperation(new MockBankAdapter(), {}, 100);
    expect(outcome.eligible).toBe(true);
    expect(outcome.reference).toMatch(/^mock:/);
  });
  it('mock rejection is an unsuccessful eligibility decision', async () => {
    expect(
      (await verifiedOperation(new MockBankAdapter(), { scenario: 'rejected' }, 100)).eligible
    ).toBe(false);
  });
  it('rejects unbounded/unsafe provider references', async () => {
    for (const reference of ['x'.repeat(121), 'token=secret&customer=123', null])
      await expect(
        verifiedOperation(
          { startSandboxOperation: async () => ({ eligible: true, reference }) },
          {},
          100
        )
      ).rejects.toMatchObject({ code: 'BANK_INVALID_RESPONSE' });
  });
  it('times out even if an adapter ignores abort signals', async () => {
    await expect(
      verifiedOperation({ startSandboxOperation: () => new Promise(() => {}) }, {}, 20)
    ).rejects.toMatchObject({ code: 'BANK_TIMEOUT' });
  });
  it('defaults to unconfigured; blocks fake production integrations', () => {
    expect(createBankAdapter(readConfig(config))).toBeInstanceOf(UnconfiguredBankAdapter);
    expect(() =>
      readConfig({
        ...config,
        NODE_ENV: 'production',
        BANK_ADAPTER: 'mock',
        ALLOW_MOCK_BANK: 'true',
      })
    ).toThrow(/forbidden/);
    expect(() => readConfig({ ...config, BANK_ADAPTER: 'mock' })).toThrow(/opt-in/);
    expect(() => readConfig({ ...config, BANK_ADAPTER: 'sabb' })).toThrow(/approved/);
  });
  it.skip('Genuine Saudi sandbox call — BLOCKED: no approved operation/consent contract or provider credentials', () => {});
});
