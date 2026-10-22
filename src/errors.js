// Error types shared by the transport. HTTP failures carry the API's RFC 7807
// problem document; transport failures keep the status at 0 so callers can
// tell "the server said no" from "the request never reached the server".

export class TwextHubError extends Error {
  constructor(message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = 'TwextHubError';
    this.status = options.status ?? 0;
    this.problem = options.problem;
    this.method = options.method;
    this.url = options.url;
    this.headers = options.headers;
    this.retryAfter = options.retryAfter;
    this.body = options.body;
  }
}

export class TwextHubNetworkError extends TwextHubError {
  constructor(message, options = {}) {
    super(message, options);
    this.name = 'TwextHubNetworkError';
  }
}
