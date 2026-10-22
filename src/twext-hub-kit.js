// The public client object. It owns the HTTP transport and exposes the API as
// resource groups; methods live in src/resources so this file stays a map of
// the surface rather than an implementation.

import { HttpClient } from './http-client.js';
import { product } from './product.js';
import { AdminResource } from './resources/admin.js';
import { AuthResource } from './resources/auth.js';
import { BadgesResource } from './resources/badges.js';
import { BlobsResource } from './resources/blobs.js';
import { ExtensionsResource } from './resources/extensions.js';
import { InstanceResource } from './resources/instance.js';
import { NotificationsResource } from './resources/notifications.js';
import { OrgsResource } from './resources/orgs.js';
import { ReportsResource } from './resources/reports.js';
import { SessionsResource } from './resources/sessions.js';
import { TokensResource } from './resources/tokens.js';
import { UsersResource } from './resources/users.js';

export class TwextHubKit {
  #client;

  constructor(baseUrl = product.defaults.apiBaseUrl, options = {}) {
    const resolved = resolveArguments(baseUrl, options);
    this.#client = new HttpClient(resolved.baseUrl, resolved.options);

    this.auth = new AuthResource(this.#client);
    this.sessions = new SessionsResource(this.#client);
    this.tokens = new TokensResource(this.#client);
    this.users = new UsersResource(this.#client);
    this.orgs = new OrgsResource(this.#client);
    this.notifications = new NotificationsResource(this.#client);
    this.reports = new ReportsResource(this.#client);
    this.extensions = new ExtensionsResource(this.#client);
    this.badges = new BadgesResource(this.#client);
    this.instance = new InstanceResource(this.#client);
    this.blobs = new BlobsResource(this.#client);
    this.admin = new AdminResource(this.#client);
  }

  get baseUrl() {
    return this.#client.baseUrl;
  }

  get token() {
    return this.#client.token;
  }

  setToken(token) {
    this.#client.setToken(token);
    return this;
  }
}

TwextHubKit.version = product.version;

function resolveArguments(baseUrl, options) {
  if (baseUrl instanceof URL) {
    return { baseUrl, options };
  }
  if (baseUrl !== null && typeof baseUrl === 'object') {
    return {
      baseUrl: baseUrl.baseUrl ?? product.defaults.apiBaseUrl,
      options: baseUrl,
    };
  }
  return {
    baseUrl: baseUrl ?? product.defaults.apiBaseUrl,
    options,
  };
}
