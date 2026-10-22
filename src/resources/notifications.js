// The caller's notification inbox. The API accepts either a list of ids or the
// single all:true form, so the payload is passed through as one of those two.

import { pathValue, pickQuery, requestOptions } from '../paths.js';

export class NotificationsResource {
  constructor(client) {
    this.client = client;
  }

  list(query = {}) {
    return this.client.request('/notifications', {
      query: pickQuery(query, ['unread', 'cursor', 'limit', 'dir']),
      ...requestOptions(query)
    });
  }

  markRead(payload, options = {}) {
    const body =
      payload.all === true
        ? { all: true }
        : { ids: payload.ids.map(function (id) { return Number(id); }) };
    return this.client.request('/notifications', {
      method: 'PATCH',
      json: body,
      ...requestOptions(options)
    });
  }

  markOneRead(id, options = {}) {
    return this.client.request(`/notifications/${pathValue(id, 'notification id')}`, {
      method: 'PATCH',
      ...requestOptions(options)
    });
  }
}
