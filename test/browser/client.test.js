// Browser-mode tests run the same client in Chromium against a CORS-enabled
// local API. They verify the parts Node cannot: native browser fetch, cross-
// origin preflight, browser Blob handling, and AbortSignal behavior.

import { expect, inject, test } from 'vitest';
import TwextHubKit, { TwextHubError, TwextHubNetworkError } from '../../src/index.js';

const apiBaseUrl = inject('apiBaseUrl');

test('uses native browser fetch and sends bearer auth across origins', async function () {
  expect(typeof window).toBe('object');
  expect(typeof fetch).toBe('function');

  const th = new TwextHubKit(apiBaseUrl, { token: 'browser-secret' });
  const user = await th.users.get('kamix');

  expect(user.namespace).toBe('kamix');
  expect(user.echo.authorization).toBe('Bearer browser-secret');
  expect(user.echo.accept).toBe('application/json');
  expect(user.echo.url).toBe('/api/v2/users/kamix');
});

test('sends a JSON POST through the browser preflight', async function () {
  const th = new TwextHubKit(apiBaseUrl, { token: 'browser-secret' });
  const result = await th.sessions.create({ namespace: 'kamix', password: 'secret' });

  expect(result.token).toBe('browser-token');
  expect(result.echo.authorization).toBe('Bearer browser-secret');
  expect(result.echo.contentType).toBe('application/json');
  expect(result.echo.body).toEqual({ namespace: 'kamix', password: 'secret' });
});

test('returns a browser Blob for a download', async function () {
  const th = new TwextHubKit(apiBaseUrl);
  const blob = await th.extensions.versions.download('kamix', 'xterm', '1.0.0');

  expect(blob).toBeInstanceOf(Blob);
  expect(blob.type).toContain('application/javascript');
  expect(new Uint8Array(await blob.arrayBuffer())).toEqual(new Uint8Array([0, 1, 2, 255]));
});

test('turns an HTTP problem into TwextHubError in the browser', async function () {
  const th = new TwextHubKit(apiBaseUrl);
  let caught;
  try {
    await th.users.get('missing');
  } catch (error) {
    caught = error;
  }

  expect(caught).toBeInstanceOf(TwextHubError);
  expect(caught.status).toBe(404);
  expect(caught.problem.detail).toBe('No account named missing.');
});

test('honors timeoutMs with the browser fetch implementation', async function () {
  const th = new TwextHubKit(apiBaseUrl);
  let caught;
  try {
    await th.users.get('slow', { timeoutMs: 10 });
  } catch (error) {
    caught = error;
  }

  expect(caught).toBeInstanceOf(TwextHubNetworkError);
  expect(caught.status).toBe(0);
  expect(caught.message).toMatch(/timed out after 10 ms/);
});
