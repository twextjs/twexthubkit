// Automation token management. The token secret appears only in the create
// response, so it is returned untouched and never stored by the client.

import { pathValue, pickQuery, requestOptions } from '../paths.js';

export class TokensResource {
  constructor(client) {
    this.client = client;
  }

  list(query = {}) {
    return this.client.request('/tokens', {
      query: pickQuery(query, ['namespace', 'cursor', 'limit', 'dir']),
      ...requestOptions(query),
    });
  }

  create(payload, options = {}) {
    return this.client.request('/tokens', {
      method: 'POST',
      json: {
        name: payload.name,
        scopes: payload.scopes,
        expiresInDays: payload.expiresInDays,
      },
      ...requestOptions(options),
    });
  }

  update(id, payload, options = {}) {
    return this.client.request(`/tokens/${pathValue(id, 'token id')}`, {
      method: 'PATCH',
      json: { name: payload.name, scopes: payload.scopes },
      ...requestOptions(options),
    });
  }

  delete(id, options = {}) {
    return this.client.request(`/tokens/${pathValue(id, 'token id')}`, {
      method: 'DELETE',
      responseType: 'none',
      ...requestOptions(options),
    });
  }

  revokeCurrent(options = {}) {
    return this.client.request('/tokens/current', {
      method: 'DELETE',
      responseType: 'none',
      ...requestOptions(options),
    });
  }
}
