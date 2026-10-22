// A blob is fetched by its bare sha256 hex digest, the same value a version's
// dist.digest carries after the sha256: prefix. The response is a Blob so the
// caller decides whether to save, hash, or read it as text.

import { pathValue, requestOptions } from '../paths.js';

export class BlobsResource {
  constructor(client) {
    this.client = client;
  }

  get(digest, options = {}) {
    return this.client.request(`/blobs/${pathValue(digest, 'blob digest')}`, {
      responseType: 'blob',
      ...requestOptions(options),
    });
  }
}
