// Public information about the instance itself: product metadata, counters,
// legal documents, and the Atom feed. None of it needs a token.

import { requestOptions } from '../paths.js';

export class InstanceResource {
  constructor(client) {
    this.client = client;
  }

  meta(options = {}) {
    return this.client.request('/meta', requestOptions(options));
  }

  stats(options = {}) {
    return this.client.request('/stats', requestOptions(options));
  }

  terms(options = {}) {
    return this.client.request('/terms', requestOptions(options));
  }

  privacy(options = {}) {
    return this.client.request('/privacy', requestOptions(options));
  }

  atomFeed(options = {}) {
    return this.client.request('/feed.atom', {
      responseType: 'text',
      ...requestOptions(options)
    });
  }
}
