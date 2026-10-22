# 🔐 Authentication

Public browsing does not need a token. You need one when the API has to know who you are: reading your notifications, changing a profile, publishing a version, managing an organization, or using admin tools.

TwextHubKit supports three ways to get that identity:

- Sign in with a password, plus MFA when the account requires it.
- Sign in through OIDC.
- Use an automation token, which is the usual choice for CI and scripts.

All three end with a bearer token. Once the client has it, every request includes it automatically.

## 📕 Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [🪪 Public requests](#-public-requests)
- [🔑 Sign in with a password](#-sign-in-with-a-password)
- [🧩 Finish an MFA sign-in](#-finish-an-mfa-sign-in)
  - [With a passkey](#with-a-passkey)
  - [With a backup code](#with-a-backup-code)
- [🛂 Sign in with OIDC](#-sign-in-with-oidc)
  - [Link an OIDC identity to an existing account](#link-an-oidc-identity-to-an-existing-account)
- [🤖 Automation tokens](#-automation-tokens)
  - [Scopes](#scopes)
  - [Manage tokens](#manage-tokens)
- [🚪 Sessions and signing out](#-sessions-and-signing-out)
- [📜 Accepting the terms](#-accepting-the-terms)
- [🛡️ Keep tokens safe](#-keep-tokens-safe)
- [➡️ Next steps](#-next-steps)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## 🪪 Public requests

Requests without a token still work for public data:

```js
const th = new TwextHubKit();

const extension = await th.extensions.get('kamix', 'xterm');
const page = await th.extensions.list({ limit: 10 });
```

If you call an endpoint that needs an account without a token, the API returns `401` and the client throws `TwextHubError`.

## 🔑 Sign in with a password

```js
const result = await th.sessions.create({
  namespace: 'your-name',
  password: 'your-password',
});

if (result.mfaRequired) {
  // Finish the MFA flow below.
} else {
  th.setToken(result.token);
}
```

A successful sign-in returns:

```js
{
  session: { id, createdAt, expiresAt, lastUsedAt },
  user: { namespace, displayName, ... },
  token: "the-session-token"
}
```

If the account has MFA enabled, `sessions.create()` returns `{ mfaRequired: true, mfaToken, methods }` instead. The `mfaToken` is short-lived and only used to finish this sign-in.

Not every instance allows password sign-in. Check first if you are building a general UI:

```js
const auth = await th.auth.describe();

console.log(auth.passwordAuth); // true or false
console.log(auth.oidc); // { issuer, required } or null
```

If `oidc.required` is `true`, password sign-in is not available and you should use the OIDC flow.

## 🧩 Finish an MFA sign-in

`methods` tells you what the account can use: `"passkey"`, `"backup_code"`, or both.

### With a passkey

```js
const mfaToken = result.mfaToken;

const { options } = await th.auth.getSigninOptions({ mfaToken });
const credential = await navigator.credentials.get({ publicKey: options });

const session = await th.auth.verifyMfa({
  mfaToken,
  response: JSON.parse(JSON.stringify(credential)),
});

th.setToken(session.token);
```

`verifyMfa()` accepts either a WebAuthn `response` or a `backupCode`.

### With a backup code

```js
const session = await th.auth.verifyMfa({
  mfaToken: result.mfaToken,
  backupCode: 'ABCD-EFGH',
});

th.setToken(session.token);
```

`verifyMfa()` returns the same `session`, `user`, and `token` shape as a normal sign-in.

## 🛂 Sign in with OIDC

OIDC is a browser redirect flow. The client gives you a URL; your app sends the browser there, and the instance redirects back to your app.

```js
const { authorizationUrl } = await th.auth.getOidcAuthorizeUrl({
  returnTo: 'https://your-app.example/auth/callback',
});

window.location.assign(authorizationUrl);
```

After the redirect, your callback page receives a `code` and `state`. Exchange the code for a session:

```js
const session = await th.auth.exchangeOidcCode({ code });
th.setToken(session.token);
```

Some setups use a server-side callback instead. `auth.oidcCallback()` follows the redirect with `redirect: "manual"` and returns either a redirect URL, a session result, an MFA challenge, or a linked-identity result:

```js
const result = await th.auth.oidcCallback({ code, state });

if (result && result.redirectUrl) {
  response.redirect(result.redirectUrl);
}
```

Which flow to use depends on how your OIDC client is registered. If you are building a single-page app, the authorization URL plus `exchangeOidcCode()` is usually the simplest path.

### Link an OIDC identity to an existing account

If the user is already signed in, you can attach an OIDC identity instead of creating a new session:

```js
const { authorizationUrl } = await th.auth.linkOidc({
  returnTo: 'https://your-app.example/settings',
});

window.location.assign(authorizationUrl);
```

You can list and remove linked identities:

```js
const identities = await th.auth.listOidcIdentities();
await th.auth.deleteOidcIdentity(identities.data[0].id);
```

## 🤖 Automation tokens

Automation tokens are long-lived credentials for scripts, CI jobs, and other software. Create one while signed in:

```js
const created = await th.tokens.create({
  name: 'release workflow',
  scopes: ['publish', 'yank'],
  expiresInDays: 30,
});

console.log(created.token); // shown only in this response
```

Store `created.token` somewhere safe. The API does not return the secret again.

Use it in another client:

```js
const th = new TwextHubKit({
  token: process.env.TWEXTHUB_TOKEN,
});
```

### Scopes

| Scope             | Allows                                                   |
| ----------------- | -------------------------------------------------------- |
| `publish`         | Publish new extension versions                           |
| `yank`            | Remove or yank versions                                  |
| `read:source`     | Download source tarballs                                 |
| `manage:account`  | Update the account profile and settings                  |
| `manage:orgs`     | Manage organizations and their owners                    |
| `manage:sessions` | List and revoke sessions                                 |
| `manage:tokens`   | Create, update, and revoke automation tokens             |
| `admin`           | Use admin routes; the account still needs the admin role |

A session token has all scopes. An automation token only has the scopes you grant it, so keep the list as small as the job allows.

### Manage tokens

```js
const tokens = await th.tokens.list();

await th.tokens.update(tokens.data[0].id, {
  name: 'nightly release',
  scopes: ['publish'],
});

await th.tokens.delete(tokens.data[0].id);
await th.tokens.revokeCurrent();
```

`revokeCurrent()` revokes the token the client is currently using. After that, the client cannot make authenticated requests until you set a new token.

## 🚪 Sessions and signing out

```js
const sessions = await th.sessions.list();
await th.sessions.delete(sessions.data[0].id);
await th.sessions.revokeCurrent();

th.setToken(null);
```

- `sessions.delete(id)` revokes one session.
- `sessions.revokeCurrent()` revokes the session behind the current token.
- `setToken(null)` only clears the client's in-memory token. It does not revoke anything on the server.

The client never writes tokens to local storage, cookies, or disk. If you want a session to survive a page reload, your app has to store it and call `setToken()` again.

## 📜 Accepting the terms

Many authenticated endpoints return `403` until the account accepts the current terms. The error says the current terms have not been accepted; fetch their version and send it back:

```js
const terms = await th.instance.terms();

await th.users.update('your-name', {
  termsAcceptedVersion: terms.version,
});
```

Check `user.termsAcceptedVersion` against `instance.terms().version` after signing in if your app needs to prompt for acceptance.

## 🛡️ Keep tokens safe

- Never put a token in source code, a public build, or a URL.
- Use environment variables or a secret store on the server.
- Prefer automation tokens with narrow scopes for CI.
- Revoke tokens you no longer need.
- Treat a session token like a password.

The client sends the token in the `Authorization` header. It does not log it or include it in error messages.

## ➡️ Next steps

- [Browse extensions and download files](./guides/browsing-and-downloads.md)
- [Publish an extension](./guides/publishing.md)
- [Errors and requests](./guides/errors-and-requests.md)
- [Full API reference](./api-reference.md#auth)
