# 🧰 API reference

This page lists every public method in TwextHubKit. Methods are grouped by the property you call them on. The return and payload type names refer to the declarations in `types/index.d.ts`.

All asynchronous methods return a promise. HTTP failures throw `TwextHubError`; transport failures throw `TwextHubNetworkError`. See [Errors and requests](./guides/errors-and-requests.md) for handling and retry guidance.

## Contents

- [Client](#client)
- [auth](#auth)
- [sessions](#sessions)
- [tokens](#tokens)
- [users](#users)
- [orgs](#orgs)
- [notifications](#notifications)
- [reports](#reports)
- [extensions](#extensions)
- [badges](#badges)
- [instance](#instance)
- [blobs](#blobs)
- [admin](#admin)
- [Options and common types](#options-and-common-types)

## Client

### `new TwextHubKit()`

Creates a client for the official instance.

```js
const th = new TwextHubKit();
```

### `new TwextHubKit(baseUrl)`

Creates a client for another instance. The URL must include `/api/v2`.

```js
const th = new TwextHubKit("https://example.com/api/v2");
```

### `new TwextHubKit(options)`

Creates a client with a base URL, token, headers, fetch implementation, default signal, or default timeout.

```js
const th = new TwextHubKit({
  baseUrl: "https://example.com/api/v2",
  token: process.env.TWEXTHUB_TOKEN,
  timeoutMs: 10000
});
```

### `new TwextHubKit(baseUrl, options)`

The first argument is the base URL; the second is the options object.

| Member | Returns | Notes |
| --- | --- | --- |
| `th.baseUrl` | `string` | Normalized API root |
| `th.token` | `string` or `null` | Current bearer token |
| `th.setToken(token)` | `TwextHubKit` | Sets or clears the token; chainable |
| `TwextHubKit.version` | `string` | Package version |
| `product` | `object` | Exported package metadata |

`setToken(null)` clears the in-memory token. It does not revoke the session or token on the server.

## auth

Sign-in, OIDC, MFA, passkeys, and reauthentication. See [Authentication](./authentication.md).

| Method | Returns | Notes |
| --- | --- | --- |
| `describe(options?)` | `Promise<AuthDescriptor>` | Reports whether password auth and OIDC are available |
| `getOidcAuthorizeUrl(options?)` | `Promise<OidcAuthorizeResult>` | Accepts `returnTo` |
| `oidcCallback(params, options?)` | `Promise<OidcCallbackResult>` | Server-side callback; can also resolve to `AuthSession`, `MfaRequired`, `RedirectResult`, or `undefined` |
| `exchangeOidcCode({ code }, options?)` | `Promise<SessionResult>` | Exchanges a browser callback code for a session |
| `linkOidc(options?)` | `Promise<OidcAuthorizeResult>` | Starts linking an OIDC identity to the signed-in account |
| `listOidcIdentities(options?)` | `Promise<Collection<OidcIdentity>>` | Linked identities |
| `deleteOidcIdentity(id, options?)` | `Promise<void>` | Removes one linked identity |
| `getMfaState(options?)` | `Promise<Passkeys>` | Passkeys and remaining backup codes |
| `createPasskeyOptions(options?)` | `Promise<{ options: WebAuthnOptions }>` | Options for `navigator.credentials.create()` |
| `registerPasskey({ response, label? }, options?)` | `Promise<PasskeyRegistration>` | Registers a new passkey |
| `renamePasskey(id, { label }, options?)` | `Promise<Passkey>` | Renames a passkey |
| `deletePasskey(id, options?)` | `Promise<void>` | Removes a passkey |
| `regenerateBackupCodes(options?)` | `Promise<BackupCodes>` | Creates a new set of backup codes |
| `getSigninOptions({ mfaToken }, options?)` | `Promise<{ options: WebAuthnOptions }>` | Options for an MFA `navigator.credentials.get()` |
| `verifyMfa(payload, options?)` | `Promise<AuthSession>` | Accepts `mfaToken` plus `response` or `backupCode` |
| `getReauthOptions(options?)` | `Promise<{ options: WebAuthnOptions }>` | Options for a recent-authentication check |
| `reauth({ response }, options?)` | `Promise<{ reauthenticatedAt: string }>` | Completes a recent-authentication check |

## sessions

Active sessions for the signed-in account.

| Method | Returns | Notes |
| --- | --- | --- |
| `create(payload, options?)` | `Promise<SessionResult>` | Password sign-in; payload is `CreateSessionPayload` |
| `list(query?)` | `Promise<Page<Session>>` | Accepts `namespace` and page options |
| `revokeCurrent(options?)` | `Promise<void>` | Revokes the session behind the current token |
| `delete(id, options?)` | `Promise<void>` | Revokes one session by id |

A session created by `sessions.create()` contains `session`, `user`, and `token`. If MFA is required, it contains `mfaRequired`, `mfaToken`, and `methods` instead.

## tokens

Automation tokens for scripts and CI.

| Method | Returns | Notes |
| --- | --- | --- |
| `list(query?)` | `Promise<Page<AutomationToken>>` | Accepts `namespace` and page options |
| `create(payload, options?)` | `Promise<AutomationTokenCreated>` | Payload is `CreateTokenPayload`; the `token` secret is shown once |
| `update(id, payload, options?)` | `Promise<AutomationToken>` | Payload is `UpdateTokenPayload` |
| `delete(id, options?)` | `Promise<void>` | Revokes one token |
| `revokeCurrent(options?)` | `Promise<void>` | Revokes the token the client is using |

## users

Accounts, including profiles, images, and account webhooks. See [Accounts and organizations](./guides/accounts-and-organizations.md).

| Method | Returns | Notes |
| --- | --- | --- |
| `create(payload, options?)` | `Promise<AuthSession>` | Payload is `CreateUserPayload`; registration depends on the instance |
| `list(query?)` | `Promise<Page<User>>` | Page options only |
| `get(namespace, options?)` | `Promise<User>` | Public account view for a user or organization |
| `me(options?)` | `Promise<User>` | The signed-in account |
| `update(namespace, payload, options?)` | `Promise<User>` | Payload is `UpdateUserPayload` |
| `delete(namespace, options?)` | `Promise<void>` | Deletes the account |

### Account webhooks

| Method | Returns | Notes |
| --- | --- | --- |
| `th.users.webhooks.list(namespace, options?)` | `Promise<Collection<Webhook>>` | All webhooks for the account |
| `th.users.webhooks.create(namespace, payload, options?)` | `Promise<WebhookCreated>` | Payload is `WebhookInput`; includes a one-time `secret` |
| `th.users.webhooks.delete(namespace, webhookId, options?)` | `Promise<void>` | Removes one webhook |
| `th.users.webhooks.listDeliveries(namespace, webhookId, query?)` | `Promise<Page<WebhookDelivery>>` | Delivery history |
| `th.users.webhooks.redeliver(namespace, webhookId, deliveryId, options?)` | `Promise<WebhookDelivery>` | Queues another attempt |

### Avatars and banners

`th.users.avatar` and `th.users.banner` have the same methods.

| Method | Returns | Notes |
| --- | --- | --- |
| `get(namespace, options?)` | `Promise<Blob>` | Accepts cache-busting `v` |
| `upload(namespace, data, options?)` | `Promise<User>` | `data` is `BinaryData`; accepts `contentType` |
| `delete(namespace, options?)` | `Promise<User>` | Removes the image and returns the updated profile |

## orgs

Organizations, their owners, extensions, images, and webhooks.

| Method | Returns | Notes |
| --- | --- | --- |
| `create(payload, options?)` | `Promise<Organization>` | Payload is `CreateOrganizationPayload` |
| `list(query?)` | `Promise<Page<Organization>>` | Page options only |
| `get(namespace, options?)` | `Promise<Organization>` | Organization details |
| `update(namespace, payload, options?)` | `Promise<Organization>` | Payload is `UpdateOrganizationPayload` |
| `delete(namespace, options?)` | `Promise<void>` | Deletes the organization |
| `listOwners(namespace, options?)` | `Promise<Collection<OrganizationOwner>>` | Current owners |
| `addOwner(namespace, ownerNamespace, options?)` | `Promise<void>` | Adds an owner immediately |
| `removeOwner(namespace, ownerNamespace, options?)` | `Promise<void>` | Removes an owner |
| `listExtensions(namespace, query?)` | `Promise<Page<ExtensionSummary>>` | Accepts `sort`, `license`, and page options |

### Organization webhooks

| Method | Returns | Notes |
| --- | --- | --- |
| `th.orgs.webhooks.list(namespace, options?)` | `Promise<Collection<Webhook>>` | All webhooks for the organization |
| `th.orgs.webhooks.create(namespace, payload, options?)` | `Promise<WebhookCreated>` | Payload is `WebhookInput` |
| `th.orgs.webhooks.delete(namespace, webhookId, options?)` | `Promise<void>` | Removes one webhook |
| `th.orgs.webhooks.listDeliveries(namespace, webhookId, query?)` | `Promise<Page<WebhookDelivery>>` | Delivery history |
| `th.orgs.webhooks.redeliver(namespace, webhookId, deliveryId, options?)` | `Promise<WebhookDelivery>` | Queues another attempt |

### Avatars and banners

`th.orgs.avatar` and `th.orgs.banner` have the same methods as the account versions, but return an `Organization` after a write.

| Method | Returns | Notes |
| --- | --- | --- |
| `get(namespace, options?)` | `Promise<Blob>` | Accepts cache-busting `v` |
| `upload(namespace, data, options?)` | `Promise<Organization>` | `data` is `BinaryData`; accepts `contentType` |
| `delete(namespace, options?)` | `Promise<Organization>` | Removes the image |

## notifications

The signed-in account's inbox.

| Method | Returns | Notes |
| --- | --- | --- |
| `list(query?)` | `Promise<NotificationPage>` | Accepts `unread` and page options |
| `markRead({ ids }, options?)` | `Promise<MarkNotificationsReadResult>` | Marks the listed notifications |
| `markRead({ all: true }, options?)` | `Promise<MarkNotificationsReadResult>` | Marks every notification |
| `markOneRead(id, options?)` | `Promise<Notification>` | Marks one and returns it |

`NotificationPage` is a normal page plus `unreadCount`.

## reports

Reports filed by the signed-in account. The owner view hides reviewer details.

| Method | Returns | Notes |
| --- | --- | --- |
| `create(payload, options?)` | `Promise<ReportOwnerView>` | Payload is `CreateReportPayload` |
| `list(query?)` | `Promise<Page<ReportOwnerView>>` | The caller's reports |
| `get(id, options?)` | `Promise<ReportOwnerView>` | One of the caller's reports |

Use the admin methods to read the full report record.

## extensions

Extensions and their nested resource groups.

| Method | Returns | Notes |
| --- | --- | --- |
| `list(query?)` | `Promise<Page<ExtensionSummary>>` | Accepts `sort`, `license`, `namespace`, and page options |
| `search(text, options?)` | `Promise<Page<ExtensionSummary>>` | Accepts `sort`, `license`, and page options |
| `trending(options?)` | `Promise<Page<ExtensionSummary>>` | Accepts `limit` and request options |
| `get(namespace, id, options?)` | `Promise<ExtensionDetail>` | Full detail with versions |
| `delete(namespace, id, options?)` | `Promise<void>` | Deletes the whole extension |

### Versions

| Method | Returns | Notes |
| --- | --- | --- |
| `th.extensions.versions.list(namespace, id, query?)` | `Promise<Page<VersionInfo>>` | Accepts `range`, `status`, and page options |
| `th.extensions.versions.get(namespace, id, version, options?)` | `Promise<VersionInfo>` | One version |
| `th.extensions.versions.publish(namespace, id, tarball, options?)` | `Promise<VersionInfo>` | `tarball` is `BinaryData`; options are `PublishOptions` |
| `th.extensions.versions.review(namespace, id, version, payload, options?)` | `Promise<VersionInfo>` | Approve, reject, or deprecate |
| `th.extensions.versions.delete(namespace, id, version, options?)` | `Promise<void>` | Yanks a version |
| `th.extensions.versions.source(namespace, id, version, options?)` | `Promise<Blob>` | Source tarball |
| `th.extensions.versions.download(namespace, id, version, options?)` | `Promise<Blob>` | Compiled download |

`review()` accepts either `ReviewVersionPayload` with `status` and optional `reason`, or `DeprecateVersionPayload` with `deprecationMessage`.

### Tags

| Method | Returns | Notes |
| --- | --- | --- |
| `th.extensions.tags.get(namespace, id, options?)` | `Promise<DistTags>` | All tags and their versions |
| `th.extensions.tags.set(namespace, id, tag, version, options?)` | `Promise<void>` | Creates or moves a tag |
| `th.extensions.tags.delete(namespace, id, tag, options?)` | `Promise<void>` | Removes a tag |

The implicit `latest` tag is maintained by the instance and cannot be set here.

### Owners

| Method | Returns | Notes |
| --- | --- | --- |
| `th.extensions.owners.list(namespace, id, options?)` | `Promise<Collection<ExtensionOwner>>` | Current owners |
| `th.extensions.owners.listInvites(namespace, id, options?)` | `Promise<Collection<ExtensionOwnerInvite>>` | Pending invites |
| `th.extensions.owners.invite(namespace, id, ownerNamespace, options?)` | `Promise<void>` | Invites a co-owner |
| `th.extensions.owners.remove(namespace, id, ownerNamespace, options?)` | `Promise<void>` | Removes an owner |
| `th.extensions.owners.accept(namespace, id, ownerNamespace, options?)` | `Promise<{ data: { namespace, id, owner } }>` | Accepts an invite |

### Transfers

| Method | Returns | Notes |
| --- | --- | --- |
| `th.extensions.transfers.list(namespace, id, options?)` | `Promise<Collection<ExtensionTransfer>>` | Pending transfer offers |
| `th.extensions.transfers.offer(namespace, id, to, options?)` | `Promise<{ data: { namespace, id, to } }>` | Offers the extension to another namespace |
| `th.extensions.transfers.withdraw(namespace, id, toNamespace, options?)` | `Promise<void>` | Withdraws an offer |
| `th.extensions.transfers.accept(namespace, id, toNamespace, options?)` | `Promise<{ data: { namespace, id, from, versions } }>` | Accepts an offer |

### Extension webhooks

| Method | Returns | Notes |
| --- | --- | --- |
| `th.extensions.webhooks.list(namespace, id, options?)` | `Promise<Collection<Webhook>>` | All webhooks for the extension |
| `th.extensions.webhooks.create(namespace, id, payload, options?)` | `Promise<WebhookCreated>` | Payload is `WebhookInput` |
| `th.extensions.webhooks.delete(namespace, id, webhookId, options?)` | `Promise<void>` | Removes one webhook |
| `th.extensions.webhooks.listDeliveries(namespace, id, webhookId, query?)` | `Promise<Page<WebhookDelivery>>` | Delivery history |
| `th.extensions.webhooks.redeliver(namespace, id, webhookId, deliveryId, options?)` | `Promise<WebhookDelivery>` | Queues another attempt |

## badges

SVG badges for an extension.

| Method | Returns | Notes |
| --- | --- | --- |
| `get(namespace, id, options?)` | `Promise<string>` | Accepts an optional `label` |
| `getField(namespace, id, field, options?)` | `Promise<string>` | `field` is `version`, `downloads`, or `license` |

## instance

Public information about the instance.

| Method | Returns | Notes |
| --- | --- | --- |
| `meta(options?)` | `Promise<Meta>` | Name, version, tagline, homepage |
| `stats(options?)` | `Promise<Stats>` | Published, pending, authors, downloads |
| `terms(options?)` | `Promise<LegalDocument>` | Current terms and version |
| `privacy(options?)` | `Promise<LegalDocument>` | Current privacy document |
| `atomFeed(options?)` | `Promise<string>` | Atom XML |

## blobs

| Method | Returns | Notes |
| --- | --- | --- |
| `get(digest, options?)` | `Promise<Blob>` | Fetch a blob by its digest |

## admin

Instance administration. These methods require an admin account and usually the `admin` token scope.

| Method | Returns | Notes |
| --- | --- | --- |
| `updateTerms({ body }, options?)` | `Promise<LegalDocument>` | Replaces the terms body |
| `updatePrivacy({ body }, options?)` | `Promise<LegalDocument>` | Replaces the privacy body |
| `listAudit(query?)` | `Promise<Page<AuditEntry>>` | Audit log |
| `getQuota(namespace, options?)` | `Promise<Quota>` | Blob quota for one namespace |
| `setQuota(namespace, payload, options?)` | `Promise<Quota>` | Payload is `SetQuotaPayload` |
| `getMetrics(options?)` | `Promise<string>` | Metrics text |
| `getConfig(options?)` | `Promise<ServerConfig>` | Editable server settings |
| `updateConfig(payload, options?)` | `Promise<ServerConfigUpdate>` | Payload is `UpdateConfigPayload` |
| `broadcastNotification(payload, options?)` | `Promise<{ created: number }>` | Payload is `BroadcastNotificationPayload` |
| `listReports(query?)` | `Promise<Page<Report>>` | Accepts `status`, `targetType`, and page options |
| `getReport(id, options?)` | `Promise<Report>` | Full report record |
| `decideReport(id, payload, options?)` | `Promise<Report>` | Payload is `DecideReportPayload` |
| `listPendingVersions(query?)` | `Promise<Page<PendingVersion>>` | Accepts `status` and page options |

## Options and common types

### Request options

`RequestOptions` is accepted by every method that talks to the API:

| Field | Type | Meaning |
| --- | --- | --- |
| `signal` | `AbortSignal` | Cancels the request |
| `timeoutMs` | `number` | Timeout in milliseconds |

For list and search methods, put request options in the query object. For single-resource and write methods, pass them as the final argument.

### Pages and collections

| Type | Shape |
| --- | --- |
| `Page<T>` | `{ data: T[], _links: { self, next, prev } }` |
| `Collection<T>` | `{ data: T[] }` |
| `PageQuery` | `{ cursor?, limit?, dir? }` plus request options |

Read the `cursor` query value from `_links.next` and pass that as `cursor` to move forward. Do not construct cursors yourself.

### Binary data

`BinaryData` is `Blob`, `ArrayBuffer`, or `Uint8Array`. It is used for publishing tarballs and uploading images.

### Enumerated values

| Type | Values |
| --- | --- |
| `SortOrder` | `recent`, `downloads`, `updated`, `name` |
| `PageDirection` | `back` |
| `VersionStatus` | `staging`, `pending`, `published`, `rejected`, `yanked`, `deprecated` |
| `BadgeField` | `version`, `downloads`, `license` |
| `TokenScope` | `publish`, `yank`, `read:source`, `manage:account`, `manage:orgs`, `manage:sessions`, `manage:tokens`, `admin` |
| `ReportTargetType` | `user`, `organization`, `extension` |
| `ReportReason` | `spam`, `harassment`, `malicious_code`, `copyright`, `impersonation`, `other` |
| `ReportStatus` | `open`, `resolved`, `dismissed` |

`WebhookEvent` includes version, owner, and transfer events. `NotificationKind` includes review, terms, token, role, broadcast, ownership, and transfer events. The full lists are in `types/index.d.ts`.

### Payload types

| Type | Used by |
| --- | --- |
| `CreateUserPayload` | `users.create()` |
| `UpdateUserPayload` | `users.update()` |
| `CreateOrganizationPayload` | `orgs.create()` |
| `UpdateOrganizationPayload` | `orgs.update()` |
| `CreateSessionPayload` | `sessions.create()` |
| `CreateTokenPayload` | `tokens.create()` |
| `UpdateTokenPayload` | `tokens.update()` |
| `CreateReportPayload` | `reports.create()` |
| `ReviewVersionPayload` | `extensions.versions.review()` |
| `DeprecateVersionPayload` | `extensions.versions.review()` |
| `SetQuotaPayload` | `admin.setQuota()` |
| `UpdateConfigPayload` | `admin.updateConfig()` |
| `BroadcastNotificationPayload` | `admin.broadcastNotification()` |
| `DecideReportPayload` | `admin.decideReport()` |
| `WebhookInput` | Account, organization, and extension webhook `create()` |

### Response types

The declarations include `User`, `Organization`, `OrganizationOwner`, `Session`, `AuthSession`, `Passkeys`, `Passkey`, `AutomationToken`, `Webhook`, `WebhookDelivery`, `VersionInfo`, `PendingVersion`, `ExtensionSummary`, `ExtensionDetail`, `ExtensionOwner`, `ExtensionOwnerInvite`, `ExtensionTransfer`, `Notification`, `Report`, `ReportOwnerView`, `AuditEntry`, `Quota`, `Meta`, `Stats`, `LegalDocument`, `ServerConfig`, and `ServerConfigUpdate`.

See `types/index.d.ts` for every field and optional value.
