// The caller's notification inbox. The API accepts either a list of ids or the
// single all:true form, so the payload is passed through as one of those two.

import { pathValue, pickQuery, requestOptions } from '../paths.js';

// Number() alone would turn true into 1 and '' into 0, so the accepted types are
// checked before conversion. Numbers and non-empty numeric strings only.
function toNotificationId(id) {
  const isNumber = typeof id === 'number';
  const isNumericString = typeof id === 'string' && id.trim() !== '' && !Number.isNaN(Number(id));
  if (!isNumber && !isNumericString) {
    throw new TypeError('notification ids must be integers');
  }
  const value = Number(id);
  if (!Number.isInteger(value)) {
    throw new TypeError('notification ids must be integers');
  }
  return value;
}

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
      const ids = Array.from(payload.ids, toNotificationId);
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
