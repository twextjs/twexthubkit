// The public catalog plus the groups that hang off one extension. Search and
// trending are discovery endpoints but belong here because they return the
// same summary rows as list().

import { extensionPath, pickQuery, requestOptions } from '../paths.js';
import { ExtensionOwnersResource } from './extension-owners.js';
import { ExtensionTagsResource } from './extension-tags.js';
import { ExtensionTransfersResource } from './extension-transfers.js';
import { ExtensionVersionsResource } from './extension-versions.js';
import { ExtensionWebhooksResource } from './webhooks.js';

const LIST_KEYS = ['sort', 'license', 'namespace', 'cursor', 'limit', 'dir'];
const SEARCH_KEYS = ['sort', 'license', 'cursor', 'limit', 'dir'];

export class ExtensionsResource {
  constructor(client) {
    this.client = client;
    this.versions = new ExtensionVersionsResource(client);
    this.tags = new ExtensionTagsResource(client);
    this.owners = new ExtensionOwnersResource(client);
    this.transfers = new ExtensionTransfersResource(client);
    this.webhooks = new ExtensionWebhooksResource(client);
  }

  list(query = {}) {
    return this.client.request('/extensions', {
      query: pickQuery(query, LIST_KEYS),
      ...requestOptions(query),
    });
  }

  search(text, options = {}) {
    return this.client.request('/search', {
      query: {
        query: text,
        ...pickQuery(options, SEARCH_KEYS),
      },
      ...requestOptions(options),
    });
  }

  trending(options = {}) {
    return this.client.request('/extensions/trending', {
      query: pickQuery(options, ['limit']),
      ...requestOptions(options),
    });
  }

  get(namespace, id, options = {}) {
    return this.client.request(extensionPath(namespace, id), requestOptions(options));
  }

  delete(namespace, id, options = {}) {
    return this.client.request(extensionPath(namespace, id), {
      method: 'DELETE',
      responseType: 'none',
      ...requestOptions(options),
    });
  }
}
