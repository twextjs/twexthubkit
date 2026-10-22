// Transport regressions cover per-request options, response streams, retry hints,
// and cleanup in browsers that cannot combine abort signals natively.

import { afterEach, expect, test, vi } from 'vitest';
import { HttpClient } from '../src/http-client.js';
import { buildHttpError } from '../src/http-response.js';
import { combineSignals } from '../src/http-support.js';
import { TwextHubError, TwextHubNetworkError } from '../src/errors.js';

afterEach(function () {
  vi.restoreAllMocks();
});

test.each([-1, NaN, Infinity, '5'])(
  'rejects invalid request timeout %s before fetch',
  async function (timeoutMs) {
    const fetch = vi.fn();
    const client = new HttpClient('https://example.com', { fetch });
    await expect(client.request('/meta', { timeoutMs })).rejects.toThrow(TypeError);
    expect(fetch).not.toHaveBeenCalled();
  },
);

test.each([
  [undefined, 100],
  [null, undefined],
  [0, undefined],
  [50, 50],
])('request timeout %s selects %s', async function (timeoutMs, expected) {
  const timeout = vi.spyOn(AbortSignal, 'timeout');
  const client = new HttpClient('https://example.com', {
    timeoutMs: 100,
    fetch: vi.fn().mockResolvedValue(new Response('{}')),
  });
  await client.request('/meta', { timeoutMs });
  if (expected === undefined) {
    expect(timeout).not.toHaveBeenCalled();
  } else {
    expect(timeout).toHaveBeenCalledExactlyOnceWith(expected);
  }
});

test.each(['AbortError', 'TimeoutError'])(
  'normalizes body %s and preserves context',
  async function (name) {
    const cause = new DOMException('body interrupted', name);
    const client = new HttpClient('https://example.com', {
      fetch: vi.fn().mockResolvedValue({
        status: 200,
        text: vi.fn().mockRejectedValue(cause),
        blob: vi.fn().mockRejectedValue(cause),
      }),
    });
    for (const responseType of ['json', 'text', 'blob']) {
      await expect(client.request('/meta', { method: 'POST', responseType })).rejects.toMatchObject(
        {
          name: 'TwextHubNetworkError',
          status: 0,
          method: 'POST',
          url: 'https://example.com/meta',
          cause,
        },
      );
    }
  },
);

test('keeps unrelated body errors and JSON errors unchanged', async function () {
  const cause = new TypeError('body failed');
  const client = new HttpClient('https://example.com', {
    fetch: vi.fn().mockResolvedValue({ status: 200, text: vi.fn().mockRejectedValue(cause) }),
  });
  await expect(client.request('/meta')).rejects.toBe(cause);
  client.fetch = vi.fn().mockResolvedValue(new Response('not json'));
  await expect(client.request('/meta')).rejects.toBeInstanceOf(TwextHubError);
  await expect(client.request('/meta')).rejects.not.toBeInstanceOf(TwextHubNetworkError);
});

test.each([
  [' 7 ', 7],
  ['0', 0],
  ['7abc', undefined],
  ['invalid', undefined],
  ['Thu, 01 Jan 2026 00:00:07 GMT', 7],
  ['Wed, 31 Dec 2025 23:59:59 GMT', 0],
])('parses Retry-After %s as %s', async function (value, expected) {
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-01-01T00:00:00Z'));
  const response = new Response('', { status: 503, headers: { 'retry-after': value } });
  const error = await buildHttpError(response, 'GET', 'https://example.com');
  expect(error.retryAfter).toBe(expected);
});

test.each(['caller', 'timeout', 'already aborted'])(
  'fallback cleans listeners for %s',
  function (source) {
    vi.spyOn(AbortSignal, 'any');
    Object.defineProperty(AbortSignal, 'any', { value: undefined, configurable: true });
    const caller = new AbortController();
    const timeout = new AbortController();
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeout.signal);
    const callerRemove = vi.spyOn(caller.signal, 'removeEventListener');
    const timeoutRemove = vi.spyOn(timeout.signal, 'removeEventListener');
    const timeoutAdd = vi.spyOn(timeout.signal, 'addEventListener');
    if (source === 'already aborted') caller.abort();
    const combined = combineSignals(caller.signal, 100);
    if (source === 'caller') caller.abort();
    if (source === 'timeout') timeout.abort();
    const expected = source === 'timeout' ? timeout.signal.reason : caller.signal.reason;
    expect(combined.aborted).toBe(true);
    expect(combined.reason).toBe(expected);
    expect(callerRemove).toHaveBeenCalledWith('abort', expect.any(Function));
    expect(timeoutRemove).toHaveBeenCalledWith('abort', expect.any(Function));
    if (source === 'already aborted') expect(timeoutAdd).not.toHaveBeenCalled();
  },
);
