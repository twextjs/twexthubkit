# 📦 TwextHubKit

> _A friendly JavaScript and TypeScript client for the TwextHub v2 API_

TwextHubKit makes it easy to browse and manage a TwextHub registry from JavaScript or TypeScript. It handles the API requests, tokens, downloads, and errors for you, so you can focus on your project.

## 🌟 Highlights

- Browse users, organizations, extensions, versions, and tags.
- Search the registry and see what is trending.
- Sign in, manage your profile, and publish new versions.
- Read notifications and stay on top of review decisions.
- Works in Node.js 24+ and modern browsers.
- Includes TypeScript types and has no runtime dependencies.

## ℹ️ Overview

[TwextHub](https://github.com/twextjs/twexthub-api) is a registry of custom TurboWarp extensions built with [Twext](https://github.com/twextjs/twext). TwextHubKit is the official client for talking to a TwextHub instance. It does not compile extensions itself; it gives you a clean way to read and change the data a TwextHub instance holds.

By default, the client points at the official instance at `https://twexts.sdisk.us/api/v2`. You can also pass the URL of a self-hosted instance.

### ✍️ Authors

Made and maintained by the [Twext Team](https://github.com/twextjs).

## 🚀 Usage

```js
import TwextHubKit from "@twextjs/twexthubkit";

const th = new TwextHubKit();

const user = await th.users.get("kamix");
console.log(user.displayName);
```

The default instance is used when no URL is given. To use another instance, pass its API URL:

```js
const th = new TwextHubKit("https://twexts.sdisk.us/api/v2");
```

All methods are asynchronous, so use `await` or `.then()`:

```js
const page = await th.extensions.list({ limit: 5 });

for (const extension of page.data) {
  console.log(extension.name, extension.version);
}
```

## ⬇️ Installation

```bash
npm install @twextjs/twexthubkit
```

You need Node.js 24 or newer, or a modern browser with `fetch`. No build step or extra packages are required.

## 🔐 Authentication

Public browsing works without a token. You only need one for actions such as updating a profile, publishing a version, reading notifications, or using admin tools.

Sign in with your personal account:

```js
const session = await th.sessions.create({
  namespace: "your-name",
  password: "your-password",
});

if (session.mfaRequired) {
  // This account needs a passkey or backup code to finish signing in.
} else {
  th.setToken(session.token);
}
```

You can also start with an existing token, such as an automation token for a CI job:

```js
const th = new TwextHubKit({
  token: process.env.TWEXTHUB_TOKEN,
});
```

To sign out or stop using a token, call `th.setToken(null)`. Treat tokens like passwords, and keep them out of source control.

## 🧭 Common tasks

TwextHubKit groups the API by area, so `th.extensions` handles extensions, `th.users` handles accounts, and `th.notifications` handles your inbox.

### Find extensions

```js
const recent = await th.extensions.list({ sort: "recent", limit: 10 });
const matches = await th.extensions.search("terminal");
const popular = await th.extensions.trending();
```

### Look at one extension

```js
const extension = await th.extensions.get("kamix", "xterm");
console.log(extension.description);

const versions = await th.extensions.versions.list("kamix", "xterm");
```

### Update your profile

```js
th.setToken(token);

await th.users.update("your-name", {
  bio: "I build TurboWarp extensions.",
});
```

### Read notifications

```js
const inbox = await th.notifications.list({ unread: true });

console.log(inbox.unreadCount);
```

### Publish a version

Publishing needs a token with permission to publish and a gzipped Twext project tarball:

```js
await th.extensions.versions.publish("your-name", "your-extension", tarball);
```

## 📥 Lists and downloads

List methods return a page of results. `page.data` holds the items, and `page._links.next` points to the next page when there is one.

```js
const page = await th.extensions.list({ limit: 20 });
console.log(page.data);
console.log(page._links.next);
```

Downloads and images come back as `Blob` objects, so you can save them, read them, or create an object URL in the browser.

```js
const blob = await th.extensions.versions.download("kamix", "xterm", "latest");
```

## 🧯 Errors

When the API refuses a request, the client throws a `TwextHubError` with the HTTP status and a readable message. Network problems throw `TwextHubNetworkError`.

```js
import TwextHubKit, { TwextHubError } from "@twextjs/twexthubkit";

const th = new TwextHubKit();

try {
  await th.users.get("nobody");
} catch (error) {
  if (error instanceof TwextHubError) {
    console.error(error.status, error.message);
  } else {
    throw error;
  }
}
```

## 💭 Feedback and Contributing

Found a bug or have an idea? [Open an issue](https://github.com/twextjs/twexthubkit/issues). Contributions are welcome; for larger changes, please open an issue first so we can agree on the approach.

## 📄 License

Apache-2.0. See [LICENSE](./LICENSE).
