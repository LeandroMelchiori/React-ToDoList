# Acceso privado con Auth0

La interfaz de cuenta está implementada en `/account`: acceso con Google o email/contraseña, activación por invitación, consulta del perfil y cierre de sesión. La agenda local sigue siendo independiente. Iniciar sesión no importa tareas ni activa sincronización; esas operaciones se implementarán después.

## 1. Crear el proveedor

Creá una cuenta en [Auth0](https://auth0.com/signup) y un tenant. En Applications, creá una aplicación **Single Page Application**, con React como tecnología. Conservá su **Domain** y **Client ID**, que son públicos. TaskFlow usa el SDK oficial con Authorization Code + PKCE; no necesita un Client Secret en el navegador.

En APIs, creá una API para TaskFlow con firma **RS256**. Elegí un Identifier estable, por ejemplo `https://api.taskflow.example`. Ese identificador será la misma audiencia en frontend, backend y Action; no necesita ser una URL navegable. No uses la audiencia de la API de administración de Auth0.

Configurá las URLs de la aplicación para cada origen que efectivamente vayas a usar:

| Campo | Desarrollo con Vite | Producción, cuando se habilite |
| --- | --- | --- |
| Allowed Callback URLs | `http://127.0.0.1:5173/account` | `https://taskflow.sachadev.me/account` |
| Allowed Logout URLs | `http://127.0.0.1:5173/account` | `https://taskflow.sachadev.me/account` |
| Allowed Web Origins | `http://127.0.0.1:5173` | `https://taskflow.sachadev.me` |

Si usás `localhost` o la preview en `4173`, agregá sus URLs exactas por separado. No uses comodines. El repositorio incluye el rewrite de `/account` para Vercel.

## 2. Habilitar ambos métodos de acceso

En Authentication → Database, habilitá `Username-Password-Authentication` para la aplicación. Universal Login administra registro, verificación de email y recuperación de contraseña. El login es con **email y contraseña**; el nombre de usuario de TaskFlow se elige al aceptar la invitación y no funciona como credencial del proveedor.

En Authentication → Social, configurá `google-oauth2` y habilitala para la misma aplicación. Para el entorno real, creá credenciales OAuth de tipo **Web application** en Google y usá la callback que muestre Auth0. El cliente de escritorio del generador de certificados no sirve para este flujo. El Client Secret de Google se introduce solamente en Auth0; no se guarda en este repositorio ni en variables `VITE_`.

Una persona puede crear su identidad en Auth0 sin quedar admitida en TaskFlow: el backend exige una invitación dirigida a su email verificado. Google y email/contraseña pueden generar identidades distintas incluso con el mismo email; no se enlazan automáticamente.

## 3. Añadir email verificado al access token

La API valida un **access token destinado a TaskFlow**, no un ID token. Para incluir email en ese access token:

1. En Actions, creá una Action de tipo **Login / Post Login** y copiá [`backend/auth0/post-login-action.cjs`](../../backend/auth0/post-login-action.cjs).
2. Añadí a sus Secrets `TASKFLOW_API_AUDIENCE` con el Identifier de la API. Es configuración pública, aunque Auth0 la almacene en ese apartado.
3. Desplegá la Action y agregala al flujo Post Login. Aplicá el flujo.

La Action solo modifica tokens para esa audiencia. Emite los claims `https://taskflow.sachadev.me/claims/email` y `https://taskflow.sachadev.me/claims/email_verified`; el segundo exige el booleano `true`. Configurá el backend para leer esos mismos nombres.

## 4. Configurar TaskFlow

Copiá [`.env.example`](../../.env.example) a `.env.local` y completá los valores públicos:

```dotenv
VITE_AUTH0_DOMAIN=tu-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=client-id-publico
VITE_AUTH0_AUDIENCE=https://api.taskflow.example
VITE_AUTH0_DATABASE_CONNECTION=Username-Password-Authentication
VITE_TASKFLOW_API_URL=http://127.0.0.1:8080/api/v1
```

El dominio no lleva `https://` ni barra final. La URL de API incluye `/api/v1`; fuera de localhost requiere HTTPS. Reiniciá Vite después de cambiar la configuración. Sin valores válidos, el workspace local continúa disponible y no muestra el botón de cuenta. Las variables `VITE_` quedan incluidas en el build y nunca deben contener secretos.

Para Java, además de las variables PostgreSQL descritas en [`backend/README.md`](../../backend/README.md), configurá en el entorno del proceso:

```dotenv
TASKFLOW_AUTH_ISSUER=https://tu-tenant.auth0.com/
TASKFLOW_AUTH_JWKS_URI=https://tu-tenant.auth0.com/.well-known/jwks.json
TASKFLOW_AUTH_AUDIENCE=https://api.taskflow.example
TASKFLOW_AUTH_EMAIL_CLAIM=https://taskflow.sachadev.me/claims/email
TASKFLOW_AUTH_EMAIL_VERIFIED_CLAIM=https://taskflow.sachadev.me/claims/email_verified
TASKFLOW_WEB_ORIGINS=http://127.0.0.1:5173
```

El issuer debe coincidir exactamente con el emisor del token, incluida la barra final. Con dominio personalizado, usá sus valores coherentes con el proveedor. `TASKFLOW_WEB_ORIGINS` acepta orígenes explícitos separados por coma, sin rutas ni barra final; vacío no habilita acceso desde otros orígenes. CORS permite Bearer e idempotencia y no usa cookies de la API. Spring Boot no carga automáticamente este bloque desde un archivo `.env`.

Desde `backend/`, iniciá el perfil `cloud` con las variables configuradas:

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=cloud"
```

Para un entorno desplegado, frontend y Java se publican por separado. Antes de exponer la base en producción, separá el rol de migración del rol de ejecución según el README del backend. Configurar estas variables no publica la API ni modifica `release/local-base`.

## 5. Probar el piloto

Emití una invitación con el comando administrativo documentado en el backend. Entregá el código de forma privada, fuera de URLs. En TaskFlow, abrí **Mi cuenta**, elegí el método de acceso y verificá el email si corresponde. Pegá el código y elegí usuario, nombre y zona horaria. El perfil y el calendario personal se crean juntos; un reintento conserva la clave idempotente mientras los datos no cambien.

Comprobá ambos métodos con identidades invitadas distintas, recuperación de contraseña, rechazo de email sin verificar, invitación incorrecta/vencida, cierre de sesión y acceso de otra persona. Las tareas locales deben permanecer iguales. Los tokens se mantienen en memoria; ni la API ni respuestas con Authorization entran al caché offline de TaskFlow. La sesión del proveedor puede recuperarse al volver a entrar; cerrar sesión usa el logout oficial.

`npm run test:e2e:auth` comprueba PKCE, callback, ambos métodos, invitación/reintento, logout, accesibilidad y preservación local con un proveedor simulado, sin credenciales ni bypass en producción. `npm run test:e2e` comprueba además el modo offline real. Estas pruebas no sustituyen la verificación del tenant y de Google reales.

Referencias oficiales: [React SDK](https://auth0.com/docs/quickstart/spa/react), [conexión Google](https://auth0.com/docs/authenticate/identity-providers/social-identity-providers/google), [custom claims](https://auth0.com/docs/secure/tokens/json-web-tokens/create-custom-claims).
