import { loadCmsEnv, requiredEnv } from './env.mjs';

export class DirectusClient {
  constructor({ url, token }) {
    this.url = url.replace(/\/$/, '');
    this.token = token;
  }

  async request(pathname, options = {}) {
    const response = await fetch(`${this.url}${pathname}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...options.headers,
      },
    });
    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    if (!response.ok) {
      const detail = body?.errors?.map((error) => error.message).join('; ') || response.statusText;
      const error = new Error(`${options.method ?? 'GET'} ${pathname}: ${response.status} ${detail}`);
      error.status = response.status;
      error.body = body;
      throw error;
    }
    return body?.data ?? body;
  }

  get(pathname) { return this.request(pathname); }
  post(pathname, payload) { return this.request(pathname, { method: 'POST', body: JSON.stringify(payload) }); }
  patch(pathname, payload) { return this.request(pathname, { method: 'PATCH', body: JSON.stringify(payload) }); }
  delete(pathname) { return this.request(pathname, { method: 'DELETE' }); }
}

export async function createAdminClient() {
  loadCmsEnv();
  const url = requiredEnv('CMS_URL');
  const staticToken = process.env.DIRECTUS_ADMIN_TOKEN?.trim();
  if (staticToken) return new DirectusClient({ url, token: staticToken });

  const anonymous = new DirectusClient({ url });
  const auth = await anonymous.post('/auth/login', {
    email: requiredEnv('DIRECTUS_ADMIN_EMAIL'),
    password: requiredEnv('DIRECTUS_ADMIN_PASSWORD'),
  });
  return new DirectusClient({ url, token: auth.access_token });
}

export async function createTokenClient(tokenName = 'CMS_BUILD_TOKEN') {
  loadCmsEnv();
  return new DirectusClient({ url: requiredEnv('CMS_URL'), token: requiredEnv(tokenName) });
}

