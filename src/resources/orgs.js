// Organizations are namespaces without a password. Their profile and images
// mirror an account's, and their owner list is made of accounts.

import { pathValue, pickQuery, requestOptions } from '../paths.js';
import { ImageResource } from './images.js';
import { OrganizationWebhooksResource } from './webhooks.js';

const PAGE_KEYS = ['cursor', 'limit', 'dir'];
const EXTENSION_KEYS = ['sort', 'license', 'cursor', 'limit', 'dir'];

export class OrgsResource {
  constructor(client) {
    this.client = client;
    this.webhooks = new OrganizationWebhooksResource(client);
    this.avatar = new ImageResource(client, function (namespace) {
      return `/orgs/${pathValue(namespace, 'namespace')}/avatar`;
    });
    this.banner = new ImageResource(client, function (namespace) {
      return `/orgs/${pathValue(namespace, 'namespace')}/banner`;
    });
  }

  create(payload, options = {}) {
    return this.client.request('/orgs', {
      method: 'POST',
      json: {
        namespace: payload.namespace,
        displayName: payload.displayName,
        bio: payload.bio,
        website: payload.website,
        github: payload.github,
        avatarUrl: payload.avatarUrl,
        bannerUrl: payload.bannerUrl,
      },
      ...requestOptions(options),
    });
  }

  list(query = {}) {
    return this.client.request('/orgs', {
      query: pickQuery(query, PAGE_KEYS),
      ...requestOptions(query),
    });
  }

  get(namespace, options = {}) {
    return this.client.request(`/orgs/${pathValue(namespace, 'namespace')}`, {
      ...requestOptions(options),
    });
  }

  update(namespace, payload, options = {}) {
    return this.client.request(`/orgs/${pathValue(namespace, 'namespace')}`, {
      method: 'PATCH',
      json: {
        displayName: payload.displayName,
        bio: payload.bio,
        website: payload.website,
        github: payload.github,
        avatarUrl: payload.avatarUrl,
        bannerUrl: payload.bannerUrl,
      },
      ...requestOptions(options),
    });
  }

  delete(namespace, options = {}) {
    return this.client.request(`/orgs/${pathValue(namespace, 'namespace')}`, {
      method: 'DELETE',
      responseType: 'none',
      ...requestOptions(options),
    });
  }

  listOwners(namespace, options = {}) {
    return this.client.request(`/orgs/${pathValue(namespace, 'namespace')}/owners`, {
      ...requestOptions(options),
    });
  }

  addOwner(namespace, ownerNamespace, options = {}) {
    return this.client.request(
      `/orgs/${pathValue(namespace, 'namespace')}/owners/${pathValue(ownerNamespace, 'owner namespace')}`,
      {
        method: 'PUT',
        responseType: 'none',
        ...requestOptions(options),
      },
    );
  }

  removeOwner(namespace, ownerNamespace, options = {}) {
    return this.client.request(
      `/orgs/${pathValue(namespace, 'namespace')}/owners/${pathValue(ownerNamespace, 'owner namespace')}`,
      {
        method: 'DELETE',
        responseType: 'none',
        ...requestOptions(options),
      },
    );
  }

  listExtensions(namespace, query = {}) {
    return this.client.request(`/orgs/${pathValue(namespace, 'namespace')}/extensions`, {
      query: pickQuery(query, EXTENSION_KEYS),
      ...requestOptions(query),
    });
  }
}
