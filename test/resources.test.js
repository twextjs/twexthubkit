// Resource-level behavior: each group builds the documented path and sends the
// documented body. The transport itself is covered in client.test.js.

import { expect, onTestFinished, test } from 'vitest';
import TwextHubKit from '../src/index.js';
import { sendJson, startServer } from './support/server.js';

function collectionResponse(response) {
  sendJson(response, 200, { data: [], _links: { self: '', next: null, prev: null } });
}

test('auth, sessions, and tokens build their paths and bodies', async function () {
  const server = await startServer(function (request, response) {
    if (request.url.includes('/sessions')) {
      sendJson(response, 201, { token: 'session-token' });
      return;
    }
    if (request.url.includes('/tokens')) {
      sendJson(response, 201, { id: '1', name: 'CI', scopes: ['publish'] });
      return;
    }
    sendJson(response, 200, { authorizationUrl: 'https://id.example/authorize' });
  });
  onTestFinished(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url);
  await th.auth.getOidcAuthorizeUrl({ returnTo: '/settings' });
  expect(server.requests[0].url).toBe('/api/v2/auth/oidc/authorize?returnTo=%2Fsettings');

  await th.sessions.create({ namespace: 'kamix', password: 'secret' });
  expect(server.requests[1].url).toBe('/api/v2/sessions');
  expect(JSON.parse(server.requests[1].body.toString())).toEqual({
    namespace: 'kamix',
    password: 'secret',
  });

  await th.tokens.create({ name: 'CI', scopes: ['publish'], expiresInDays: 30 });
  expect(server.requests[2].url).toBe('/api/v2/tokens');
  expect(JSON.parse(server.requests[2].body.toString())).toEqual({
    name: 'CI',
    scopes: ['publish'],
    expiresInDays: 30,
  });
});

test('user updates and binary image uploads use the right verbs and content types', async function () {
  const server = await startServer(function (request, response) {
    sendJson(response, 200, { namespace: 'kamix', displayName: 'Kamix' });
  });
  onTestFinished(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url, { token: 'secret' });
  await th.users.update('kamix', { displayName: 'Kamix', bio: 'New bio' });
  expect(server.requests[0].method).toBe('PATCH');
  expect(server.requests[0].url).toBe('/api/v2/users/kamix');
  expect(JSON.parse(server.requests[0].body.toString())).toEqual({
    displayName: 'Kamix',
    bio: 'New bio',
  });

  await th.users.avatar.upload('kamix', new Uint8Array([1, 2, 3]), {
    contentType: 'image/png',
  });
  expect(server.requests[1].method).toBe('PUT');
  expect(server.requests[1].url).toBe('/api/v2/users/kamix/avatar');
  expect(server.requests[1].headers['content-type']).toBe('image/png');
  expect([...server.requests[1].body]).toEqual([1, 2, 3]);
});

test('organization owners, extensions, and webhooks use their namespaced paths', async function () {
  const server = await startServer(function (request, response) {
    if (request.method === 'PUT' && request.url.includes('/owners/')) {
      response.statusCode = 204;
      response.end();
      return;
    }
    if (request.url.includes('/extensions')) {
      collectionResponse(response);
      return;
    }
    sendJson(response, 201, { id: 1, url: 'https://example.com/hook', secret: 's' });
  });
  onTestFinished(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url, { token: 'secret' });
  await th.orgs.addOwner('acme', 'bob');
  expect(server.requests[0].method).toBe('PUT');
  expect(server.requests[0].url).toBe('/api/v2/orgs/acme/owners/bob');

  await th.orgs.listExtensions('acme', { sort: 'downloads', limit: 5 });
  const extensionUrl = new URL(server.requests[1].url, 'http://localhost');
  expect(extensionUrl.pathname).toBe('/api/v2/orgs/acme/extensions');
  expect(extensionUrl.searchParams.get('sort')).toBe('downloads');
  expect(extensionUrl.searchParams.get('limit')).toBe('5');

  await th.orgs.webhooks.create('acme', {
    url: 'https://example.com/hook',
    events: ['version.published'],
  });
  expect(server.requests[2].url).toBe('/api/v2/orgs/acme/webhooks');
});

test('extension publishing, tags, owners, and transfers send the documented bodies', async function () {
  const server = await startServer(function (request, response) {
    if (
      request.method === 'PUT' ||
      (request.method === 'DELETE' && request.url.includes('/tags/'))
    ) {
      response.statusCode = 204;
      response.end();
      return;
    }
    sendJson(response, 200, { data: { namespace: 'kamix', id: 'xterm' } });
  });
  onTestFinished(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url, { token: 'secret' });
  await th.extensions.versions.publish('kamix', 'xterm', new Uint8Array([31, 139, 8]));
  expect(server.requests[0].method).toBe('POST');
  expect(server.requests[0].url).toBe('/api/v2/@kamix/xterm/versions');
  expect(server.requests[0].headers['content-type']).toBe('application/gzip');
  expect([...server.requests[0].body]).toEqual([31, 139, 8]);

  await th.extensions.tags.set('kamix', 'xterm', 'next', '1.0.0');
  expect(server.requests[1].url).toBe('/api/v2/@kamix/xterm/tags/next');
  expect(JSON.parse(server.requests[1].body.toString())).toEqual({ version: '1.0.0' });

  await th.extensions.owners.accept('kamix', 'xterm', 'bob');
  expect(server.requests[2].method).toBe('POST');
  expect(server.requests[2].url).toBe('/api/v2/@kamix/xterm/owners/bob/accept');

  await th.extensions.transfers.offer('kamix', 'xterm', 'bob');
  expect(server.requests[3].method).toBe('POST');
  expect(server.requests[3].url).toBe('/api/v2/@kamix/xterm/transfers');
  expect(JSON.parse(server.requests[3].body.toString())).toEqual({ to: 'bob' });
});

test('notifications, reports, and admin helpers build their queries and bodies', async function () {
  const server = await startServer(function (request, response) {
    if (request.url.includes('/notifications')) {
      sendJson(response, 200, { updated: 3 });
      return;
    }
    if (request.url.includes('/reports')) {
      sendJson(response, 201, { id: '1', status: 'open' });
      return;
    }
    if (request.url.includes('/versions')) {
      collectionResponse(response);
      return;
    }
    if (request.url.includes('/quota')) {
      sendJson(response, 200, { namespace: 'kamix', blobBytes: 0, maxBlobBytes: 10 });
      return;
    }
    collectionResponse(response);
  });
  onTestFinished(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url, { token: 'secret' });
  await th.notifications.markRead({ all: true });
  expect(JSON.parse(server.requests[0].body.toString())).toEqual({ all: true });

  await th.notifications.markRead({ ids: ['12', '34'] });
  expect(JSON.parse(server.requests[1].body.toString())).toEqual({ ids: [12, 34] });

  await th.reports.create({
    targetType: 'extension',
    targetNamespace: 'kamix',
    targetExtensionId: 'xterm',
    reason: 'spam',
    description: 'Details',
  });
  expect(server.requests[2].url).toBe('/api/v2/reports');
  expect(JSON.parse(server.requests[2].body.toString()).targetExtensionId).toBe('xterm');

  await th.admin.listPendingVersions();
  const pendingUrl = new URL(server.requests[3].url, 'http://localhost');
  expect(pendingUrl.pathname).toBe('/api/v2/versions');
  expect(pendingUrl.searchParams.get('status')).toBe('pending');

  await th.admin.setQuota('kamix', { maxBlobBytes: 10 });
  expect(server.requests[4].url).toBe('/api/v2/admin/users/kamix/quota');
  expect(JSON.parse(server.requests[4].body.toString())).toEqual({ maxBlobBytes: 10 });
});

test('badges and blobs use their own response types and paths', async function () {
  const server = await startServer(function (request, response) {
    if (request.url.startsWith('/api/v2/blobs/')) {
      response.statusCode = 200;
      response.setHeader('content-type', 'application/javascript');
      response.end('var x = 1;');
      return;
    }
    response.statusCode = 200;
    response.setHeader('content-type', 'image/svg+xml');
    response.end('<svg></svg>');
  });
  onTestFinished(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url);
  const badge = await th.badges.getField('kamix', 'xterm', 'downloads', { label: 'downloads' });
  expect(badge).toBe('<svg></svg>');
  const badgeUrl = new URL(server.requests[0].url, 'http://localhost');
  expect(badgeUrl.pathname).toBe('/api/v2/badge/@kamix/xterm/downloads');
  expect(badgeUrl.searchParams.get('label')).toBe('downloads');

  const digest = 'a'.repeat(64);
  const blob = await th.blobs.get(digest);
  expect(await blob.text()).toBe('var x = 1;');
  expect(server.requests[1].url).toBe(`/api/v2/blobs/${digest}`);
});
