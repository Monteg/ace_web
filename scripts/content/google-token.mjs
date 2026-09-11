import { createSign } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const base64url = (value) => Buffer.from(value).toString('base64url');

export async function googleToken(scopes) {
  const source = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!source) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not configured');
  const raw = source.trim().startsWith('{') ? source : await readFile(source, 'utf8');
  const account = JSON.parse(raw);
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64url(JSON.stringify({
    iss: account.client_email,
    scope: scopes.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claim}`);
  const assertion = `${header}.${claim}.${signer.sign(account.private_key, 'base64url')}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  if (!response.ok) throw new Error(`Google OAuth failed: ${response.status} ${await response.text()}`);
  return { token: (await response.json()).access_token, account };
}
