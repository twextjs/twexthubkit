// Small transport utilities. Keeping them out of the client makes the request
// path easier to read and lets each helper be tested through the client.

export function buildBody(options) {
  if (options.json !== undefined) {
    return JSON.stringify(options.json);
  }
  return options.body;
}

export function appendQuery(searchParams, query) {
  for (const [name, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) {
          searchParams.append(name, String(item));
        }
      }
    } else {
      searchParams.append(name, String(value));
    }
  }
}

export function combineSignals(signal, timeoutMs) {
  const timeoutSignal = timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined;
  if (!signal) return timeoutSignal;
  if (!timeoutSignal) return signal;
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([signal, timeoutSignal]);
  }

  const controller = new AbortController();
  function abort(reason) {
    if (!controller.signal.aborted) {
      controller.abort(reason);
    }
  }
  if (signal.aborted) {
    abort(signal.reason);
  } else {
    signal.addEventListener(
      'abort',
      function () {
        abort(signal.reason);
      },
      { once: true },
    );
  }
  if (timeoutSignal.aborted) {
    abort(timeoutSignal.reason);
  } else {
    timeoutSignal.addEventListener(
      'abort',
      function () {
        abort(timeoutSignal.reason);
      },
      { once: true },
    );
  }
  return controller.signal;
}

export function networkErrorMessage(error, url, timeoutMs) {
  if (error && error.name === 'TimeoutError') {
    if (timeoutMs) {
      return `Request to ${url} timed out after ${timeoutMs} ms`;
    }
    return `Request to ${url} timed out`;
  }
  if (error && error.name === 'AbortError') {
    return `Request to ${url} was aborted`;
  }
  const detail = error instanceof Error ? error.message : String(error);
  return `Unable to reach ${url}: ${detail}`;
}

export function normalizeBaseUrl(value) {
  const text = value instanceof URL ? value.toString() : String(value ?? '');
  if (text.trim() === '') {
    throw new TypeError('TwextHubKit needs an API base URL');
  }
  const url = new URL(text);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new TypeError('The API base URL must use http or https');
  }
  if (url.search || url.hash) {
    throw new TypeError('The API base URL must not contain a query or fragment');
  }
  return url.toString().replace(/\/+$/, '');
}

export function normalizeToken(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw new TypeError('The API token must be a string');
  }
  return value;
}

export function normalizeTimeout(value) {
  if (value === undefined || value === null || value === 0) return undefined;
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError('timeoutMs must be a positive number');
  }
  return value;
}
