# TwextHubKit

A small, dependency-free JavaScript client for the [TwextHub](https://github.com/twextjs/twexthub-api) v2 API. It runs in Node.js 24+ and in browsers with the standard `fetch`, `Blob`, and `AbortSignal` APIs.

The package speaks the live `/api/v2` surface. Every documented endpoint is available through a resource group; there are no top-level convenience aliases.

## Install

```bash
npm install @twextjs/twexthubkit
```

## Quick start

```js
import TwextHubKit from "@twextjs/twexthubkit";

const th = new TwextHubKit("https://twexts.sdisk.us/api/v2");

const user = await th.users.get("kamix");
console.log(user);
```

`users.get()` is asynchronous, so it returns a Promise. Without `await`, `console.log(th.users.get("kamix"))` only prints the pending Promise. There is intentionally no top-level `getUser()`; use the `users` group.

The base URL is optional and defaults to the same public instance:

```js
const th = new TwextHubKit();
```

You can also pass the options object first:

```js
const th = new TwextHubKit({ token: process.env.TWEXTHUB_TOKEN });
```

## Authentication

Pass a bearer token to the constructor or set it later:

```js
const th = new TwextHubKit("https://twexts.sdisk.us/api/v2", { token: token });
th.setToken(anotherToken);
th.setToken(null); // clear it
```

The token is never stored outside the client. Signing in returns the token, but the client does not install it automatically:

```js
const result = await th.sessions.create({
  namespace: "kamix",
  password: "correct horse battery staple",
});

if (result.mfaRequired) {
  // Finish the second factor with auth.getSigninOptions() and auth.verifyMfa().
} else {
  th.setToken(result.token);
}
```

Automation tokens work the same way. Create one with the scopes it needs, then pass its `token` to `setToken()`.

## Resource groups

| Group | What it covers |
| --- | --- |
| `th.auth` | Sign-in descriptor, OIDC, MFA, passkeys, backup codes |
| `th.sessions` | Password sign-in and session management |
| `th.tokens` | Automation tokens |
| `th.users` | Accounts, `/me`, account webhooks, avatars and banners |
| `th.orgs` | Organizations, owners, their extensions, webhooks, images |
| `th.notifications` | The caller's notification inbox |
| `th.reports` | Reports filed by the caller |
| `th.extensions` | Catalog, search, trending, versions, tags, owners, transfers, webhooks |
| `th.badges` | SVG badges |
| `th.instance` | Meta, stats, terms, privacy, Atom feed |
| `th.blobs` | Content-addressed blobs |
| `th.admin` | Admin-only operations |

### Auth

```js
await th.auth.describe();
await th.auth.getOidcAuthorizeUrl({ returnTo: "/settings" });
await th.auth.exchangeOidcCode({ code });
await th.auth.linkOidc({ returnTo: "/settings" });
await th.auth.listOidcIdentities();
await th.auth.deleteOidcIdentity(id);

await th.auth.getMfaState();
await th.auth.createPasskeyOptions();
await th.auth.registerPasskey({ response, label: "Laptop" });
await th.auth.renamePasskey(id, { label: "Work laptop" });
await th.auth.deletePasskey(id);
await th.auth.regenerateBackupCodes();
await th.auth.getSigninOptions({ mfaToken });
await th.auth.verifyMfa({ mfaToken, response });
await th.auth.verifyMfa({ mfaToken, backupCode });
await th.auth.getReauthOptions();
await th.auth.reauth({ response });
```

`auth.oidcCallback()` exists for non-browser clients. In a browser, navigate the window to the callback URL instead; the browser follows the redirect and the client cannot read the resulting page.

For passkeys, pass the serialized JSON form of the `PublicKeyCredential` as `response`. A browser credential object is not JSON-serializable by itself.

### Sessions and tokens

```js
await th.sessions.create({ namespace, password });
await th.sessions.list({ namespace, limit: 20 });
await th.sessions.revokeCurrent();
await th.sessions.delete(id);

await th.tokens.list({ limit: 20 });
await th.tokens.create({ name: "CI publish", scopes: ["publish", "yank"] });
await th.tokens.update(id, { name: "Release token" });
await th.tokens.delete(id);
await th.tokens.revokeCurrent();
```

`tokens.create()` returns the secret once as `token`. Keep it; later reads do not include it.

### Users

```js
await th.users.create({ namespace, password, displayName });
await th.users.list({ limit: 20 });
await th.users.get("kamix");
await th.users.me();
await th.users.update("kamix", { bio: "New bio" });
await th.users.delete("kamix");

await th.users.avatar.get("kamix"); // optional { v: "<digest prefix>" } for cacheable image URLs
await th.users.avatar.upload("kamix", imageBlob);
await th.users.avatar.delete("kamix");
await th.users.banner.get("kamix");
await th.users.banner.upload("kamix", imageBlob);
await th.users.banner.delete("kamix");

await th.users.webhooks.list("kamix");
await th.users.webhooks.create("kamix", { url, events: ["version.published"] });
await th.users.webhooks.delete("kamix", webhookId);
await th.users.webhooks.listDeliveries("kamix", webhookId);
await th.users.webhooks.redeliver("kamix", webhookId, deliveryId);
```

### Organizations

```js
await th.orgs.create({ namespace, displayName });
await th.orgs.list();
await th.orgs.get(namespace);
await th.orgs.update(namespace, { bio: "New bio" });
await th.orgs.delete(namespace);

await th.orgs.listOwners(namespace);
await th.orgs.addOwner(namespace, ownerNamespace);
await th.orgs.removeOwner(namespace, ownerNamespace);
await th.orgs.listExtensions(namespace, { sort: "downloads" });

await th.orgs.avatar.upload(namespace, imageBlob);
await th.orgs.banner.upload(namespace, imageBlob);
await th.orgs.webhooks.create(namespace, { url, events: ["version.published"] });
```

### Notifications and reports

```js
const inbox = await th.notifications.list({ unread: true });
await th.notifications.markRead({ ids: [inbox.data[0].id] });
await th.notifications.markRead({ all: true });
await th.notifications.markOneRead(id);

await th.reports.create({
  targetType: "extension",
  targetNamespace: "kamix",
  targetExtensionId: "xterm",
  reason: "spam",
  description: "What happened.",
});
await th.reports.list();
await th.reports.get(id);
```

### Extensions

```js
const page = await th.extensions.list({ sort: "recent", limit: 20 });
await th.extensions.search("terminal", { sort: "downloads" });
await th.extensions.trending({ limit: 10 });
await th.extensions.get("kamix", "xterm");
await th.extensions.delete("kamix", "xterm");

await th.extensions.versions.list("kamix", "xterm", { range: "^0.1" });
await th.extensions.versions.get("kamix", "xterm", "0.1.2");
await th.extensions.versions.publish("kamix", "xterm", gzippedTarball);
await th.extensions.versions.review("kamix", "xterm", "1.0.0", {
  status: "approved",
});
await th.extensions.versions.review("kamix", "xterm", "1.0.0", {
  deprecationMessage: "Use 2.0.0 instead.",
});
await th.extensions.versions.delete("kamix", "xterm", "1.0.0");

const source = await th.extensions.versions.source("kamix", "xterm", "0.1.2");
const compiled = await th.extensions.versions.download("kamix", "xterm", "0.1.2");

await th.extensions.tags.get("kamix", "xterm");
await th.extensions.tags.set("kamix", "xterm", "next", "1.0.0");
await th.extensions.tags.delete("kamix", "xterm", "next");

await th.extensions.owners.list("kamix", "xterm");
await th.extensions.owners.listInvites("kamix", "xterm");
await th.extensions.owners.invite("kamix", "xterm", ownerNamespace);
await th.extensions.owners.accept("kamix", "xterm", ownerNamespace);
await th.extensions.owners.remove("kamix", "xterm", ownerNamespace);

await th.extensions.transfers.list("kamix", "xterm");
await th.extensions.transfers.offer("kamix", "xterm", toNamespace);
await th.extensions.transfers.withdraw("kamix", "xterm", toNamespace);
await th.extensions.transfers.accept("kamix", "xterm", toNamespace);

await th.extensions.webhooks.list("kamix", "xterm");
await th.extensions.webhooks.create("kamix", "xterm", { url, events: ["version.published"] });
```

`versions.publish()` takes the gzipped project tarball directly, with no multipart wrapper. The default content type is `application/gzip`; pass `{ contentType: "application/octet-stream" }` if needed.

### Badges, instance, and blobs

```js
await th.badges.get("kamix", "xterm");
await th.badges.getField("kamix", "xterm", "downloads", { label: "downloads" });

await th.instance.meta();
await th.instance.stats();
await th.instance.terms();
await th.instance.privacy();
await th.instance.atomFeed();

await th.blobs.get(digest);
```

Badges and the Atom feed return text. Downloads, source archives, images, and blobs return `Blob`.

### Admin

```js
await th.admin.updateTerms({ body: markdown });
await th.admin.updatePrivacy({ body: markdown });
await th.admin.listAudit({ limit: 50 });
await th.admin.getQuota(namespace);
await th.admin.setQuota(namespace, { maxBlobBytes: 10485760 });
await th.admin.getMetrics();
await th.admin.getConfig();
await th.admin.updateConfig({ settings: { "pagination.maxLimit": 100 } });
await th.admin.broadcastNotification({ message: "Maintenance at 20:00 UTC." });
await th.admin.listReports({ status: "open" });
await th.admin.getReport(id);
await th.admin.decideReport(id, { status: "resolved", note: "Handled." });
await th.admin.listPendingVersions();
```

Admin methods need both an admin account and a credential with the `admin` scope. The client does not try to hide methods that the current token cannot use.

## Pagination

List endpoints return the API's page shape unchanged:

```js
const first = await th.extensions.list({ limit: 20 });
console.log(first.data);
console.log(first._links.next); // null at the end, otherwise a path with the next cursor
```

Follow `_links.next` with `new URL(first._links.next, th.baseUrl)` or read its `cursor` query parameter and pass it back as `{ cursor }`. Cursors are sort-specific, so keep the same filters and sort when paging.

The API also returns collections without pages for owners and webhooks; those are `{ data: [...] }`.

## Errors, cancellation, and timeouts

HTTP failures throw `TwextHubError`. Its `status`, `problem` (the API's RFC 7807 body), `headers`, and `retryAfter` are available. Transport failures throw `TwextHubNetworkError`, which has `status: 0`.

```js
import { TwextHubError, TwextHubNetworkError } from "@twextjs/twexthubkit";

try {
  await th.users.get("nobody");
} catch (error) {
  if (error instanceof TwextHubError) {
    console.error(error.status, error.problem?.detail);
  } else if (error instanceof TwextHubNetworkError) {
    console.error("Could not reach the API:", error.message);
  } else {
    throw error;
  }
}
```

Every method accepts a final options argument with `signal` and `timeoutMs`:

```js
const controller = new AbortController();
const promise = th.users.get("kamix", { signal: controller.signal });
controller.abort();
```

Query-taking methods accept those options inside the query object instead:

```js
await th.extensions.list({ limit: 20, signal: controller.signal, timeoutMs: 5000 });
```

`timeoutMs` can also be set once in the constructor. There are no automatic retries; retry only idempotent requests, and honor `retryAfter` when it is present.

## Binary data

`BinaryData` is `Blob | ArrayBuffer | Uint8Array`, so Node `Buffer` works. Image uploads infer the content type from a `Blob`'s `type`; pass `contentType` for an `ArrayBuffer` or `Uint8Array`.

```js
const blob = await th.extensions.versions.download("kamix", "xterm", "0.1.2");
const text = await blob.text();
```

## Development

The package is ESM and has no runtime dependencies.

```bash
npm install
npm test              # node:test against a local mock HTTP server
npm run typecheck     # checks types/index.d.ts with a consumer file
npm run product:check # product.yml, package.json, and src/product.js agree
npm run check         # all of the above
```

`product.yml` holds the product name, version, tagline, homepage, and default API base URL. `src/product.js` is generated from it, and the version is checked against `package.json`; after changing either file, run:

```bash
npm run product:sync
```

The API surface follows the v2 OpenAPI document in `twexthub-api` on its `devel` branch. The live instance currently reports server version 3.0.0 at `/api/v2`.

## License

Apache-2.0
