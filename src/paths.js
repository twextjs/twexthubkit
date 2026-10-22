// Small helpers shared by every resource. Path values are encoded here so a
// namespace or version is never interpolated into a URL as-is.

export function pathValue(value, name) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new TypeError(`${name} must be a string or number`);
  }
  const text = String(value);
  if (text.length === 0) {
    throw new TypeError(`${name} must not be empty`);
  }
  return encodeURIComponent(text);
}

export function extensionPath(namespace, id) {
  const owner = pathValue(namespace, 'namespace');
  const extension = pathValue(id, 'extension id');
  return `/@${owner}/${extension}`;
}

export function requestOptions(options) {
  if (!options) return {};
  const result = {};
  if (options.signal !== undefined) result.signal = options.signal;
  if (options.timeoutMs !== undefined) result.timeoutMs = options.timeoutMs;
  return result;
}

export function pickQuery(input, keys) {
  const query = {};
  if (!input) return query;
  for (const key of keys) {
    if (input[key] !== undefined) {
      query[key] = input[key];
    }
  }
  return query;
}
