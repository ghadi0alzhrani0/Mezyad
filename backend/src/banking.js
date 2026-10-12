import { randomUUID } from 'node:crypto';
import { ApiError } from './errors.js';

// No provider endpoint is invented. Section 7.4 needs an approved operation,
// consent contract and credentials before a genuine provider can be added.
export class UnconfiguredBankAdapter {
  mode = 'unconfigured';
  async startSandboxOperation() {
    throw new ApiError(
      503,
      'BANK_NOT_CONFIGURED',
      'تكامل البنك غير متاح؛ لم تُعتمد عملية الـSandbox وصلاحياتها بعد.'
    );
  }
}
export class MockBankAdapter {
  mode = 'mock';
  async startSandboxOperation({ scenario = 'success', signal }) {
    if (scenario === 'timeout')
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, 60000);
        signal.addEventListener(
          'abort',
          () => {
            clearTimeout(timer);
            reject(signal.reason);
          },
          { once: true }
        );
      });
    if (scenario === 'error') throw new Error('Mock provider error');
    if (scenario === 'auth-error')
      throw new ApiError(502, 'BANK_AUTH_ERROR', 'تعذرت مصادقة خدمة الاختبار.');
    if (scenario === 'invalid-response') return { ok: true };
    return { eligible: scenario !== 'rejected', reference: `mock:${randomUUID()}` };
  }
}
export function createBankAdapter(config) {
  if (config.bankAdapter === 'mock' && config.allowMock && config.nodeEnv !== 'production')
    return new MockBankAdapter();
  return new UnconfiguredBankAdapter();
}
export async function verifiedOperation(adapter, input, timeoutMs) {
  const controller = new AbortController();
  let timer;
  try {
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        const error = new ApiError(
          502,
          'BANK_TIMEOUT',
          'انتهت مهلة خدمة الاختبار. لم يُعتمد الالتزام.'
        );
        controller.abort(error);
        reject(error);
      }, timeoutMs);
    });
    const result = await Promise.race([
      adapter.startSandboxOperation({ ...input, signal: controller.signal }),
      timeout,
    ]);
    // A transport success alone is deliberately insufficient for eligibility.
    if (
      typeof result?.eligible !== 'boolean' ||
      typeof result.reference !== 'string' ||
      !/^[a-zA-Z0-9:_-]{1,120}$/.test(result.reference)
    ) {
      throw new ApiError(
        502,
        'BANK_INVALID_RESPONSE',
        'استجابة خدمة الاختبار غير صالحة. لم يُعتمد الالتزام.'
      );
    }
    return result;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, 'BANK_ERROR', 'تعذر إتمام طلب خدمة الاختبار. يمكنك المحاولة لاحقًا.');
  } finally {
    clearTimeout(timer);
  }
}
