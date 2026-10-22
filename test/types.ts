// This file is checked by tsc, not run by node --test. It proves the package's
// self-referencing import resolves and that the resource groups accept the
// documented arguments.

import TwextHubKit, {
  TwextHubError,
  product,
  type ExtensionDetail,
  type Meta,
  type NotificationPage,
  type Page,
  type Report,
  type ServerConfig,
  type SessionResult,
  type User,
  type VersionInfo,
  type WebhookCreated
} from "@twextjs/twexthubkit";

const th = new TwextHubKit("https://twexts.sdisk.us/api/v2", {
  token: "token",
  timeoutMs: 5000
});

th.setToken(null);
th.setToken("token");

const version: string = TwextHubKit.version;
const packageVersion: string = product.version;
const meta: Meta = await th.instance.meta();
const user: User = await th.users.get("kamix");
const users: Page<User> = await th.users.list({ limit: 2 });
const extension: ExtensionDetail = await th.extensions.get("kamix", "xterm");
const versions: Page<VersionInfo> = await th.extensions.versions.list("kamix", "xterm", {
  range: "^0.1"
});
const published: VersionInfo = await th.extensions.versions.publish(
  "kamix",
  "xterm",
  new Uint8Array()
);
const webhook: WebhookCreated = await th.users.webhooks.create("kamix", {
  url: "https://example.com/hook",
  events: ["version.published"]
});
const notifications: NotificationPage = await th.notifications.list({ unread: true });
const report: Report = await th.admin.getReport("1");
const config: ServerConfig = await th.admin.getConfig();
const svg: string = await th.badges.get("kamix", "xterm");
const blob: Blob = await th.blobs.get("a".repeat(64));
const session: SessionResult = await th.sessions.create({
  namespace: "kamix",
  password: "password"
});
const error = new TwextHubError("missing", { status: 404 });

await th.users.get("kamix", { signal: new AbortController().signal });

console.log(
  version,
  packageVersion,
  meta,
  user,
  users,
  extension,
  versions,
  published,
  webhook,
  notifications,
  report,
  config,
  svg,
  blob,
  session,
  error
);
