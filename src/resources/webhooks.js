// Webhooks share a shape but not a path. The account, organization, and
// extension variants each build their own base path and keep the same methods,
// so callers do not have to remember which owner type they are using.

import { extensionPath, pathValue, pickQuery, requestOptions } from '../paths.js';

const PAGE_KEYS = ['cursor', 'limit', 'dir'];

export class AccountWebhooksResource {
  constructor(client) {
    this.client = client;
  }

  list(namespace, options = {}) {
    return listWebhooks(this.client, `${accountBase(namespace)}/webhooks`, options);
  }

  create(namespace, payload, options = {}) {
    return createWebhook(this.client, `${accountBase(namespace)}/webhooks`, payload, options);
  }

  delete(namespace, webhookId, options = {}) {
    return deleteWebhook(
      this.client,
      `${accountBase(namespace)}/webhooks/${pathValue(webhookId, 'webhook id')}`,
      options,
    );
  }

  listDeliveries(namespace, webhookId, query = {}) {
    return listWebhookDeliveries(
      this.client,
      deliveryPath(accountBase(namespace), webhookId),
      query,
    );
  }

  redeliver(namespace, webhookId, deliveryId, options = {}) {
    return redeliverWebhook(
      this.client,
      `${deliveryPath(accountBase(namespace), webhookId)}/${pathValue(deliveryId, 'delivery id')}/redeliver`,
      options,
    );
  }
}

export class OrganizationWebhooksResource {
  constructor(client) {
    this.client = client;
  }

  list(namespace, options = {}) {
    return listWebhooks(this.client, `${organizationBase(namespace)}/webhooks`, options);
  }

  create(namespace, payload, options = {}) {
    return createWebhook(this.client, `${organizationBase(namespace)}/webhooks`, payload, options);
  }

  delete(namespace, webhookId, options = {}) {
    return deleteWebhook(
      this.client,
      `${organizationBase(namespace)}/webhooks/${pathValue(webhookId, 'webhook id')}`,
      options,
    );
  }

  listDeliveries(namespace, webhookId, query = {}) {
    return listWebhookDeliveries(
      this.client,
      deliveryPath(organizationBase(namespace), webhookId),
      query,
    );
  }

  redeliver(namespace, webhookId, deliveryId, options = {}) {
    return redeliverWebhook(
      this.client,
      `${deliveryPath(organizationBase(namespace), webhookId)}/${pathValue(deliveryId, 'delivery id')}/redeliver`,
      options,
    );
  }
}

export class ExtensionWebhooksResource {
  constructor(client) {
    this.client = client;
  }

  list(namespace, id, options = {}) {
    return listWebhooks(this.client, `${extensionBase(namespace, id)}/webhooks`, options);
  }

  create(namespace, id, payload, options = {}) {
    return createWebhook(this.client, `${extensionBase(namespace, id)}/webhooks`, payload, options);
  }

  delete(namespace, id, webhookId, options = {}) {
    return deleteWebhook(
      this.client,
      `${extensionBase(namespace, id)}/webhooks/${pathValue(webhookId, 'webhook id')}`,
      options,
    );
  }

  listDeliveries(namespace, id, webhookId, query = {}) {
    return listWebhookDeliveries(
      this.client,
      deliveryPath(extensionBase(namespace, id), webhookId),
      query,
    );
  }

  redeliver(namespace, id, webhookId, deliveryId, options = {}) {
    return redeliverWebhook(
      this.client,
      `${deliveryPath(extensionBase(namespace, id), webhookId)}/${pathValue(deliveryId, 'delivery id')}/redeliver`,
      options,
    );
  }
}

function accountBase(namespace) {
  return `/users/${pathValue(namespace, 'namespace')}`;
}

function organizationBase(namespace) {
  return `/orgs/${pathValue(namespace, 'namespace')}`;
}

function extensionBase(namespace, id) {
  return extensionPath(namespace, id);
}

function deliveryPath(base, webhookId) {
  return `${base}/webhooks/${pathValue(webhookId, 'webhook id')}/deliveries`;
}

function listWebhooks(client, path, options) {
  return client.request(path, requestOptions(options));
}

function createWebhook(client, path, payload, options) {
  return client.request(path, {
    method: 'POST',
    json: {
      url: payload.url,
      events: payload.events,
      active: payload.active,
    },
    ...requestOptions(options),
  });
}

function deleteWebhook(client, path, options) {
  return client.request(path, {
    method: 'DELETE',
    responseType: 'none',
    ...requestOptions(options),
  });
}

function listWebhookDeliveries(client, path, query) {
  return client.request(path, {
    query: pickQuery(query, PAGE_KEYS),
    ...requestOptions(query),
  });
}

function redeliverWebhook(client, path, options) {
  return client.request(path, {
    method: 'POST',
    ...requestOptions(options),
  });
}
