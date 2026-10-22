// Transport-level behavior: URL building, auth headers, response parsing,
// typed errors, cancellation, and the product defaults.

import { expect, onTestFinished, test } from 'vitest';
import TwextHubKit, { TwextHubError, TwextHubNetworkError, product } from '../src/index.js';
import { sendJson, startServer } from './support/server.js';

test('constructor defaults, options object, and token setter', function () {
  const defaults = new TwextHubKit();
  expect(defaults.baseUrl).toBe('https://twexts.sdisk.us/api/v2');
  expect(defaults.token).toBeNull();
  expect(TwextHubKit.version).toBe(product.version);

  const configured = new TwextHubKit({ baseUrl: 'https://example.com/v2', token: 'abc' });
  expect(configured.baseUrl).toBe('https://example.com/v2');
  expect(configured.token).toBe('abc');
  expect(configured.setToken('def')).toBe(configured);
  expect(configured.token).toBe('def');
  configured.setToken(null);
  expect(configured.token).toBeNull();

  expect(function () {
    new TwextHubKit('ftp://example.com/api');
  }).toThrow(/http or https/);
  expect(function () {
    new TwextHubKit('https://example.com/api?x=1');
  }).toThrow(/query or fragment/);
});

test('GET builds the path, sends Accept, and attaches the bearer token', async function () {
  const server = await startServer(function (request, response) {
    sendJson(response, 200, { namespace: 'kamix', displayName: 'Kamix' });
  });
  onTestFinished(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url, { token: 'secret' });
  const user = await th.users.get('kamix');

  expect(user.namespace).toBe('kamix');
  expect(server.requests).toHaveLength(1);
  expect(server.requests[0].method).toBe('GET');
  expect(server.requests[0].url).toBe('/api/v2/users/kamix');
  expect(server.requests[0].headers.authorization).toBe('Bearer secret');
  expect(server.requests[0].headers.accept).toBe('application/json');
});

test('query strings and encoded path values are sent as written by the API', async function () {
  const server = await startServer(function (request, response) {
    sendJson(response, 200, { data: [], _links: { self: '', next: null, prev: null } });
  });
  onTestFinished(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url);
  await th.extensions.list({ sort: 'downloads', limit: 2, cursor: 'a+b', dir: 'back' });
  const listUrl = new URL(server.requests[0].url, 'http://localhost');
  expect(listUrl.pathname).toBe('/api/v2/extensions');
  expect(listUrl.searchParams.get('sort')).toBe('downloads');
  expect(listUrl.searchParams.get('limit')).toBe('2');
  expect(listUrl.searchParams.get('cursor')).toBe('a+b');
  expect(listUrl.searchParams.get('dir')).toBe('back');

  await th.extensions.versions.get('kamix', 'xterm', '1.0.0+build');
  expect(server.requests[1].url).toMatch(/\/versions\/1\.0\.0%2Bbuild$/);
});

test('JSON bodies set Content-Type and do not add auth by default', async function () {
  const server = await startServer(function (request, response) {
    sendJson(response, 201, { token: 'new-token' });
  });
  onTestFinished(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url);
  await th.sessions.create({ namespace: 'kamix', password: 'hunter22' });

  const request = server.requests[0];
  expect(request.method).toBe('POST');
  expect(request.headers['content-type']).toBe('application/json');
  expect(request.headers.authorization).toBeUndefined();
  expect(JSON.parse(request.body.toString())).toEqual({
    namespace: 'kamix',
    password: 'hunter22',
  });
});

test('HTTP problems become TwextHubError with the problem body and retry hint', async function () {
  const server = await startServer(function (request, response) {
    sendJson(
      response,
      422,
      {
        type: 'about:blank',
        title: 'Validation Error',
        status: 422,
        detail: 'One or more fields failed validation.',
        errors: [{ field: 'namespace', message: 'Required' }],
      },
      { 'content-type': 'application/problem+json', 'retry-after': '7' },
    );
  });
  onTestFinished(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url);
  let caught;
  try {
    await th.users.create({ namespace: '', password: 'x' });
  } catch (error) {
    caught = error;
  }

  expect(caught).toBeInstanceOf(TwextHubError);
  expect(caught.status).toBe(422);
  expect(caught.problem.title).toBe('Validation Error');
  expect(caught.retryAfter).toBe(7);
  expect(caught.message).toMatch(/One or more fields failed validation/);
  expect(caught.message).toMatch(/namespace: Required/);
});

test('204 responses resolve to undefined', async function () {
  const server = await startServer(function (request, response) {
    response.statusCode = 204;
    response.end();
  });
  onTestFinished(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url, { token: 'secret' });
  const result = await th.users.delete('kamix');
  expect(result).toBeUndefined();
  expect(server.requests[0].method).toBe('DELETE');
});

test('text and blob responses keep their native types', async function () {
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
  onTestFinished(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url, { token: 'secret' });
  const metrics = await th.admin.getMetrics();
  expect(metrics).toBe('twexthub_requests_total 1\n');

  const blob = await th.extensions.versions.download('kamix', 'xterm', '1.0.0');
  expect(blob).toBeInstanceOf(Blob);
  expect(blob.type).toBe('image/png');
  expect(new Uint8Array(await blob.arrayBuffer())).toEqual(bytes);
});

test('network failures, timeouts, and caller aborts are TwextHubNetworkError', async function () {
  const failing = new TwextHubKit('https://example.com/api/v2', {
    fetch: function () {
      return Promise.reject(new TypeError('socket closed'));
    },
  });
  let caught;
  try {
    await failing.instance.meta();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(TwextHubNetworkError);
  expect(caught.status).toBe(0);
  expect(caught.message).toMatch(/socket closed/);

  const waitingFetch = function (input, init) {
    return new Promise(function (resolve, reject) {
      init.signal.addEventListener(
        'abort',
        function () {
          reject(init.signal.reason);
        },
        { once: true },
      );
    });
  };
  const timeout = new TwextHubKit('https://example.com/api/v2', {
    fetch: waitingFetch,
    timeoutMs: 5,
  });
  await expect(timeout.instance.meta()).rejects.toThrow(/timed out after 5 ms/);

  const controller = new AbortController();
  const aborted = new TwextHubKit('https://example.com/api/v2', { fetch: waitingFetch });
  const pending = aborted.instance.meta({ signal: controller.signal });
  const rejected = expect(pending).rejects.toThrow(/was aborted/);
  controller.abort();
  await rejected;
});

test('OIDC callback returns a redirect target instead of following it', async function () {
  const server = await startServer(function (request, response) {
    response.statusCode = 302;
    response.setHeader('location', '/signed-in');
    response.end();
  });
  onTestFinished(function () {
    return server.close();
  });

  const th = new TwextHubKit(server.url);
  const result = await th.auth.oidcCallback({ state: 'state-value' });
  expect(result).toEqual({ redirectUrl: '/signed-in' });
  expect(server.requests[0].url).toMatch(/\/auth\/oidc\/callback\?state=state-value$/);
});
