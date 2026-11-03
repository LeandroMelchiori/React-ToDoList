import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import type { AccountConfig } from './accountConfig';
import { AccountApiError, accountErrorMessage, createAccountApi } from './accountApi';
import type { AccountProfile, Enrollment } from './accountApi';

type State = { identity: string; status: 'loading' | 'invite' | 'ready' | 'error'; profile?: AccountProfile; message?: string };

export function AccountWorkspace({ config, onLocal }: { config: AccountConfig; onLocal: () => void }) {
  const auth = useAuth0();
  const identity = auth.isAuthenticated ? auth.user?.sub ?? '' : '';
  const api = React.useMemo(() => createAccountApi(config.apiUrl, () => auth.getAccessTokenSilently()), [config.apiUrl, auth.getAccessTokenSilently]);
  const [state, setState] = React.useState<State>({ identity: '', status: 'loading' });
  const [attempt, retry] = React.useReducer(value => value + 1, 0);
  const [actionError, setActionError] = React.useState('');
  const [openingLogin, setOpeningLogin] = React.useState(false);
  const loginPending = React.useRef(false);
  const activeRequest = React.useRef<AbortController | null>(null);
  const heading = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => { heading.current?.focus(); }, []);
  React.useEffect(() => {
    if (!auth.isLoading && auth.error && /[?&](code|error)=/.test(window.location.search)) window.history.replaceState(null, '', '/account');
  }, [auth.isLoading, auth.error]);
  React.useEffect(() => {
    const controller = new AbortController();
    activeRequest.current?.abort();
    activeRequest.current = controller;
    setActionError('');
    if (!identity || auth.isLoading) return () => controller.abort();
    setState({ identity, status: 'loading' });
    void api.me(controller.signal).then(profile => {
      if (!controller.signal.aborted) setState({ identity, status: 'ready', profile });
    }).catch(error => {
      if (controller.signal.aborted) return;
      if (error instanceof AccountApiError && error.code === 'invitation_required') setState({ identity, status: 'invite' });
      else setState({ identity, status: 'error', message: accountErrorMessage(error) });
    });
    return () => controller.abort();
  }, [identity, auth.isLoading, api, attempt]);

  const login = async (method: 'google' | 'email') => {
    if (loginPending.current) return;
    loginPending.current = true;
    setOpeningLogin(true);
    setActionError('');
    try { await auth.loginWithRedirect({ authorizationParams: { connection: method === 'google' ? 'google-oauth2' : config.databaseConnection } }); }
    catch { setActionError('No se pudo abrir el acceso. Intentá de nuevo.'); }
    finally { loginPending.current = false; setOpeningLogin(false); }
  };
  const logout = async () => {
    activeRequest.current?.abort();
    setState({ identity: '', status: 'loading' });
    try { await auth.logout({ logoutParams: { returnTo: `${window.location.origin}/account` } }); }
    catch { setState({ identity, status: 'error', message: 'No se pudo cerrar la sesión. Intentá de nuevo.' }); }
  };
  const current = state.identity === identity ? state : { identity, status: 'loading' as const };
  React.useEffect(() => { if (current.status === 'ready') heading.current?.focus(); }, [current.status]);
  return <main className="AccountPage"><section className="AccountCard" aria-labelledby="account-title">
    <p className="AccountEyebrow">TaskFlow · acceso privado</p>
    <h1 id="account-title" ref={heading} tabIndex={-1}>{current.status === 'ready' && current.profile ? `Hola, ${current.profile.displayName}` : 'Tu espacio empieza acá'}</h1>
    {auth.isLoading ? <p role="status">Comprobando tu sesión…</p> : !auth.isAuthenticated ? <>
      <p>Entrá con Google o con tu email y contraseña. Para activar tu cuenta vas a necesitar una invitación.</p>
      <div className="AccountActions"><button className="AccountPrimary" disabled={openingLogin} onClick={() => void login('google')} type="button">Continuar con Google</button>
        <button disabled={openingLogin} onClick={() => void login('email')} type="button">Entrar con email y contraseña</button></div>
      {openingLogin && <p role="status">Abriendo el acceso seguro…</p>}
      <p className="AccountMuted">La creación de tu acceso, verificación de email y recuperación de contraseña se hacen en la pantalla segura del proveedor.</p>
    </> : <>
      {current.status === 'loading' && <p role="status">Cargando tu cuenta…</p>}
      {current.status === 'invite' && <EnrollmentForm key={identity} name={auth.user?.name ?? ''} onSubmit={async (data, operationId) => {
        const controller = new AbortController();
        activeRequest.current?.abort(); activeRequest.current = controller;
        const profile = await api.redeem(data, operationId, controller.signal);
        if (!controller.signal.aborted) setState({ identity, status: 'ready', profile });
      }} />}
      {current.status === 'ready' && current.profile && <>
        <p className="AccountSuccess" role="status">Tu cuenta privada está activa.</p>
        <dl><div><dt>Usuario</dt><dd>@{current.profile.handle}</dd></div><div><dt>Zona horaria</dt><dd>{current.profile.timeZone}</dd></div></dl>
        <p>Tu calendario personal ya está creado. Por ahora, las tareas de este navegador siguen guardadas solo en este dispositivo.</p>
      </>}
      {current.status === 'error' && <><p role="alert" className="AccountError">{current.message}</p><button type="button" onClick={retry}>Volver a consultar mi cuenta</button></>}
      <button type="button" onClick={() => void logout()}>Cerrar sesión</button>
    </>}
    {(actionError || auth.error) && <p className="AccountError" role="alert">{actionError || 'El acceso no se completó. Podés intentar de nuevo.'}</p>}
    <footer><button className="AccountLocal" type="button" onClick={onLocal}>Volver a mi agenda local</button>
      <p className="AccountMuted">Entrar a tu cuenta no sube ni reemplaza tu agenda local.</p></footer>
  </section></main>;
}

function EnrollmentForm({ name, onSubmit }: { name: string; onSubmit: (data: Enrollment, operationId: string) => Promise<void> }) {
  const [token, setToken] = React.useState('');
  const [handle, setHandle] = React.useState('');
  const [displayName, setName] = React.useState(name);
  const [timeZone, setZone] = React.useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const errorRef = React.useRef<HTMLParagraphElement>(null);
  const operation = React.useRef<{ fingerprint: string; id: string } | null>(null);
  const pending = React.useRef(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending.current) return;
    const data = { token: token.trim(), handle, displayName: displayName.trim(), timeZone: timeZone.trim() };
    let message = '';
    if (!/^[A-Za-z0-9_-]{43}$/.test(data.token)) message = 'Pegá el código de invitación completo.';
    else if (!/^[a-z0-9_]{3,32}$/.test(handle)) message = 'Usá entre 3 y 32 letras minúsculas, números o guion bajo para tu usuario.';
    else if (!data.displayName || data.displayName.length > 100) message = 'Escribí un nombre de hasta 100 caracteres.';
    else { try { new Intl.DateTimeFormat('es', { timeZone: data.timeZone }).format(); } catch { message = 'Revisá la zona horaria.'; } }
    if (message) { setError(message); queueMicrotask(() => errorRef.current?.focus()); return; }
    const fingerprint = JSON.stringify(data);
    if (operation.current?.fingerprint !== fingerprint) operation.current = { fingerprint, id: crypto.randomUUID() };
    pending.current = true; setSaving(true); setError('');
    try { await onSubmit(data, operation.current!.id); }
    catch (failure) {
      if (failure instanceof DOMException && failure.name === 'AbortError') return;
      setError(accountErrorMessage(failure)); queueMicrotask(() => errorRef.current?.focus());
    } finally { pending.current = false; setSaving(false); }
  };
  return <form className="EnrollmentForm" onSubmit={submit} noValidate>
    <h2>Activá tu cuenta con una invitación</h2><p>El código debe estar dirigido al email verificado con el que acabás de entrar.</p>
    <label>Código de invitación<input disabled={saving} type="password" autoComplete="off" value={token} onChange={event => setToken(event.target.value)} spellCheck={false} required /></label>
    <label>Nombre de usuario<input disabled={saving} value={handle} onChange={event => setHandle(event.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={32} required /></label>
    <label>Tu nombre<input disabled={saving} value={displayName} onChange={event => setName(event.target.value)} autoComplete="name" maxLength={100} required /></label>
    <label>Zona horaria<input disabled={saving} value={timeZone} onChange={event => setZone(event.target.value)} placeholder="America/Argentina/Buenos_Aires" required /></label>
    {error && <p className="AccountError" role="alert" ref={errorRef} tabIndex={-1}>{error}</p>}
    <button className="AccountPrimary" disabled={saving} type="submit">{saving ? 'Activando cuenta…' : 'Activar mi cuenta'}</button>
  </form>;
}
