// Accounts: registration, lookup, profile updates, deletion, and the
// authenticated caller's own /me view. Webhooks and images hang off the same
// namespace but are kept as sub-resources because they have their own shapes.

import { pathValue, pickQuery, requestOptions } from '../paths.js';
import { ImageResource } from './images.js';
import { AccountWebhooksResource } from './webhooks.js';

const PAGE_KEYS = ['cursor', 'limit', 'dir'];

export class UsersResource {
  constructor(client) {
    this.client = client;
    this.webhooks = new AccountWebhooksResource(client);
    this.avatar = new ImageResource(client, function (namespace) {
      return `/users/${pathValue(namespace, 'namespace')}/avatar`;
    });
    this.banner = new ImageResource(client, function (namespace) {
      return `/users/${pathValue(namespace, 'namespace')}/banner`;
    });
  }

  create(payload, options = {}) {
    return this.client.request('/users', {
      method: 'POST',
      json: {
        namespace: payload.namespace,
        password: payload.password,
        displayName: payload.displayName
      },
      ...requestOptions(options)
    });
  }

  list(query = {}) {
    return this.client.request('/users', {
      query: pickQuery(query, PAGE_KEYS),
      ...requestOptions(query)
    });
  }

  get(namespace, options = {}) {
    return this.client.request(`/users/${pathValue(namespace, 'namespace')}`, {
      ...requestOptions(options)
    });
  }

  me(options = {}) {
    return this.client.request('/me', requestOptions(options));
  }

  update(namespace, payload, options = {}) {
    return this.client.request(`/users/${pathValue(namespace, 'namespace')}`, {
      method: 'PATCH',
      json: {
        displayName: payload.displayName,
        password: payload.password,
        currentPassword: payload.currentPassword,
        role: payload.role,
        bio: payload.bio,
        website: payload.website,
        github: payload.github,
        avatarUrl: payload.avatarUrl,
        bannerUrl: payload.bannerUrl,
        termsAcceptedVersion: payload.termsAcceptedVersion
      },
      ...requestOptions(options)
    });
  }

  delete(namespace, options = {}) {
    return this.client.request(`/users/${pathValue(namespace, 'namespace')}`, {
      method: 'DELETE',
      responseType: 'none',
      ...requestOptions(options)
    });
  }
}
