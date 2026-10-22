# 👥 Accounts and organizations

TwextHub has two kinds of namespace: personal accounts and organizations. They share a public profile shape, but they are managed differently. This guide covers profiles, images, organization owners, notifications, and reports.

## 📕 Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [👤 Your account](#-your-account)
  - [Create an account](#create-an-account)
  - [Update a profile](#update-a-profile)
  - [Change a password](#change-a-password)
  - [Delete an account](#delete-an-account)
- [🖼️ Avatars and banners](#-avatars-and-banners)
- [🏢 Organizations](#-organizations)
  - [Create and update](#create-and-update)
  - [Owners](#owners)
  - [Organization extensions](#organization-extensions)
  - [Delete an organization](#delete-an-organization)
- [🔔 Notifications](#-notifications)
  - [Mark as read](#mark-as-read)
- [🚩 Reports](#-reports)
  - [See your reports](#see-your-reports)
- [🔐 Who can do what](#-who-can-do-what)
- [➡️ Next steps](#-next-steps)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## 👤 Your account

The signed-in account is available with `users.me()`:

```js
th.setToken(token);

const me = await th.users.me();
console.log(me.namespace, me.displayName, me.role);
```

`me()` is useful after sign-in or when you need the current role without knowing the namespace in advance.

### Create an account

```js
const session = await th.users.create({
  namespace: 'your-name',
  password: 'a-strong-password',
  displayName: 'Your Name',
});

th.setToken(session.token);
```

Whether open registration is allowed depends on the instance. Some instances restrict it to admins; a `403` means the server refused the request, not that the payload was malformed.

### Update a profile

```js
await th.users.update('your-name', {
  displayName: 'Your Name',
  bio: 'I build TurboWarp extensions.',
  website: 'https://example.com',
  github: 'your-github-name',
});
```

The update payload can include:

| Field                  | Notes                                            |
| ---------------------- | ------------------------------------------------ |
| `displayName`          | Public display name                              |
| `bio`                  | Short profile text                               |
| `website`              | URL or `null`                                    |
| `github`               | GitHub username or `null`                        |
| `avatarUrl`            | External avatar URL, when allowed                |
| `bannerUrl`            | External banner URL, when allowed                |
| `password`             | New password; usually requires `currentPassword` |
| `currentPassword`      | Current password for a password change           |
| `role`                 | Admin-only role change                           |
| `termsAcceptedVersion` | Accept a specific terms version                  |

Only send the fields you want to change. The client forwards them as a partial update.

### Change a password

```js
await th.users.update('your-name', {
  currentPassword: 'old-password',
  password: 'new-password',
});
```

If your app manages sessions, revoke the old ones after a password change:

```js
const sessions = await th.sessions.list();

for (const session of sessions.data) {
  await th.sessions.delete(session.id);
}
```

Do not revoke the session you are currently using unless you intend to sign out.

### Delete an account

```js
await th.users.delete('your-name');
```

This is permanent and normally requires the account itself or an admin. Make sure your UI confirms the namespace before calling it.

## 🖼️ Avatars and banners

Accounts and organizations have avatar and banner sub-resources. Reading returns a `Blob`:

```js
const avatar = await th.users.avatar.get('kamix');
const banner = await th.orgs.banner.get('kamix');
```

Upload accepts a `Blob`, `ArrayBuffer`, or `Uint8Array`. The content type comes from `options.contentType`, then `data.type`, and finally `application/octet-stream`:

```js
await th.users.avatar.upload('your-name', file, {
  contentType: file.type,
});

await th.orgs.banner.upload('your-org', bannerBytes, {
  contentType: 'image/png',
});
```

Uploading and deleting return the updated profile:

```js
const updated = await th.users.avatar.delete('your-name');
```

The optional `v` query is a cache-busting value. Use it when you need a fresh image after an upload:

```js
const fresh = await th.users.avatar.get('your-name', { v: Date.now() });
```

## 🏢 Organizations

An organization is a namespace without a password. It can own extensions and have multiple owners.

### Create and update

```js
const org = await th.orgs.create({
  namespace: 'your-org',
  displayName: 'Your Organization',
  bio: 'We build tools for TurboWarp.',
});

await th.orgs.update('your-org', {
  website: 'https://your-org.example',
  github: 'your-org',
});
```

The create payload also accepts `avatarUrl` and `bannerUrl`. The update payload accepts `displayName`, `bio`, `website`, `github`, `avatarUrl`, and `bannerUrl`.

### Owners

```js
const owners = await th.orgs.listOwners('your-org');

await th.orgs.addOwner('your-org', 'friend');
await th.orgs.removeOwner('your-org', 'friend');
```

Organization owners can manage the organization and publish under its namespace, subject to their token scopes. Adding an owner is immediate; there is no invite step for organization owners in this client.

Remove an owner carefully. If you remove the last owner, nobody may be able to manage the organization through the normal owner path.

### Organization extensions

```js
const page = await th.orgs.listExtensions('your-org', {
  sort: 'recent',
  limit: 20,
});
```

This returns extension summaries owned by the organization. Use `extensions.get()` with the organization namespace for the full detail view.

### Delete an organization

```js
await th.orgs.delete('your-org');
```

Only an owner or admin should be able to do this. Like account deletion, it is permanent.

## 🔔 Notifications

Notifications belong to the signed-in account. There is no namespace argument.

```js
const inbox = await th.notifications.list({ unread: true });

console.log(inbox.unreadCount);

for (const notification of inbox.data) {
  console.log(notification.kind, notification.message);
}
```

Notification kinds include review decisions, terms changes, revoked tokens, role changes, ownership changes, transfer updates, and broadcasts. The `payload` field holds the details for the specific kind.

### Mark as read

Mark specific notifications:

```js
await th.notifications.markRead({
  ids: ['notification-id', 'another-id'],
});
```

Mark everything:

```js
await th.notifications.markRead({ all: true });
```

Mark one and get the updated record:

```js
const notification = await th.notifications.markOneRead('notification-id');
console.log(notification.read);
```

`markRead()` returns `{ updated }`, the number of notifications that changed.

## 🚩 Reports

Reports are for abuse, copyright, impersonation, malicious code, and similar problems. Any signed-in account can file one:

```js
const report = await th.reports.create({
  targetType: 'extension',
  targetNamespace: 'kamix',
  targetExtensionId: 'xterm',
  reason: 'malicious_code',
  description: 'The published bundle fetches and runs remote code.',
});
```

Target types are:

- `user`
- `organization`
- `extension`

Reasons are:

- `spam`
- `harassment`
- `malicious_code`
- `copyright`
- `impersonation`
- `other`

For a user or organization report, leave out `targetExtensionId`. For an extension report, include it.

### See your reports

```js
const reports = await th.reports.list();
const one = await th.reports.get(reports.data[0].id);

console.log(one.status);
```

The owner view is intentionally limited. It shows the target, reason, status, and timestamps, but not the full reviewer notes or other reporters' details. Admin endpoints expose the full record; see the [API reference](../api-reference.md#admin).

## 🔐 Who can do what

| Action                            | Who can do it                                   |
| --------------------------------- | ----------------------------------------------- |
| Read a public profile             | Anyone                                          |
| Update a profile                  | The account, or an admin                        |
| Delete an account                 | The account, or an admin                        |
| Create an organization            | Signed-in accounts, when the instance allows it |
| Add or remove organization owners | Organization owners or admins                   |
| Read notifications                | The signed-in account only                      |
| File a report                     | Signed-in accounts                              |
| Read the full report record       | Admins                                          |

The server enforces these rules. The client does not hide methods based on your role, so a call can still fail with `403` if the token is not allowed to perform it.

## ➡️ Next steps

- [Publish an extension](./publishing.md)
- [Errors and requests](./errors-and-requests.md)
- [Full API reference](../api-reference.md#users)
