// Run the published retry example so cancellation and retry bounds stay accurate.

import fs from 'node:fs';
import { afterEach, expect, test, vi } from 'vitest';
import { TwextHubError, TwextHubNetworkError } from '../src/errors.js';

const guide = fs.readFileSync('docs/guides/errors-and-requests.md', 'utf8');
const example = guide.match(/```js\n(async function getWithRetry[\s\S]*?)\n```/)[1];
const getWithRetry = new Function('TwextHubNetworkError', `${example}; return getWithRetry;`)(
  TwextHubNetworkError,
);

afterEach(function () {
  vi.useRealTimers();
});

test.each([0, -1, 1.5, NaN, Infinity, '3', null])(
  'rejects attempt count %s before execution',
  async function (attempts) {
    const operation = vi.fn();
    await expect(getWithRetry(operation, attempts)).rejects.toThrow(/positive integer/);
    expect(operation).not.toHaveBeenCalled();
  },
);

test.each([false, true])('does not retry an abort (wrapped: %s)', async function (wrapped) {
  const abort = new DOMException('Cancelled', 'AbortError');
  const error = wrapped ? new TwextHubNetworkError('Cancelled', { cause: abort }) : abort;
  const operation = vi.fn().mockRejectedValue(error);
  await expect(getWithRetry(operation)).rejects.toBe(error);
  expect(operation).toHaveBeenCalledTimes(1);
});

test.each([
  new TwextHubNetworkError('Disconnected'),
  new TwextHubNetworkError('Timed out', { cause: new DOMException('', 'TimeoutError') }),
  new TwextHubError('Rate limited', { status: 429 }),
  new TwextHubError('Unavailable', { status: 503 }),
])('retries eligible failures: %s', async function (error) {
  vi.useFakeTimers();
  const operation = vi.fn().mockRejectedValueOnce(error).mockResolvedValue('done');
  const pending = getWithRetry(operation);
  await vi.runAllTimersAsync();
  await expect(pending).resolves.toBe('done');
  expect(operation).toHaveBeenCalledTimes(2);
});

test('stops at the attempt limit and throws the original error', async function () {
  vi.useFakeTimers();
  const error = new TwextHubNetworkError('Disconnected');
  const operation = vi.fn().mockRejectedValue(error);
  const rejected = expect(getWithRetry(operation, 2)).rejects.toBe(error);
  await vi.runAllTimersAsync();
  await rejected;
  expect(operation).toHaveBeenCalledTimes(2);
});
