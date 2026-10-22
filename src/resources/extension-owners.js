// Co-ownership is invite-then-accept. The path is anchored at the extension,
// and an organization can be either the owner or the invitee.

import { extensionPath, pathValue, requestOptions } from '../paths.js';

export class ExtensionOwnersResource {
  constructor(client) {
    this.client = client;
  }

  list(namespace, id, options = {}) {
    return this.client.request(`${extensionPath(namespace, id)}/owners`, {
      ...requestOptions(options),
    });
  }

  listInvites(namespace, id, options = {}) {
    return this.client.request(`${extensionPath(namespace, id)}/owners/pending`, {
      ...requestOptions(options),
    });
  }

  invite(namespace, id, ownerNamespace, options = {}) {
    return this.client.request(ownerPath(namespace, id, ownerNamespace), {
      method: 'PUT',
      responseType: 'none',
      ...requestOptions(options),
    });
  }

  remove(namespace, id, ownerNamespace, options = {}) {
    return this.client.request(ownerPath(namespace, id, ownerNamespace), {
      method: 'DELETE',
      responseType: 'none',
      ...requestOptions(options),
    });
  }

  accept(namespace, id, ownerNamespace, options = {}) {
    return this.client.request(`${ownerPath(namespace, id, ownerNamespace)}/accept`, {
      method: 'POST',
      ...requestOptions(options),
    });
  }
}

function ownerPath(namespace, id, ownerNamespace) {
  const owner = pathValue(ownerNamespace, 'owner namespace');
  return `${extensionPath(namespace, id)}/owners/${owner}`;
}
