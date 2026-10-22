// Reports filed by the caller. The owner view deliberately hides the report's
// text and reviewer details; only the admin endpoints expose the full record.

import { pathValue, pickQuery, requestOptions } from '../paths.js';

export class ReportsResource {
  constructor(client) {
    this.client = client;
  }

  create(payload, options = {}) {
    return this.client.request('/reports', {
      method: 'POST',
      json: {
        targetType: payload.targetType,
        targetNamespace: payload.targetNamespace,
        targetExtensionId: payload.targetExtensionId,
        reason: payload.reason,
        description: payload.description
      },
      ...requestOptions(options)
    });
  }

  list(query = {}) {
    return this.client.request('/reports', {
      query: pickQuery(query, ['cursor', 'limit', 'dir']),
      ...requestOptions(query)
    });
  }

  get(id, options = {}) {
    return this.client.request(`/reports/${pathValue(id, 'report id')}`, {
      ...requestOptions(options)
    });
  }
}
