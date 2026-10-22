// Vitest runs the SDK tests in Node against real local HTTP servers. The type
// consumer in test/types.ts is checked by tsc, not collected as a test.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js']
  }
});
