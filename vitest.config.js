// Two projects share one command: the Node suite keeps its local HTTP server,
// and the browser project runs the same client in Chromium against a CORS-
// enabled server started by its global setup.

import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: ['test/*.test.js'],
        },
      },
      {
        test: {
          name: 'browser',
          include: ['test/browser/**/*.test.js'],
          globalSetup: ['./test/browser/setup.js'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
