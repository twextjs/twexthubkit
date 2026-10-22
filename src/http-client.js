// The one place requests are built and dispatched. Resource modules stay
// declarative: they describe paths, payloads, and the response shape.

import { TwextHubNetworkError } from './errors.js';
import { buildHttpError, readResponse } from './http-response.js';
import {
  appendQuery,
  buildBody,
  combineSignals,
  networkErrorMessage,
  normalizeBaseUrl,
  normalizeTimeout,
  normalizeToken,
} from './http-support.js';

const ACCEPT_BY_TYPE = {
  json: 'application/json',
  text: '*/*',
  blob: '*/*',
  none: '*/*',
  raw: '*/*',
};

export class HttpClient {
  constructor(baseUrl, options = {}) {
    this.baseUrl = normalizeBaseUrl(baseUrl);
    this.token = normalizeToken(options.token);
    this.defaultHeaders = options.headers ?? {};
    this.timeoutMs = normalizeTimeout(options.timeoutMs);

    if (typeof options.fetch === 'function') {
      this.fetch = options.fetch;
    } else if (typeof globalThis.fetch === 'function') {
      this.fetch = globalThis.fetch.bind(globalThis);
    } else {
      throw new TypeError('TwextHubKit needs a global fetch or a fetch option');
    }
  }

  setToken(token) {
    this.token = normalizeToken(token);
  }

  async request(path, options = {}) {
    const context = {
      ...options,
      method: options.method ?? 'GET',
      url: this.buildUrl(path, options.query),
    };
    const response = await this.send(path, context);
    try {
      return await readResponse(response, context);
    } catch (error) {
      if (error?.name === 'AbortError' || error?.name === 'TimeoutError') {
        const timeoutMs =
          options.timeoutMs === undefined ? this.timeoutMs : normalizeTimeout(options.timeoutMs);
        const message = networkErrorMessage(error, context.url, timeoutMs);
        throw new TwextHubNetworkError(message, {
          method: context.method,
          url: context.url,
          cause: error,
        });
      }
      throw error;
    }
  }

  async raw(path, options = {}) {
    return this.send(path, options);
  }

  async send(path, options = {}) {
    const method = options.method ?? 'GET';
    const url = this.buildUrl(path, options.query);
    const headers = this.buildHeaders(options);
    const body = buildBody(options);
    const timeoutMs =
      options.timeoutMs === undefined ? this.timeoutMs : normalizeTimeout(options.timeoutMs);
    const signal = combineSignals(options.signal, timeoutMs);

    let response;
    try {
      response = await this.fetch(url, {
        method,
        headers,
        body,
        signal,
        redirect: options.redirect,
      });
    } catch (error) {
      const message = networkErrorMessage(error, url, timeoutMs);
      throw new TwextHubNetworkError(message, { method, url, cause: error });
    }

    if (response.status >= 400) {
      throw await buildHttpError(response, method, url);
    }
    return response;
  }

  buildUrl(path, query) {
    const suffix = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${suffix}`);
    if (query) {
      appendQuery(url.searchParams, query);
    }
    return url.toString();
  }

  buildHeaders(options) {
    const responseType = options.responseType ?? 'json';
    const headers = new Headers(this.defaultHeaders);

    if (!headers.has('accept')) {
      headers.set('accept', ACCEPT_BY_TYPE[responseType] ?? '*/*');
    }
    if (this.token && !headers.has('authorization')) {
      headers.set('authorization', `Bearer ${this.token}`);
    }
    if (options.headers) {
      for (const [name, value] of Object.entries(options.headers)) {
        headers.set(name, value);
      }
    }
    if (options.json !== undefined && !headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    if (options.contentType && !headers.has('content-type')) {
      headers.set('content-type', options.contentType);
    }
    return headers;
  }
}
