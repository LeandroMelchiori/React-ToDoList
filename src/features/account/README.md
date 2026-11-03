# account

Responsabilidad: Sesión y perfil de la cuenta actual.

`AccountEntry.tsx` integra el SDK oficial de Auth0; `AccountWorkspace.tsx` ofrece Google y email/contraseña mediante Universal Login, activación por invitación, perfil y logout. `accountConfig.ts` valida la configuración pública y `accountApi.ts` consume exclusivamente el contrato HTTP con Bearer en memoria y solicitudes cancelables. No importa servidor, composición ni persistencia local.

La composición abre `/account` y mantiene el modo local independiente. No se suben ni vinculan tareas al iniciar sesión. La configuración del tenant y las credenciales externas están pendientes; ver `docs/backend/auth0-setup.md`. El contrato está en `docs/backend/openapi.json`.
