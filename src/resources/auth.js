// Everything under /auth: the sign-in descriptor, OIDC linking and exchange,
// and the WebAuthn/MFA ceremonies. Passkey payloads are passed through as the
// browser produced them; this module does not inspect PublicKeyCredential.

import { pickQuery, requestOptions } from '../paths.js';

export class AuthResource {
  constructor(client) {
    this.client = client;
  }

  describe(options = {}) {
    return this.client.request('/auth', requestOptions(options));
  }

  getOidcAuthorizeUrl(options = {}) {
    return this.client.request('/auth/oidc/authorize', {
      query: pickQuery(options, ['returnTo']),
      ...requestOptions(options)
    });
  }

  async oidcCallback(params, options = {}) {
    const response = await this.client.raw('/auth/oidc/callback', {
      query: pickQuery(params, ['code', 'state', 'error']),
      responseType: 'raw',
      redirect: 'manual',
      ...requestOptions(options)
    });

    if (response.type === 'opaqueredirect') {
      return { redirectUrl: null };
    }
    if (response.status >= 300 && response.status < 400) {
      return { redirectUrl: response.headers.get('location') };
    }
    const text = await response.text();
    return text === '' ? undefined : JSON.parse(text);
  }

  exchangeOidcCode(payload, options = {}) {
    return this.client.request('/auth/oidc/exchange', {
      method: 'POST',
      json: { code: payload.code },
      ...requestOptions(options)
    });
  }

  linkOidc(options = {}) {
    return this.client.request('/auth/oidc/link', {
      method: 'POST',
      json: { returnTo: options.returnTo },
      ...requestOptions(options)
    });
  }

  listOidcIdentities(options = {}) {
    return this.client.request('/auth/oidc/identities', requestOptions(options));
  }

  deleteOidcIdentity(id, options = {}) {
    return this.client.request(`/auth/oidc/identities/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      responseType: 'none',
      ...requestOptions(options)
    });
  }

  getMfaState(options = {}) {
    return this.client.request('/auth/mfa', requestOptions(options));
  }

  createPasskeyOptions(options = {}) {
    return this.client.request('/auth/mfa/passkeys/options', {
      method: 'POST',
      ...requestOptions(options)
    });
  }

  registerPasskey(payload, options = {}) {
    return this.client.request('/auth/mfa/passkeys', {
      method: 'POST',
      json: { response: payload.response, label: payload.label },
      ...requestOptions(options)
    });
  }

  renamePasskey(id, payload, options = {}) {
    return this.client.request(`/auth/mfa/passkeys/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      json: { label: payload.label },
      ...requestOptions(options)
    });
  }

  deletePasskey(id, options = {}) {
    return this.client.request(`/auth/mfa/passkeys/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      responseType: 'none',
      ...requestOptions(options)
    });
  }

  regenerateBackupCodes(options = {}) {
    return this.client.request('/auth/mfa/backup-codes', {
      method: 'POST',
      ...requestOptions(options)
    });
  }

  getSigninOptions(payload, options = {}) {
    return this.client.request('/auth/mfa/options', {
      method: 'POST',
      json: { mfaToken: payload.mfaToken },
      ...requestOptions(options)
    });
  }

  verifyMfa(payload, options = {}) {
    return this.client.request('/auth/mfa/verify', {
      method: 'POST',
      json: {
        mfaToken: payload.mfaToken,
        response: payload.response,
        backupCode: payload.backupCode
      },
      ...requestOptions(options)
    });
  }

  getReauthOptions(options = {}) {
    return this.client.request('/auth/mfa/reauth/options', {
      method: 'POST',
      ...requestOptions(options)
    });
  }

  reauth(payload, options = {}) {
    return this.client.request('/auth/mfa/reauth', {
      method: 'POST',
      json: { response: payload.response },
      ...requestOptions(options)
    });
  }
}
