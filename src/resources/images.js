// Avatar and banner endpoints are identical for accounts and organizations;
// only the path and the type of the profile returned after a write differ.
// The browser or Node fetch implementation handles the binary body.

import { pickQuery, requestOptions } from '../paths.js';

export class ImageResource {
  constructor(client, buildPath) {
    this.client = client;
    this.buildPath = buildPath;
  }

  get(namespace, options = {}) {
    return this.client.request(this.buildPath(namespace), {
      query: pickQuery(options, ['v']),
      responseType: 'blob',
      ...requestOptions(options)
    });
  }

  upload(namespace, data, options = {}) {
    if (data === undefined || data === null) {
      throw new TypeError('Image data is required');
    }
    const contentType = options.contentType ?? data.type ?? 'application/octet-stream';
    return this.client.request(this.buildPath(namespace), {
      method: 'PUT',
      body: data,
      contentType,
      query: pickQuery(options, ['v']),
      ...requestOptions(options)
    });
  }

  delete(namespace, options = {}) {
    return this.client.request(this.buildPath(namespace), {
      method: 'DELETE',
      query: pickQuery(options, ['v']),
      ...requestOptions(options)
    });
  }
}
