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
      ...requestOptions(query),
    });
  }

  markRead(payload, options = {}) {
    let body;
    if (payload.all === true) {
      body = { all: true };
    } else {
      if (!Array.isArray(payload.ids)) {
        throw new TypeError('notification ids must be an array of integers');
      }
      const ids = Array.from(payload.ids, function (id) {
        const value = Number(id);
        if (!Number.isInteger(value)) {
          throw new TypeError('notification ids must be integers');
        }
        return value;
      });
      body = { ids };
    }
    return this.client.request('/notifications', {
      method: 'PATCH',
      json: body,
      ...requestOptions(options),
    });
  }

  markOneRead(id, options = {}) {
    return this.client.request(`/notifications/${pathValue(id, 'notification id')}`, {
      method: 'PATCH',
      ...requestOptions(options),
    });
  }
}
