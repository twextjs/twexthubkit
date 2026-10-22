// Dist-tags map a mutable name (next, beta) to an already-published version.
// The implicit latest tag is handled by the API and cannot be set here.

import { extensionPath, pathValue, requestOptions } from '../paths.js';

export class ExtensionTagsResource {
  constructor(client) {
    this.client = client;
  }

  get(namespace, id, options = {}) {
    return this.client.request(`${extensionPath(namespace, id)}/tags`, {
      ...requestOptions(options)
    });
  }

  set(namespace, id, tag, version, options = {}) {
    return this.client.request(tagPath(namespace, id, tag), {
      method: 'PUT',
      json: { version },
      responseType: 'none',
      ...requestOptions(options)
    });
  }

  delete(namespace, id, tag, options = {}) {
    return this.client.request(tagPath(namespace, id, tag), {
      method: 'DELETE',
      responseType: 'none',
      ...requestOptions(options)
    });
  }
}

function tagPath(namespace, id, tag) {
  return `${extensionPath(namespace, id)}/tags/${pathValue(tag, 'tag')}`;
}
