# 🚀 Getting started

This page takes you from installing TwextHubKit to making your first useful requests. It assumes you are comfortable with JavaScript, promises, and `async`/`await`.

## 📕 Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [📦 Install](#-install)
- [🧱 Create a client](#-create-a-client)
- [👋 Your first request](#-your-first-request)
- [🗂️ How methods are organized](#️-how-methods-are-organized)
- [📄 Lists and pages](#-lists-and-pages)
- [⬇️ Downloads](#️-downloads)
- [🛠️ Query objects and request options](#️-query-objects-and-request-options)
- [🧾 TypeScript](#-typescript)
- [🚧 Common mistakes](#-common-mistakes)
- [➡️ Next steps](#️-next-steps)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## 📦 Install

```sh
npm install @twextjs/twexthubkit
```

The package is ESM-only and has no runtime dependencies. Node.js 24 or newer is required on the server; browsers need a modern `fetch`, `Blob`, and `AbortSignal` implementation.

## 🧱 Create a client

The default client talks to the official TwextHub instance:

```js
import TwextHubKit from '@twextjs/twexthubkit';

const th = new TwextHubKit();
```

To use another instance, pass its API base URL. It must include `/api/v2`:

```js
const th = new TwextHubKit('https://twexts.sdisk.us/api/v2');
```

You can also pass options instead of a URL:

```js
const th = new TwextHubKit({
  token: process.env.TWEXTHUB_TOKEN,
  timeoutMs: 10000,
});
```

The main options are:

| Option      | What it does                        |
| ----------- | ----------------------------------- |
| `baseUrl`   | API root, including `/api/v2`       |
| `token`     | Bearer token for signed-in requests |
| `headers`   | Headers added to every request      |
| `fetch`     | Custom `fetch` implementation       |
| `signal`    | Default `AbortSignal` for requests  |
| `timeoutMs` | Default timeout in milliseconds     |

Passing a string as the first argument is shorthand for `{ baseUrl: string }`.

## 👋 Your first request

```js
const user = await th.users.get('kamix');
console.log(user.displayName);
```

The SDK returns the API response as plain data. It does not wrap responses in its own envelope, so fields such as `namespace`, `displayName`, and `kind` are exactly what the API sent.

Most methods are asynchronous. If you forget `await`, you will get a promise instead of the value you expected.

## 🗂️ How methods are organized

Methods are grouped by the thing they work with, not by URL:

```js
await th.users.get('kamix'); // one account or organization
await th.orgs.get('kamix'); // organization details
await th.extensions.get('kamix', 'xterm'); // one extension
await th.extensions.versions.list('kamix', 'xterm'); // its versions
```

There is no top-level `getUser()` helper. Resource groups keep related methods together and make the call site easier to read.

The main groups are:

- `auth` — sign-in options, OIDC, MFA, passkeys, and reauthentication
- `sessions` — active sessions
- `tokens` — automation tokens
- `users` — accounts, avatars, banners, and account webhooks
- `orgs` — organizations, owners, images, and organization webhooks
- `notifications` — the signed-in account's notifications
- `reports` — abuse and content reports
- `extensions` — extensions, versions, tags, owners, transfers, and webhooks
- `badges` — badge images and metadata
- `instance` — instance metadata, legal documents, stats, and the Atom feed
- `blobs` — blobs by key
- `admin` — instance administration

## 📄 Lists and pages

List methods return a page object with `data` and `_links`:

```js
const page = await th.extensions.list({ limit: 20 });

for (const extension of page.data) {
  console.log(extension.displayName);
}

if (page._links.next) {
  const nextUrl = new URL(page._links.next, th.baseUrl);
  const cursor = nextUrl.searchParams.get('cursor');
  const nextPage = await th.extensions.list({ cursor });
}
```

`_links.next` is a full next-page URL, not a cursor value. Read its `cursor` query value before passing it back to the client.

## ⬇️ Downloads

Downloads return a standard `Blob`:

```js
const source = await th.extensions.versions.download('kamix', 'xterm', '1.0.0');
const text = await source.text();
```

Image methods such as `th.users.avatar.get()` and `th.extensions.versions.source()` also return `Blob` values.

## 🛠️ Query objects and request options

Methods that list or search take a query object:

```js
const page = await th.extensions.search('terminal', {
  limit: 10,
  sort: 'downloads',
  timeoutMs: 5000,
});
```

Methods that act on one resource take an optional final options object:

```js
const extension = await th.extensions.get('kamix', 'xterm', {
  timeoutMs: 5000,
});
```

Both forms accept `signal` and `timeoutMs`. Query methods also accept their filters in the same object. If you are unsure where an option belongs, check the method's signature in the [API reference](./api-reference.md).

## 🧾 TypeScript

Types are included, so you can import response and payload types directly:

```ts
import TwextHubKit from '@twextjs/twexthubkit';
import type { ExtensionDetail, PageQuery } from '@twextjs/twexthubkit';

const th = new TwextHubKit();
const query: PageQuery = { limit: 20 };
const extension: ExtensionDetail = await th.extensions.get('kamix', 'xterm');
```

The declarations are hand-written and cover every public method. See `types/index.d.ts` for the full shapes.

## 🚧 Common mistakes

- **Missing `/api/v2`** — the base URL must point at the API root, not the website.
- **Missing `await`** — most methods return a promise.
- **Using `users.get()` for an organization's settings** — it returns the public account view for either kind. Use `orgs.get()` for organization details.
- **Passing request options as a separate argument to a list method** — put them in the query object.
- **Keeping a token in source code** — load it from an environment variable or secret store.

## ➡️ Next steps

- [Sign in and manage tokens](./authentication.md)
- [Browse extensions and download files](./guides/browsing-and-downloads.md)
- [Publish an extension](./guides/publishing.md)
