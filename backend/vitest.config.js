import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 30000,
  },
});
