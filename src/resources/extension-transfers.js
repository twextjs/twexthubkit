// A transfer is an offer to move an extension to another namespace. It changes
// nothing until the destination accepts it.

import { extensionPath, pathValue, requestOptions } from '../paths.js';

export class ExtensionTransfersResource {
  constructor(client) {
    this.client = client;
  }

  list(namespace, id, options = {}) {
    return this.client.request(`${extensionPath(namespace, id)}/transfers`, {
      ...requestOptions(options)
    });
  }

  offer(namespace, id, to, options = {}) {
    return this.client.request(`${extensionPath(namespace, id)}/transfers`, {
      method: 'POST',
      json: { to },
      ...requestOptions(options)
    });
  }

  withdraw(namespace, id, toNamespace, options = {}) {
    return this.client.request(transferPath(namespace, id, toNamespace), {
      method: 'DELETE',
      responseType: 'none',
      ...requestOptions(options)
    });
  }

  accept(namespace, id, toNamespace, options = {}) {
    return this.client.request(`${transferPath(namespace, id, toNamespace)}/accept`, {
      method: 'POST',
      ...requestOptions(options)
    });
  }
}

function transferPath(namespace, id, toNamespace) {
  return `${extensionPath(namespace, id)}/transfers/${pathValue(toNamespace, 'destination namespace')}`;
}
