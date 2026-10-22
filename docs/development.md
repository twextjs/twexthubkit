# 🛠️ Development

This page is for working on TwextHubKit itself: running the tests, changing the client, and keeping the declarations and package metadata in sync.

## 📕 Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [🧰 Setup](#-setup)
- [🧪 Commands](#-commands)
- [🗂️ Project layout](#️-project-layout)
- [🔄 How a request flows](#-how-a-request-flows)
- [🧪 What the tests cover](#-what-the-tests-cover)
  - [Node tests](#node-tests)
  - [Browser tests](#browser-tests)
- [➕ Adding or changing an API method](#-adding-or-changing-an-api-method)
- [🏷️ Product metadata](#️-product-metadata)
- [📦 Packaging check](#-packaging-check)
- [🧭 Design choices](#-design-choices)
- [📝 Documentation](#-documentation)
- [💬 Getting help](#-getting-help)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## 🧰 Setup

You need Node.js 24 or newer and npm.

```bash
npm install
npx playwright install chromium
```

The Playwright download is only needed for the browser test project. It installs Chromium once and reuses it on later runs.

## 🧪 Commands

| Command                 | What it does                                      |
| ----------------------- | ------------------------------------------------- |
| `npm test`              | Runs the Node and browser projects                |
| `npm run test:node`     | Runs the Node tests only                          |
| `npm run test:browser`  | Runs the Chromium tests only                      |
| `npm run test:watch`    | Starts Vitest in watch mode                       |
| `npm run lint`          | Checks JavaScript with ESLint                     |
| `npm run format`        | Formats the repository with Prettier              |
| `npm run format:check`  | Verifies formatting without writing changes       |
| `npm run doctoc`        | Regenerates the table of contents in every doc    |
| `npm run typecheck`     | Checks the TypeScript declarations                |
| `npm run product:check` | Verifies the generated metadata is current        |
| `npm run product:sync`  | Regenerates `src/product.js` from `product.yml`   |
| `npm run check`         | Runs metadata, lint, format, types, and all tests |

Run `npm run check` before committing. It is the same sequence CI should use.

## 🗂️ Project layout

```text
src/
  index.js              Package entry point and named exports
  twext-hub-kit.js      Public client and resource wiring
  http-client.js        Request building and dispatch
  http-response.js      Success parsing and HTTP error creation
  http-support.js       URL, body, header, signal, and timeout helpers
  paths.js              Path encoding and query option helpers
  errors.js             TwextHubError and TwextHubNetworkError
  product.js            Generated metadata; do not edit by hand
  resources/            One module per API area
types/
  index.d.ts            Hand-written public TypeScript declarations
test/
  client.test.js        Node transport and client behavior
  resources.test.js     Node resource behavior
  support/server.js     Local HTTP server used by tests
  browser/
    setup.js            Host-side CORS server for browser tests
    client.test.js      Chromium behavior
scripts/
  product.mjs           Metadata generator and checker
```

## 🔄 How a request flows

1. A resource method builds a path and payload.
2. `paths.js` encodes namespace, id, version, and other path values.
3. `HttpClient` joins the path to `baseUrl`, adds headers and the token, and builds the body.
4. The fetch implementation sends the request.
5. `http-response.js` returns JSON, text, a `Blob`, or `undefined`, or builds a typed error.

Resource modules should stay declarative. They describe the path and payload; they should not parse responses or handle errors themselves.

## 🧪 What the tests cover

### Node tests

The Node suite starts a real local HTTP server and points a client at it. It covers:

- Request paths, query strings, and headers.
- JSON, text, Blob, and empty responses.
- Authentication headers and token changes.
- Problem documents and network failures.
- Timeouts and aborts.
- Resource methods across the public surface.

The server is a small Node `http` server, not an Express app. This keeps the tests focused on the SDK's own transport.

### Browser tests

The browser suite runs the same client in Chromium. A global setup starts a CORS-enabled server on the host and passes its URL to the tests. It covers:

- Native browser `fetch`.
- Cross-origin requests and preflight.
- Browser `Blob` handling.
- Problem documents.
- `timeoutMs` with the browser fetch implementation.

Run `npm run test:browser` after `npx playwright install chromium`. Browser coverage currently targets Chromium only.

Supertest is not used. These tests exercise the client against a real HTTP server; Supertest would test the mock server's request handling instead of the SDK's transport.

## ➕ Adding or changing an API method

1. **Add the method to the right resource module.** Use `pathValue()` for path segments and `pickQuery()` for query keys. Do not concatenate unencoded input into a path.
2. **Keep the returned shape raw.** Return what the API returns. Do not wrap it in a custom envelope or rename fields.
3. **Add the declaration.** Update `types/index.d.ts` with the method signature, payload type, and response type. The typecheck does not generate declarations, so this is a manual step.
4. **Add a test.** Put transport-level behavior in the Node suite. Add a browser test when the behavior depends on browser APIs or CORS.
5. **Run `npm run check`.** Fix failures rather than weakening assertions.

If a method needs a new shared option, add it to `RequestOptions` or the relevant query type. If it needs a new response shape, add an interface and use it consistently.

## 🏷️ Product metadata

`product.yml` is the source of the package name, version, tagline, author, homepage, symbols, and default API URL. `src/product.js` is generated from it.

When you change the version:

1. Update `version` in `product.yml`.
2. Update `version` in `package.json` to the same value.
3. Run `npm run product:sync`.
4. Run `npm run product:check`.

The check fails if `package.json`, `product.yml`, and `src/product.js` disagree. Do not edit `src/product.js` by hand.

## 📦 Packaging check

Before a release, inspect what would be published:

```bash
npm pack --dry-run
```

The package includes `src`, `types`, `README.md`, `LICENSE`, and `product.yml`. It has no runtime dependencies. The entry point is ESM and the types are declared through the `exports` map.

## 🧭 Design choices

- **No runtime dependencies.** The client uses standard `fetch`, `Headers`, `Blob`, and `AbortSignal` APIs.
- **Resource groups over one giant client.** Methods live with the thing they operate on, which keeps call sites readable.
- **Raw API shapes.** The SDK does not add a second data model that has to be kept in sync with the server.
- **Typed errors.** HTTP failures keep the problem document; transport failures use status `0`.
- **No automatic retries.** Writes are not safe to repeat blindly. Callers choose when a retry is appropriate.
- **No token persistence.** The client keeps the token in memory; applications decide where to store it.

## 📝 Documentation

The documentation home is [docs/README.md](./README.md). The user-facing overview is the repository [README](../README.md). When a public method changes, update the API reference and any guide that shows the old call.

Every page's table of contents is generated:

```bash
npm run doctoc
```

It rewrites the block between the `START doctoc` and `END doctoc` comments. Don't hand-edit those entries; run the command and commit what it produces. The headings in these files carry emoji, and new pages should follow the same convention.

## 💬 Getting help

Open an issue at [github.com/twextjs/twexthubkit/issues](https://github.com/twextjs/twexthubkit/issues). Include the command you ran, the expected behavior, and the actual error.
