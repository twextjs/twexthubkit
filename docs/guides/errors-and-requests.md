# 🧯 Errors and requests

TwextHubKit keeps request behavior predictable: one transport, two error types, and the same options everywhere. This guide explains how requests are configured and how to handle failures without guessing.

## 🧱 How a request is built

Every method eventually calls the same client, which:

1. Joins the base URL and the resource path.
2. Adds the bearer token, if one is set.
3. Encodes the query string.
4. Sends JSON or raw bytes.
5. Reads JSON, text, a `Blob`, or no body, depending on the endpoint.

The base URL must use `http` or `https` and must not contain a query string or fragment. Trailing slashes are removed, so both of these work:

```js
new TwextHubKit("https://example.com/api/v2");
new TwextHubKit("https://example.com/api/v2/");
```

## ⚙️ Where options go

There are two shapes to remember.

### Lists and searches take one query object

```js
const page = await th.extensions.search("terminal", {
  sort: "downloads",
  limit: 20,
  signal: controller.signal,
  timeoutMs: 5000
});
```

Filters, pagination, `signal`, and `timeoutMs` all live in that object.

### Single-resource and write methods take a final options object

```js
const extension = await th.extensions.get("kamix", "xterm", {
  signal: controller.signal,
  timeoutMs: 5000
});
```

```js
await th.extensions.versions.publish("your-name", "xterm", tarball, {
  timeoutMs: 30000
});
```

If a method has a query object and a request options object, the query comes first and the options come last. The [API reference](../api-reference.md) shows each signature.

## ⏱️ Timeouts

Set a default timeout on the client:

```js
const th = new TwextHubKit({
  timeoutMs: 10000
});
```

Override it per request:

```js
await th.users.me({ timeoutMs: 2000 });
```

`timeoutMs` is in milliseconds. `0`, `null`, and `undefined` mean no timeout. A negative or non-numeric value throws a `TypeError` when the client is created or the request starts.

A timeout becomes a `TwextHubNetworkError`:

```js
import { TwextHubNetworkError } from "@twextjs/twexthubkit";

try {
  await th.users.me({ timeoutMs: 10 });
} catch (error) {
  if (error instanceof TwextHubNetworkError) {
    console.log(error.message); // includes "timed out after 10 ms"
  }
}
```

## 🛑 Cancellation

Use an `AbortController` to cancel one request or a group of requests:

```js
const controller = new AbortController();

const request = th.extensions.list({
  limit: 50,
  signal: controller.signal
});

controller.abort();

try {
  await request;
} catch (error) {
  if (error instanceof TwextHubNetworkError) {
    console.log(error.message); // "was aborted"
  }
}
```

You can also give the client a default signal:

```js
const th = new TwextHubKit({ signal: controller.signal });
```

A per-request signal is combined with the client default and the timeout. If any of them aborts, the request stops.

## 🚨 Two error types

### `TwextHubError`

The server returned an HTTP error. The status is real (for example `404` or `403`), and `problem` may hold the API's RFC 7807 problem document.

```js
import { TwextHubError } from "@twextjs/twexthubkit";

try {
  await th.users.get("nobody");
} catch (error) {
  if (error instanceof TwextHubError) {
    console.error(error.status);
    console.error(error.message);
    console.error(error.problem?.detail);
  } else {
    throw error;
  }
}
```

Useful fields:

| Field | Meaning |
| --- | --- |
| `status` | HTTP status, or `0` for transport failures |
| `message` | Readable message built from `detail`, `title`, or the status |
| `problem` | Parsed problem document, when the body was JSON |
| `problem.errors` | Field-level validation errors, when present |
| `problem.buildLog` | Build output from a failed publish, when present |
| `method` | HTTP method |
| `url` | Full request URL |
| `headers` | Response `Headers` |
| `retryAfter` | Parsed `Retry-After` in seconds, when present |
| `body` | Raw response body |

### `TwextHubNetworkError`

The request never produced an HTTP response. This covers DNS failures, connection errors, timeouts, and aborts. Its `status` is `0`, which makes it easy to tell apart from a server refusal.

```js
import { TwextHubNetworkError } from "@twextjs/twexthubkit";

try {
  await th.instance.meta();
} catch (error) {
  if (error instanceof TwextHubNetworkError) {
    console.error("Could not reach the instance:", error.message);
  }
}
```

`TwextHubNetworkError` extends `TwextHubError`, so a single `instanceof TwextHubError` check catches both. Check the network subclass first if you need different behavior.

## 🔁 Retries

The client does not retry automatically. That is deliberate: publishing a version or sending a broadcast is not safe to repeat blindly.

When you do retry, keep it to requests that are safe to repeat:

```js
async function getWithRetry(path, attempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await path();
    } catch (error) {
      lastError = error;

      const retryable =
        error instanceof TwextHubNetworkError ||
        error.status === 429 ||
        error.status === 503;

      if (!retryable || attempt === attempts) {
        throw error;
      }

      const delayMs = error.retryAfter
        ? error.retryAfter * 1000
        : 250 * 2 ** (attempt - 1);

      await new Promise(function (resolve) {
        setTimeout(resolve, delayMs);
      });
    }
  }

  throw lastError;
}
```

Use it for reads:

```js
const meta = await getWithRetry(function () {
  return th.instance.meta();
});
```

Do not use it for `publish`, `delete`, `create`, or other writes unless the operation is safe to repeat. A request that timed out may still have reached the server.

## 🚦 Common statuses

| Status | What it usually means |
| --- | --- |
| `400` | Bad request or invalid payload |
| `401` | Missing or invalid token |
| `403` | Valid token, but not allowed; also used for unaccepted terms |
| `404` | Resource not found, or not visible to you |
| `409` | Conflict, such as a duplicate namespace or owner |
| `413` | Upload too large |
| `422` | Validation failed; check `problem.errors` |
| `429` | Rate limited; check `retryAfter` |
| `500` | Server error |
| `503` | Temporarily unavailable; retrying later may help |

A `403` can mean two different things: the account lacks permission, or the account has not accepted the current terms. Check `problem.detail` or compare `user.termsAcceptedVersion` with `instance.terms().version`.

## 📦 Response bodies

Most methods return parsed JSON. Some intentionally return something else:

- `versions.download()` and `versions.source()` return a `Blob`.
- `users.avatar.get()`, `orgs.avatar.get()`, and the banner equivalents return a `Blob`.
- `blobs.get()` returns a `Blob`.
- `badges.get()` and `badges.getField()` return an SVG string.
- `instance.atomFeed()` returns an XML string.
- `admin.getMetrics()` returns a string.
- Methods that delete or revoke return `undefined`.

An empty successful body also becomes `undefined`. Do not assume every successful call has a JSON object.

## 🧾 A note on headers

The client sets `accept` and `content-type` based on the request. It also sets `authorization` when a token is present. If you need a default header for every request, pass it at construction:

```js
const th = new TwextHubKit({
  headers: {
    "x-client": "my-app"
  }
});
```

Do not put secrets in custom headers that your app logs. The SDK does not log request headers.

## ➡️ Next steps

- [Authentication](../authentication.md)
- [Browsing and downloads](./browsing-and-downloads.md)
- [Full API reference](../api-reference.md#options-and-common-types)
