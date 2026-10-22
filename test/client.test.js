// Transport-level behavior: URL building, auth headers, response parsing,
// typed errors, cancellation, and the product defaults.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import TwextHubKit, {
  TwextHubError,
  TwextHubNetworkError,
  product
} from '../src/index.js';
import { sendJson, startServer } from './support/server.js';

test('constructor defaults, options object, and token setter', function () {
  const defaults = new TwextHubKit();
  assert.equal(defaults.baseUrl, 'https://twexts.sdisk.us/api/v2');
  assert.equal(defaults.token, null);
  assert.equal(TwextHubKit.version, product.version);

  const configured = new TwextHubKit({ baseUrl: 'https://example.com/v2', token: 'abc' });
  assert.equal(configured.baseUrl, 'https://example.com/v2');
  assert.equal(configured.token, 'abc');
  assert.equal(configured.setToken('def'), configured);
  assert.equal(configured.token, 'def');
  configured.setToken(null);
  assert.equal(configured.token, null);

  assert.throws(function () {
    new TwextHubKit('ftp://example.com/api');
  }, /http or https/);
  assert.throws(function () {
    new TwextHubKit('https://example.com/api?x=1');
  }, /query or fragment/);
});

test('GET builds the path, sends Accept, and attaches the bearer token', async function (t) {
  const server = await startServer(function (request, response) {
    sendJson(response, 200, { namespace: 'kamix', displayName: 'Kamix' });
  });
  t.after(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url, { token: 'secret' });
  const user = await th.users.get('kamix');

  assert.equal(user.namespace, 'kamix');
  assert.equal(server.requests.length, 1);
  assert.equal(server.requests[0].method, 'GET');
  assert.equal(server.requests[0].url, '/api/v2/users/kamix');
  assert.equal(server.requests[0].headers.authorization, 'Bearer secret');
  assert.equal(server.requests[0].headers.accept, 'application/json');
});

test('query strings and encoded path values are sent as written by the API', async function (t) {
  const server = await startServer(function (request, response) {
    sendJson(response, 200, { data: [], _links: { self: '', next: null, prev: null } });
  });
  t.after(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url);
  await th.extensions.list({ sort: 'downloads', limit: 2, cursor: 'a+b', dir: 'back' });
  const listUrl = new URL(server.requests[0].url, 'http://localhost');
  assert.equal(listUrl.pathname, '/api/v2/extensions');
  assert.equal(listUrl.searchParams.get('sort'), 'downloads');
  assert.equal(listUrl.searchParams.get('limit'), '2');
  assert.equal(listUrl.searchParams.get('cursor'), 'a+b');
  assert.equal(listUrl.searchParams.get('dir'), 'back');

  await th.extensions.versions.get('kamix', 'xterm', '1.0.0+build');
  assert.match(server.requests[1].url, /\/versions\/1\.0\.0%2Bbuild$/);
});

test('JSON bodies set Content-Type and do not add auth by default', async function (t) {
  const server = await startServer(function (request, response) {
    sendJson(response, 201, { token: 'new-token' });
  });
  t.after(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url);
  await th.sessions.create({ namespace: 'kamix', password: 'hunter22' });

  const request = server.requests[0];
  assert.equal(request.method, 'POST');
  assert.equal(request.headers['content-type'], 'application/json');
  assert.equal(request.headers.authorization, undefined);
  assert.deepEqual(JSON.parse(request.body.toString()), {
    namespace: 'kamix',
    password: 'hunter22'
  });
});

test('HTTP problems become TwextHubError with the problem body and retry hint', async function (t) {
  const server = await startServer(function (request, response) {
    sendJson(
      response,
      422,
      {
        type: 'about:blank',
        title: 'Validation Error',
        status: 422,
        detail: 'One or more fields failed validation.',
        errors: [{ field: 'namespace', message: 'Required' }]
      },
      { 'content-type': 'application/problem+json', 'retry-after': '7' }
    );
  });
  t.after(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url);
  await assert.rejects(th.users.create({ namespace: '', password: 'x' }), function (error) {
    assert.ok(error instanceof TwextHubError);
    assert.equal(error.status, 422);
    assert.equal(error.problem.title, 'Validation Error');
    assert.equal(error.retryAfter, 7);
    assert.match(error.message, /One or more fields failed validation/);
    assert.match(error.message, /namespace: Required/);
    return true;
  });
});

test('204 responses resolve to undefined', async function (t) {
  const server = await startServer(function (request, response) {
    response.statusCode = 204;
    response.end();
  });
  t.after(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url, { token: 'secret' });
  const result = await th.users.delete('kamix');
  assert.equal(result, undefined);
  assert.equal(server.requests[0].method, 'DELETE');
});

test('text and blob responses keep their native types', async function (t) {
  const bytes = new Uint8Array([0, 1, 2, 255]);
  const server = await startServer(function (request, response) {
    if (request.url.endsWith('/admin/metrics')) {
      response.statusCode = 200;
      response.setHeader('content-type', 'text/plain');
      response.end('twexthub_requests_total 1\n');
      return;
    }
    response.statusCode = 200;
    response.setHeader('content-type', 'image/png');
    response.end(Buffer.from(bytes));
  });
  t.after(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url, { token: 'secret' });
  const metrics = await th.admin.getMetrics();
  assert.equal(metrics, 'twexthub_requests_total 1\n');

  const blob = await th.extensions.versions.download('kamix', 'xterm', '1.0.0');
  assert.ok(blob instanceof Blob);
  assert.equal(blob.type, 'image/png');
  assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), bytes);
});

test('network failures, timeouts, and caller aborts are TwextHubNetworkError', async function () {
  const failing = new TwextHubKit('https://example.com/api/v2', {
    fetch: function () {
      return Promise.reject(new TypeError('socket closed'));
    }
  });
  await assert.rejects(failing.instance.meta(), function (error) {
    assert.ok(error instanceof TwextHubNetworkError);
    assert.equal(error.status, 0);
    assert.match(error.message, /socket closed/);
    return true;
  });

  const waitingFetch = function (input, init) {
    return new Promise(function (resolve, reject) {
      init.signal.addEventListener('abort', function () {
        reject(init.signal.reason);
      }, { once: true });
    });
  };
  const timeout = new TwextHubKit('https://example.com/api/v2', {
    fetch: waitingFetch,
    timeoutMs: 5
  });
  await assert.rejects(timeout.instance.meta(), /timed out after 5 ms/);

  const controller = new AbortController();
  const aborted = new TwextHubKit('https://example.com/api/v2', { fetch: waitingFetch });
  const pending = aborted.instance.meta({ signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, /was aborted/);
});

test('OIDC callback returns a redirect target instead of following it', async function (t) {
  const server = await startServer(function (request, response) {
    response.statusCode = 302;
    response.setHeader('location', '/signed-in');
    response.end();
  });
  t.after(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url);
  const result = await th.auth.oidcCallback({ state: 'state-value' });
  assert.deepEqual(result, { redirectUrl: '/signed-in' });
  assert.match(server.requests[0].url, /\/auth\/oidc\/callback\?state=state-value$/);
});
