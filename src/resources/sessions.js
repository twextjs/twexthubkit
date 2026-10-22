// Session sign-in and management. Signing in returns the token but does not
// install it on the client; callers opt in with setToken().

import { pathValue, pickQuery, requestOptions } from '../paths.js';

export class SessionsResource {
  constructor(client) {
    this.client = client;
  }

  create(payload, options = {}) {
    return this.client.request('/sessions', {
      method: 'POST',
      json: { namespace: payload.namespace, password: payload.password },
      ...requestOptions(options),
    });
  }

  list(query = {}) {
    return this.client.request('/sessions', {
      query: pickQuery(query, ['namespace', 'cursor', 'limit', 'dir']),
      ...requestOptions(query),
    });
  }

  revokeCurrent(options = {}) {
    return this.client.request('/sessions/current', {
      method: 'DELETE',
      responseType: 'none',
      ...requestOptions(options),
    });
  }

  delete(id, options = {}) {
    return this.client.request(`/sessions/${pathValue(id, 'session id')}`, {
      method: 'DELETE',
      responseType: 'none',
      ...requestOptions(options),
    });
  }
}
