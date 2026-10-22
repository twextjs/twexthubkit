// Browser-mode tests cannot start a Node HTTP server themselves, so this
// global setup runs one on the host and passes its URL to the browser tests.
// The server allows cross-origin requests because the Vitest page and the API
// listen on different origins.

import { sendJson, startServer } from '../support/server.js';

let server;

export async function setup(project) {
  server = await startServer(handleRequest, { cors: true });
  project.provide('apiBaseUrl', server.url);
}

export async function teardown() {
  if (server) {
    await server.close();
    server = undefined;
  }
}

function handleRequest(request, response) {
  const url = new URL(request.url, 'http://localhost');

  if (url.pathname === '/api/v2/users/kamix') {
    sendJson(response, 200, {
      namespace: 'kamix',
      displayName: 'Kamix',
      echo: {
        authorization: request.headers.authorization,
        accept: request.headers.accept,
        url: request.url
      }
    });
    return;
  }

  if (url.pathname === '/api/v2/users/slow') {
    setTimeout(function () {
      if (!response.writableEnded) {
        sendJson(response, 200, { namespace: 'slow', displayName: 'Slow' });
      }
    }, 200);
    return;
  }

  if (url.pathname === '/api/v2/users/missing') {
    sendJson(
      response,
      404,
      {
        type: 'about:blank',
        title: 'Not Found',
        status: 404,
        detail: 'No account named missing.'
      },
      { 'content-type': 'application/problem+json' }
    );
    return;
  }

  if (url.pathname === '/api/v2/sessions' && request.method === 'POST') {
    sendJson(response, 201, {
      token: 'browser-token',
      echo: {
        authorization: request.headers.authorization,
        contentType: request.headers['content-type'],
        body: JSON.parse(request.body.toString())
      }
    });
    return;
  }

  if (url.pathname === '/api/v2/@kamix/xterm/versions/1.0.0/download') {
    response.statusCode = 200;
    response.setHeader('content-type', 'application/javascript');
    response.end(Buffer.from([0, 1, 2, 255]));
    return;
  }

  if (url.pathname === '/api/v2/extensions') {
    sendJson(response, 200, {
      data: [],
      _links: { self: '/api/v2/extensions', next: null, prev: null }
    });
    return;
  }

  sendJson(response, 404, {
    type: 'about:blank',
    title: 'Not Found',
    status: 404,
    detail: 'Not found.'
  });
}
