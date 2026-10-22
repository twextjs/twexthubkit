// Admin-only operations. The API also checks the account's role; a token with
// the admin scope is necessary but not sufficient, so this group does not try
// to predict authorization locally.

import { pathValue, pickQuery, requestOptions } from '../paths.js';

const PAGE_KEYS = ['cursor', 'limit', 'dir'];
const REPORT_KEYS = ['status', 'targetType', 'cursor', 'limit', 'dir'];

export class AdminResource {
  constructor(client) {
    this.client = client;
  }

  updateTerms(payload, options = {}) {
    return this.client.request('/admin/terms', {
      method: 'PATCH',
      json: { body: payload.body },
      ...requestOptions(options),
    });
  }

  updatePrivacy(payload, options = {}) {
    return this.client.request('/admin/privacy', {
      method: 'PATCH',
      json: { body: payload.body },
      ...requestOptions(options),
    });
  }

  listAudit(query = {}) {
    return this.client.request('/admin/audit', {
      query: pickQuery(query, PAGE_KEYS),
      ...requestOptions(query),
    });
  }

  getQuota(namespace, options = {}) {
    return this.client.request(`/admin/users/${pathValue(namespace, 'namespace')}/quota`, {
      ...requestOptions(options),
    });
  }

  setQuota(namespace, payload, options = {}) {
    return this.client.request(`/admin/users/${pathValue(namespace, 'namespace')}/quota`, {
      method: 'PATCH',
      json: { maxBlobBytes: payload.maxBlobBytes },
      ...requestOptions(options),
    });
  }

  getMetrics(options = {}) {
    return this.client.request('/admin/metrics', {
      responseType: 'text',
      ...requestOptions(options),
    });
  }

  getConfig(options = {}) {
    return this.client.request('/admin/config', requestOptions(options));
  }

  updateConfig(payload, options = {}) {
    return this.client.request('/admin/config', {
      method: 'PUT',
      json: { settings: payload.settings },
      ...requestOptions(options),
    });
  }

  broadcastNotification(payload, options = {}) {
    return this.client.request('/admin/notifications', {
      method: 'POST',
      json: { message: payload.message },
      ...requestOptions(options),
    });
  }

  listReports(query = {}) {
    return this.client.request('/admin/reports', {
      query: pickQuery(query, REPORT_KEYS),
      ...requestOptions(query),
    });
  }

  getReport(id, options = {}) {
    return this.client.request(`/admin/reports/${pathValue(id, 'report id')}`, {
      ...requestOptions(options),
    });
  }

  decideReport(id, payload, options = {}) {
    return this.client.request(`/admin/reports/${pathValue(id, 'report id')}`, {
      method: 'PATCH',
      json: { status: payload.status, note: payload.note },
      ...requestOptions(options),
    });
  }

  listPendingVersions(query = {}) {
    return this.client.request('/versions', {
      query: {
        status: query.status ?? 'pending',
        ...pickQuery(query, PAGE_KEYS),
      },
      ...requestOptions(query),
    });
  }
}
