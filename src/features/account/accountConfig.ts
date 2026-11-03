export interface AccountConfig {
  domain: string;
  clientId: string;
  audience: string;
  apiUrl: string;
  databaseConnection: string;
}

export function readAccountConfig(env: Record<string, unknown>): AccountConfig | null {
  const value = (key: string) => typeof env[key] === 'string' ? (env[key] as string).trim() : '';
  const domain = value('VITE_AUTH0_DOMAIN');
  const clientId = value('VITE_AUTH0_CLIENT_ID');
  const audience = value('VITE_AUTH0_AUDIENCE');
  try {
    const auth = new URL(`https://${domain}`);
    const api = new URL(value('VITE_TASKFLOW_API_URL'));
    const local = ['127.0.0.1', 'localhost', '[::1]'].includes(api.hostname);
    if (!domain || auth.host !== domain || auth.pathname !== '/' || auth.search || auth.hash || auth.username || auth.password ||
      !clientId || !audience || (api.protocol !== 'https:' && !(api.protocol === 'http:' && local)) ||
      api.username || api.password || api.search || api.hash || !api.pathname.replace(/\/$/, '').endsWith('/api/v1')) return null;
    return { domain, clientId, audience, apiUrl: api.href.replace(/\/$/, ''),
      databaseConnection: value('VITE_AUTH0_DATABASE_CONNECTION') || 'Username-Password-Authentication' };
  } catch { return null; }
}
