// Resource validation must reject invalid input locally and encode accepted IDs.

import { expect, test, vi } from 'vitest';
import TwextHubKit from '../src/index.js';

const methods = [
  ['auth', 'deleteOidcIdentity', '/auth/oidc/identities/'],
  ['auth', 'renamePasskey', '/auth/mfa/passkeys/'],
  ['auth', 'deletePasskey', '/auth/mfa/passkeys/'],
  ['sessions', 'delete', '/sessions/'],
  ['tokens', 'update', '/tokens/'],
  ['tokens', 'delete', '/tokens/'],
];

test.each(methods)('%s.%s validates and encodes IDs', async function (resource, method, path) {
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  const client = new TwextHubKit('https://example.com', { fetch });
  for (const id of [undefined, null, '', {}, [], true]) {
    expect(function () {
      client[resource][method](id, {});
    }).toThrow(TypeError);
  }
  expect(fetch).not.toHaveBeenCalled();
  await client[resource][method]('a/b', {});
  expect(fetch.mock.calls[0][0]).toBe(`https://example.com${path}a%2Fb`);
  await client[resource][method](12, {});
  expect(fetch.mock.calls[1][0]).toBe(`https://example.com${path}12`);
});

test.each([
  {},
  { ids: '12' },
  { ids: ['bad'] },
  { ids: [1.5] },
  { ids: [Infinity] },
  { ids: Array(1) },
])('markRead rejects invalid IDs: %j', function (payload) {
  const fetch = vi.fn();
  const client = new TwextHubKit('https://example.com', { fetch });
  expect(function () {
    client.notifications.markRead(payload);
  }).toThrow(/notification ids/);
  expect(fetch).not.toHaveBeenCalled();
});

test('markRead preserves all:true even when IDs are invalid', async function () {
  const fetch = vi.fn().mockResolvedValue(new Response('{}'));
  const client = new TwextHubKit('https://example.com', { fetch });
  await client.notifications.markRead({ all: true, ids: 'ignored' });
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ all: true });
});
