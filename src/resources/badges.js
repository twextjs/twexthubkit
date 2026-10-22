// Badge endpoints serve SVG text, not JSON. They are kept separate from the
// extensions group because the return type and query are different.

import { extensionPath, pickQuery, requestOptions } from '../paths.js';

export class BadgesResource {
  constructor(client) {
    this.client = client;
  }

  get(namespace, id, options = {}) {
    return this.client.request(`/badge${extensionPath(namespace, id)}`, {
      query: pickQuery(options, ['label']),
      responseType: 'text',
      ...requestOptions(options),
    });
  }

  getField(namespace, id, field, options = {}) {
    return this.client.request(
      `/badge${extensionPath(namespace, id)}/${encodeURIComponent(field)}`,
      {
        query: pickQuery(options, ['label']),
        responseType: 'text',
        ...requestOptions(options),
      },
    );
  }
}
