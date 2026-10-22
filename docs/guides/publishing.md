# 🚀 Publishing

This guide covers the write side of an extension: uploading a version, moving tags, adding co-owners, transferring an extension, and receiving webhooks. It assumes you have a token with the right scopes and that the account has accepted the current terms.

## 📕 Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [✅ Before you publish](#-before-you-publish)
- [📦 What publish returns](#-what-publish-returns)
- [🧐 Reviewing and deprecating](#-reviewing-and-deprecating)
- [🗑️ Yanking and deleting](#️-yanking-and-deleting)
- [🏷️ Dist-tags](#️-dist-tags)
- [👥 Co-owners](#-co-owners)
- [🔁 Transfers](#-transfers)
- [🪝 Webhooks](#-webhooks)
  - [Create a webhook](#create-a-webhook)
  - [Inspect and remove](#inspect-and-remove)
  - [Deliveries](#deliveries)
- [🏢 Publishing for an organization](#-publishing-for-an-organization)
- [🔐 Permissions in practice](#-permissions-in-practice)
- [➡️ Next steps](#️-next-steps)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## ✅ Before you publish

You will need:

- A token with the `publish` scope, or a signed-in session.
- A gzipped tarball of the Twext project.
- Ownership of the extension namespace, or a role that can publish for it.
- An accepted terms version. See [Authentication](../authentication.md#-accepting-the-terms).

The client sends the tarball as the request body. It does not wrap it in multipart form data, so pass the same bytes your build produced:

```js
import { readFile } from 'node:fs/promises';

const tarball = await readFile('./xterm-1.0.0.tgz');

const version = await th.extensions.versions.publish('your-name', 'xterm', tarball);
```

In a browser, use a `Blob` or `File` from an upload control. The publish method accepts `Blob`, `ArrayBuffer`, and `Uint8Array`.

If your server expects a different content type, set it explicitly:

```js
await th.extensions.versions.publish('your-name', 'xterm', tarball, {
  contentType: 'application/octet-stream',
});
```

## 📦 What publish returns

`publish()` returns a `VersionInfo` object. The important fields are:

| Field       | Meaning                                                       |
| ----------- | ------------------------------------------------------------- |
| `namespace` | Owner namespace                                               |
| `id`        | Extension id                                                  |
| `version`   | The version that was uploaded                                 |
| `status`    | `pending`, `published`, `rejected`, `yanked`, or `deprecated` |
| `buildLog`  | Build output, when the instance provides it                   |
| `warnings`  | Build warnings with `code`, `file`, `line`, and `message`     |
| `dist`      | Download URL and optional digest/integrity values             |

A new version may be published immediately or held for review. Treat `status` as the source of truth, not the HTTP success alone:

```js
if (version.status === 'pending') {
  console.log('Waiting for review');
}

for (const warning of version.warnings ?? []) {
  console.warn(`${warning.file}:${warning.line} ${warning.message}`);
}
```

Build warnings do not necessarily fail a publish. A failed build is reported through the error's `problem.buildLog` or `problem.buildError`.

## 🧐 Reviewing and deprecating

Owners and admins can approve or reject a pending version:

```js
await th.extensions.versions.review('your-name', 'xterm', '1.0.0', {
  status: 'approved',
});

await th.extensions.versions.review('your-name', 'xterm', '1.0.1', {
  status: 'rejected',
  reason: 'The bundled file is incomplete.',
});
```

Deprecating marks a version as discouraged without deleting it:

```js
await th.extensions.versions.review('your-name', 'xterm', '0.9.0', {
  deprecationMessage: 'Use 1.0.0 instead.',
});
```

Pass `null` to clear the deprecation:

```js
await th.extensions.versions.review('your-name', 'xterm', '0.9.0', {
  deprecationMessage: null,
});
```

The same method handles both actions. Use `status` for approval or rejection, and `deprecationMessage` for deprecation. Do not send both in one call.

## 🗑️ Yanking and deleting

```js
await th.extensions.versions.delete('your-name', 'xterm', '0.9.0');
```

Deleting a version yanks it. Existing downloads may stop working, so prefer deprecation when you only want to warn users.

Deleting the whole extension is a separate, more destructive operation:

```js
await th.extensions.delete('your-name', 'xterm');
```

There is no undo in the client. Check the extension id and namespace before calling it.

## 🏷️ Dist-tags

Tags are mutable names that point at published versions:

```js
await th.extensions.tags.set('your-name', 'xterm', 'beta', '1.1.0-rc.1');

const tags = await th.extensions.tags.get('your-name', 'xterm');
console.log(tags.beta);
```

Remove a tag when it is no longer useful:

```js
await th.extensions.tags.delete('your-name', 'xterm', 'beta');
```

The `latest` tag is maintained by the instance and cannot be set through this method. Use a concrete version or another tag when you need a stable pointer.

## 👥 Co-owners

Ownership is invite-then-accept. The owner or an admin can invite an account or organization:

```js
await th.extensions.owners.invite('your-name', 'xterm', 'friend');
```

The invitee can see pending invites and accept one:

```js
const invites = await th.extensions.owners.listInvites('your-name', 'xterm');

await th.extensions.owners.accept('your-name', 'xterm', 'friend');
```

The path stays anchored at the extension, so the first argument is the current owner namespace, not the invitee. `listInvites()` returns only invitations addressed to the signed-in account or an organization it owns. If the extension belongs to `your-name`, an invitee accepting its own invite uses `accept("your-name", "xterm", "friend")`.

List current owners and remove one:

```js
const owners = await th.extensions.owners.list('your-name', 'xterm');

await th.extensions.owners.remove('your-name', 'xterm', 'friend');
```

An organization can be an owner too. Use its namespace anywhere an owner namespace is accepted.

## 🔁 Transfers

A transfer moves an extension to another namespace. The offer changes nothing until the destination accepts it.

```js
await th.extensions.transfers.offer('your-name', 'xterm', 'new-owner');

const offers = await th.extensions.transfers.list('your-name', 'xterm');
```

The destination accepts or the current owner withdraws:

```js
await th.extensions.transfers.accept('your-name', 'xterm', 'new-owner');
await th.extensions.transfers.withdraw('your-name', 'xterm', 'new-owner');
```

After a transfer is accepted, the extension belongs to the destination namespace. Update any hard-coded paths in your own tooling.

## 🪝 Webhooks

Webhooks are available for accounts, organizations, and individual extensions. All three groups have the same methods; choose the group that owns the webhook.

### Create a webhook

```js
const webhook = await th.extensions.webhooks.create('your-name', 'xterm', {
  url: 'https://your-app.example/hooks/twexthub',
  events: ['version.published', 'version.yanked'],
  active: true,
});
```

Store the secret securely. It is used to verify that a delivery came from the instance.

Available events:

- `version.published`
- `version.yanked`
- `version.deprecated`
- `version.rejected`
- `owners.invited`
- `owners.changed`
- `extension.transferred`

### Inspect and remove

```js
const hooks = await th.extensions.webhooks.list('your-name', 'xterm');

await th.extensions.webhooks.delete('your-name', 'xterm', hooks.data[0].id);
```

### Deliveries

```js
const deliveries = await th.extensions.webhooks.listDeliveries(
  'your-name',
  'xterm',
  hooks.data[0].id,
);

console.log(deliveries.data[0].status);
```

If a delivery failed, ask the instance to send it again:

```js
await th.extensions.webhooks.redeliver(
  'your-name',
  'xterm',
  hooks.data[0].id,
  deliveries.data[0].id,
);
```

Account and organization webhooks use the same shapes:

```js
await th.users.webhooks.list('your-name');
await th.orgs.webhooks.list('your-org');
```

## 🏢 Publishing for an organization

An organization owner can publish under the organization namespace:

```js
await th.extensions.versions.publish('your-org', 'xterm', tarball);
```

The token needs `manage:orgs` for organization management and `publish` for publishing. Being an organization owner does not automatically grant every scope to an automation token; the token still needs the scope for the action.

## 🔐 Permissions in practice

| Action                     | Typical requirement                         |
| -------------------------- | ------------------------------------------- |
| Publish a version          | `publish` scope and ownership               |
| Delete or yank a version   | `yank` scope and ownership                  |
| Read a source tarball      | `read:source` and access to the extension   |
| Change owners or transfers | Ownership and the relevant management scope |
| Review a pending version   | Owner or admin role                         |
| Manage webhooks            | Ownership or admin role                     |

The server makes the final decision. A `403` means the token is valid but not allowed to do that; a `401` means the request is not authenticated.

## ➡️ Next steps

- [Accounts and organizations](./accounts-and-organizations.md)
- [Errors and requests](./errors-and-requests.md)
- [Full API reference](../api-reference.md#extensions)
