# 📚 TwextHubKit Documentation

This is the developer documentation for TwextHubKit. It explains how to install the package, connect to a TwextHub instance, sign in, work with extensions, and find every available method.

If you are new to the package, start with [Getting started](./getting-started.md). If you know what you need, the [API reference](./api-reference.md) lists every method.

## 📕 Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [🗺️ Documentation map](#️-documentation-map)
- [⚡ The short version](#-the-short-version)
- [🧰 Requirements](#-requirements)
- [💬 Need help?](#-need-help)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## 🗺️ Documentation map

| Page                                                                 | What it covers                                                    |
| -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [Getting started](./getting-started.md)                              | Installation, creating a client, and your first request           |
| [Authentication](./authentication.md)                                | Sign-in, MFA, OIDC, automation tokens, and scopes                 |
| [Browsing and downloads](./guides/browsing-and-downloads.md)         | Users, extensions, search, pages, and Blob downloads              |
| [Publishing](./guides/publishing.md)                                 | Versions, tags, owners, transfers, and webhooks                   |
| [Accounts and organizations](./guides/accounts-and-organizations.md) | Profiles, images, organization owners, notifications, and reports |
| [Errors and requests](./guides/errors-and-requests.md)               | Typed errors, timeouts, cancellation, and retries                 |
| [API reference](./api-reference.md)                                  | Every resource group and method                                   |
| [Development](./development.md)                                      | Running tests, checking types, and adding methods                 |

## ⚡ The short version

```js
import TwextHubKit from '@twextjs/twexthubkit';

const th = new TwextHubKit();
const user = await th.users.get('kamix');

console.log(user.displayName);
```

The default client points at the official instance. Pass an API URL to talk to another instance:

```js
const th = new TwextHubKit('https://twexts.sdisk.us/api/v2');
```

## 🧰 Requirements

- Node.js 24 or newer, or a modern browser with `fetch`.
- No build step, and no runtime dependencies.

TypeScript declarations are included in the package. The full response and payload shapes live in `types/index.d.ts`; the [API reference](./api-reference.md) explains where each one is used.

## 💬 Need help?

Read the guides first, then [open an issue](https://github.com/twextjs/twexthubkit/issues) if something is missing or unclear.

[Back to the project README](../README.md).
