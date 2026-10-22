# 🧭 Browsing and downloads

This guide covers the read-only side of TwextHubKit: finding accounts and extensions, walking through pages, and downloading files. Everything here works without a token unless the instance or the resource is private.

## 👤 Accounts and organizations

`users.get()` returns the public account view for a person or an organization:

```js
const account = await th.users.get("kamix");

console.log(account.namespace);
console.log(account.displayName);
console.log(account.kind); // "user" or "organization"
```

Use `orgs.get()` when you need organization details such as owners or organization links:

```js
const org = await th.orgs.get("kamix");
const owners = await th.orgs.listOwners("kamix");
const extensions = await th.orgs.listExtensions("kamix");
```

To list accounts:

```js
const people = await th.users.list({ limit: 20 });
const organizations = await th.orgs.list({ limit: 20 });
```

The signed-in account is available through `th.users.me()`. See [Accounts and organizations](./accounts-and-organizations.md) for profile changes.

## 🧩 Finding extensions

### Recent or filtered

```js
const page = await th.extensions.list({
  sort: "recent",
  limit: 20
});
```

`extensions.list()` accepts:

| Option | Values | Meaning |
| --- | --- | --- |
| `sort` | `recent`, `downloads`, `updated`, `name` | Result order |
| `license` | A license string | Only extensions with that license |
| `namespace` | A namespace | Only extensions owned by that account |
| `limit` | Number | Results per page |
| `cursor` | String | The `cursor` query value from `_links.next` |
| `dir` | `back` | Walk to the previous page |

### Search

```js
const matches = await th.extensions.search("terminal", {
  sort: "downloads",
  limit: 10
});
```

Search accepts the same pagination and sort options. The query is the first argument; options are the second.

### Trending

```js
const popular = await th.extensions.trending({ limit: 10 });
```

Trending is a ranked list, not a general search.

### One extension

```js
const extension = await th.extensions.get("kamix", "xterm");

console.log(extension.name);
console.log(extension.description);
console.log(extension.versions); // version summaries included in the detail view
```

An extension is identified by its owner `namespace` and its `id` (usually the package name). Both are case-sensitive in the same way the API treats them.

### Versions and tags

```js
const versions = await th.extensions.versions.list("kamix", "xterm", {
  limit: 20
});

const version = await th.extensions.versions.get("kamix", "xterm", "1.0.0");
const tags = await th.extensions.tags.get("kamix", "xterm");

console.log(tags.latest);
```

`versions.list()` also accepts `status` and `range` filters. The API decides which statuses you can see; a normal reader usually sees published versions, while an owner or admin may see more.

## 📄 Working with pages

List methods return:

```js
{
  data: [ ... ],
  _links: {
    self: "/api/v2/extensions?limit=20",
    next: "/api/v2/extensions?limit=20&cursor=...",
    prev: null
  }
}
```

The simplest way to walk a list is to follow `next` until it is `null`:

```js
function nextCursor(page) {
  if (!page._links.next) return null;
  return new URL(page._links.next, th.baseUrl).searchParams.get("cursor");
}

let cursor;
const all = [];

do {
  const page = await th.extensions.list({ limit: 50, cursor });
  all.push(...page.data);
  cursor = nextCursor(page);
} while (cursor);
```

`_links.next` is a full next-page URL, not a cursor value. The helper reads its `cursor` query value; the client then sends that value as its own `cursor` parameter.

Do not assume that a page is full just because it has items, and do not build your own cursor from an index. The API may change ordering between requests.

## ⬇️ Downloads

Version downloads return a `Blob`:

```js
const blob = await th.extensions.versions.download("kamix", "xterm", "1.0.0");

const text = await blob.text();
const bytes = new Uint8Array(await blob.arrayBuffer());
```

Use `source()` for the source tarball, when the extension has one and your token can read it:

```js
const source = await th.extensions.versions.source("kamix", "xterm", "1.0.0");
```

Downloads use the same options as other single-resource methods:

```js
const controller = new AbortController();

const blob = await th.extensions.versions.download("kamix", "xterm", "latest", {
  signal: controller.signal,
  timeoutMs: 15000
});
```

The `version` argument can be a concrete version or a tag such as `latest`, depending on what the instance exposes. If you are not sure, read the tags first.

## 🖼️ Images and blobs

Profile and organization images are `Blob` values:

```js
const avatar = await th.users.avatar.get("kamix");
const banner = await th.orgs.banner.get("kamix");

const url = URL.createObjectURL(avatar);
```

In a browser, remember to revoke object URLs when you are done:

```js
URL.revokeObjectURL(url);
```

Blobs referenced by digest are available through `th.blobs.get(digest)`. This is useful when an API response gives you a digest instead of a full URL.

Badge endpoints return an SVG string, not a `Blob`:

```js
const badge = await th.badges.get("kamix", "xterm");
const downloadsBadge = await th.badges.getField("kamix", "xterm", "downloads");
```

The available badge fields are `version`, `downloads`, and `license`.

## 📰 Instance information

```js
const meta = await th.instance.meta();
const stats = await th.instance.stats();
const terms = await th.instance.terms();
const privacy = await th.instance.privacy();
const feed = await th.instance.atomFeed();
```

`meta()` is a good way to check which instance you are talking to. `stats()` returns published, pending, author, and download counts. `atomFeed()` returns the Atom XML as a string.

## 🧯 When something is missing

A missing extension or account usually produces a `404`. A private or restricted resource may produce `403` instead; do not assume every inaccessible resource is absent. The client throws a typed error for both, so check `error.status` if your UI needs different messages.

## ➡️ Next steps

- [Publish an extension](./publishing.md)
- [Accounts and organizations](./accounts-and-organizations.md)
- [Errors and requests](./errors-and-requests.md)
- [Full API reference](../api-reference.md#extensions)
