// Extension versions: list, inspect, publish, review, yank/delete, and fetch
// the compiled blob or the retained source. Publish takes the gzipped project
// tarball exactly as the API expects it, with no multipart wrapper.

import { extensionPath, pathValue, pickQuery, requestOptions } from '../paths.js';

export class ExtensionVersionsResource {
  constructor(client) {
    this.client = client;
  }

  list(namespace, id, query = {}) {
    return this.client.request(`${extensionPath(namespace, id)}/versions`, {
      query: pickQuery(query, ['range', 'status', 'cursor', 'limit', 'dir']),
      ...requestOptions(query)
    });
  }

  get(namespace, id, version, options = {}) {
    return this.client.request(versionPath(namespace, id, version), {
      ...requestOptions(options)
    });
  }

  publish(namespace, id, tarball, options = {}) {
    if (tarball === undefined || tarball === null) {
      throw new TypeError('A gzipped project tarball is required');
    }
    return this.client.request(`${extensionPath(namespace, id)}/versions`, {
      method: 'POST',
      body: tarball,
      contentType: options.contentType ?? 'application/gzip',
      ...requestOptions(options)
    });
  }

  review(namespace, id, version, payload, options = {}) {
    const body =
      payload.status !== undefined
        ? { status: payload.status, reason: payload.reason }
        : { deprecationMessage: payload.deprecationMessage };
    return this.client.request(versionPath(namespace, id, version), {
      method: 'PATCH',
      json: body,
      ...requestOptions(options)
    });
  }

  delete(namespace, id, version, options = {}) {
    return this.client.request(versionPath(namespace, id, version), {
      method: 'DELETE',
      responseType: 'none',
      ...requestOptions(options)
    });
  }

  source(namespace, id, version, options = {}) {
    return this.client.request(`${versionPath(namespace, id, version)}/source`, {
      responseType: 'blob',
      ...requestOptions(options)
    });
  }

  download(namespace, id, version, options = {}) {
    return this.client.request(`${versionPath(namespace, id, version)}/download`, {
      responseType: 'blob',
      ...requestOptions(options)
    });
  }
}

function versionPath(namespace, id, version) {
  return `${extensionPath(namespace, id)}/versions/${pathValue(version, 'version')}`;
}
