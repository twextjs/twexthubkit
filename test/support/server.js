// A tiny recording HTTP server. Each test supplies the handler; the helper
// captures the request method, URL, headers, and raw body for assertions.

import http from 'node:http';

export async function startServer(handler, options = {}) {
  const requests = [];
  const server = http.createServer(async function (request, response) {
    if (options.cors) {
      response.setHeader('access-control-allow-origin', '*');
      response.setHeader('access-control-allow-methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      response.setHeader('access-control-allow-headers', 'authorization, content-type, accept');
      if (request.method === 'OPTIONS') {
        response.statusCode = 204;
        response.end();
        return;
      }
    }

    const chunks = [];
    for await (const chunk of request) {
      chunks.push(chunk);
    }
    const record = {
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: Buffer.concat(chunks),
    };
    requests.push(record);

    try {
      await handler(record, response);
    } catch (error) {
      if (!response.headersSent) {
        response.statusCode = 500;
        response.setHeader('content-type', 'text/plain');
      }
      response.end(String(error));
    }
  });

  await new Promise(function (resolve) {
    server.listen(options.port ?? 0, '127.0.0.1', resolve);
  });
  const address = server.address();

  return {
    url: `http://127.0.0.1:${address.port}/api/v2`,
    requests,
    close: function () {
      return new Promise(function (resolve, reject) {
        server.close(function (error) {
          if (error) reject(error);
          else resolve();
        });
      });
    },
  };
}

export function sendJson(response, status, body, headers = {}) {
  response.statusCode = status;
  response.setHeader('content-type', 'application/json');
  for (const [name, value] of Object.entries(headers)) {
    response.setHeader(name, value);
  }
  response.end(JSON.stringify(body));
}
