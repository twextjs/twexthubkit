// Resource-level behavior: each group builds the documented path and sends the
// documented body. The transport itself is covered in client.test.js.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import TwextHubKit from '../src/index.js';
import { sendJson, startServer } from './support/server.js';

function collectionResponse(response) {
  sendJson(response, 200, { data: [], _links: { self: '', next: null, prev: null } });
}

test('auth, sessions, and tokens build their paths and bodies', async function (t) {
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
  t.after(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url);
  await th.auth.getOidcAuthorizeUrl({ returnTo: '/settings' });
  assert.equal(server.requests[0].url, '/api/v2/auth/oidc/authorize?returnTo=%2Fsettings');

  await th.sessions.create({ namespace: 'kamix', password: 'secret' });
  assert.equal(server.requests[1].url, '/api/v2/sessions');
  assert.deepEqual(JSON.parse(server.requests[1].body.toString()), {
    namespace: 'kamix',
    password: 'secret'
  });

  await th.tokens.create({ name: 'CI', scopes: ['publish'], expiresInDays: 30 });
  assert.equal(server.requests[2].url, '/api/v2/tokens');
  assert.deepEqual(JSON.parse(server.requests[2].body.toString()), {
    name: 'CI',
    scopes: ['publish'],
    expiresInDays: 30
  });
});

test('user updates and binary image uploads use the right verbs and content types', async function (t) {
  const server = await startServer(function (request, response) {
    sendJson(response, 200, { namespace: 'kamix', displayName: 'Kamix' });
  });
  t.after(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url, { token: 'secret' });
  await th.users.update('kamix', { displayName: 'Kamix', bio: 'New bio' });
  assert.equal(server.requests[0].method, 'PATCH');
  assert.equal(server.requests[0].url, '/api/v2/users/kamix');
  assert.deepEqual(JSON.parse(server.requests[0].body.toString()), {
    displayName: 'Kamix',
    bio: 'New bio'
  });

  await th.users.avatar.upload('kamix', new Uint8Array([1, 2, 3]), {
    contentType: 'image/png'
  });
  assert.equal(server.requests[1].method, 'PUT');
  assert.equal(server.requests[1].url, '/api/v2/users/kamix/avatar');
  assert.equal(server.requests[1].headers['content-type'], 'image/png');
  assert.deepEqual([...server.requests[1].body], [1, 2, 3]);
});

test('organization owners, extensions, and webhooks use their namespaced paths', async function (t) {
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
  t.after(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url, { token: 'secret' });
  await th.orgs.addOwner('acme', 'bob');
  assert.equal(server.requests[0].method, 'PUT');
  assert.equal(server.requests[0].url, '/api/v2/orgs/acme/owners/bob');

  await th.orgs.listExtensions('acme', { sort: 'downloads', limit: 5 });
  const extensionUrl = new URL(server.requests[1].url, 'http://localhost');
  assert.equal(extensionUrl.pathname, '/api/v2/orgs/acme/extensions');
  assert.equal(extensionUrl.searchParams.get('sort'), 'downloads');
  assert.equal(extensionUrl.searchParams.get('limit'), '5');

  await th.orgs.webhooks.create('acme', {
    url: 'https://example.com/hook',
    events: ['version.published']
  });
  assert.equal(server.requests[2].url, '/api/v2/orgs/acme/webhooks');
});

test('extension publishing, tags, owners, and transfers send the documented bodies', async function (t) {
  const server = await startServer(function (request, response) {
    if (request.method === 'PUT' || (request.method === 'DELETE' && request.url.includes('/tags/'))) {
      response.statusCode = 204;
      response.end();
      return;
    }
    sendJson(response, 200, { data: { namespace: 'kamix', id: 'xterm' } });
  });
  t.after(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url, { token: 'secret' });
  await th.extensions.versions.publish('kamix', 'xterm', new Uint8Array([31, 139, 8]));
  assert.equal(server.requests[0].method, 'POST');
  assert.equal(server.requests[0].url, '/api/v2/@kamix/xterm/versions');
  assert.equal(server.requests[0].headers['content-type'], 'application/gzip');
  assert.deepEqual([...server.requests[0].body], [31, 139, 8]);

  await th.extensions.tags.set('kamix', 'xterm', 'next', '1.0.0');
  assert.equal(server.requests[1].url, '/api/v2/@kamix/xterm/tags/next');
  assert.deepEqual(JSON.parse(server.requests[1].body.toString()), { version: '1.0.0' });

  await th.extensions.owners.accept('kamix', 'xterm', 'bob');
  assert.equal(server.requests[2].method, 'POST');
  assert.equal(server.requests[2].url, '/api/v2/@kamix/xterm/owners/bob/accept');

  await th.extensions.transfers.offer('kamix', 'xterm', 'bob');
  assert.equal(server.requests[3].method, 'POST');
  assert.equal(server.requests[3].url, '/api/v2/@kamix/xterm/transfers');
  assert.deepEqual(JSON.parse(server.requests[3].body.toString()), { to: 'bob' });
});

test('notifications, reports, and admin helpers build their queries and bodies', async function (t) {
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
  t.after(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url, { token: 'secret' });
  await th.notifications.markRead({ all: true });
  assert.deepEqual(JSON.parse(server.requests[0].body.toString()), { all: true });

  await th.notifications.markRead({ ids: ['12', '34'] });
  assert.deepEqual(JSON.parse(server.requests[1].body.toString()), { ids: [12, 34] });

  await th.reports.create({
    targetType: 'extension',
    targetNamespace: 'kamix',
    targetExtensionId: 'xterm',
    reason: 'spam',
    description: 'Details'
  });
  assert.equal(server.requests[2].url, '/api/v2/reports');
  assert.equal(JSON.parse(server.requests[2].body.toString()).targetExtensionId, 'xterm');

  await th.admin.listPendingVersions();
  const pendingUrl = new URL(server.requests[3].url, 'http://localhost');
  assert.equal(pendingUrl.pathname, '/api/v2/versions');
  assert.equal(pendingUrl.searchParams.get('status'), 'pending');

  await th.admin.setQuota('kamix', { maxBlobBytes: 10 });
  assert.equal(server.requests[4].url, '/api/v2/admin/users/kamix/quota');
  assert.deepEqual(JSON.parse(server.requests[4].body.toString()), { maxBlobBytes: 10 });
});

test('badges and blobs use their own response types and paths', async function (t) {
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
  t.after(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url);
  const badge = await th.badges.getField('kamix', 'xterm', 'downloads', { label: 'downloads' });
  assert.equal(badge, '<svg></svg>');
  const badgeUrl = new URL(server.requests[0].url, 'http://localhost');
  assert.equal(badgeUrl.pathname, '/api/v2/badge/@kamix/xterm/downloads');
  assert.equal(badgeUrl.searchParams.get('label'), 'downloads');

  const digest = 'a'.repeat(64);
  const blob = await th.blobs.get(digest);
  assert.equal(await blob.text(), 'var x = 1;');
  assert.equal(server.requests[1].url, `/api/v2/blobs/${digest}`);
});
