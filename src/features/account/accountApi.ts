export interface AccountProfile { id: string; handle: string; displayName: string; timeZone: string }
export interface Enrollment { token: string; handle: string; displayName: string; timeZone: string }
export class AccountApiError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}

function profile(value: unknown): AccountProfile {
  const item = value as Partial<AccountProfile> | null;
  if (!item || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(String(item.id)) ||
    typeof item.handle !== 'string' || !/^[a-z0-9_]{3,32}$/.test(item.handle) ||
    typeof item.displayName !== 'string' || !item.displayName.trim() || typeof item.timeZone !== 'string' || !item.timeZone) {
    throw new AccountApiError(502, 'invalid_response');
  }
  return { id: item.id!, handle: item.handle, displayName: item.displayName, timeZone: item.timeZone };
}

export function createAccountApi(apiUrl: string, getToken: () => Promise<string | undefined>) {
  async function request(path: string, signal: AbortSignal, init: RequestInit = {}) {
    const token = await getToken();
    signal.throwIfAborted();
    if (!token) throw new AccountApiError(401, 'unauthorized');
    const response = await fetch(`${apiUrl}${path}`, { ...init, signal, credentials: 'omit', cache: 'no-store', redirect: 'error',
      headers: { ...init.headers, Authorization: `Bearer ${token}` } });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const code = body && typeof body === 'object' && 'code' in body && typeof body.code === 'string' ? body.code : 'request_failed';
      throw new AccountApiError(response.status, code);
    }
    return profile(body);
  }
  return {
    me: (signal: AbortSignal) => request('/me', signal),
    redeem: (data: Enrollment, operationId: string, signal: AbortSignal) => request('/account/invitations/redeem', signal, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': operationId }, body: JSON.stringify(data),
    }),
  };
}

export function accountErrorMessage(error: unknown): string {
  if (error instanceof AccountApiError) {
    if (error.status === 401) return 'La sesión venció. Volvé a iniciar sesión.';
    if (error.code === 'verified_email_required') return 'Verificá tu email con el enlace del proveedor y volvé a iniciar sesión.';
    if (error.code === 'invalid_invitation') return 'La invitación no está disponible para esta cuenta. Revisá el código, el email y su vencimiento.';
    if (error.status === 409) return 'La cuenta o el nombre de usuario ya existe. Revisá tus datos o volvé a consultar tu cuenta.';
    if (error.status === 422) return 'Revisá el código, el nombre de usuario y la zona horaria.';
  }
  return 'No pudimos conectar con tu cuenta. Comprobá tu conexión e intentá de nuevo.';
}
