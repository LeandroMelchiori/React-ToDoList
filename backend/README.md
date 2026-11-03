# TaskFlow API

Backend Java 17/Spring Boot 4.1.2 con PostgreSQL, Flyway y acceso privado por invitación. El frontend continúa independiente y local-first. No se despliega esta API al publicar el frontend en Vercel.

## Desarrollo

Requisito: JDK 17 o posterior, con `JAVA_HOME` configurado. No hace falta instalar Maven; la primera ejecución del wrapper descarga Maven y sus dependencias desde Maven Central.

Desde `backend/`, en PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
.\mvnw.cmd -B -ntp verify
```

En Linux/macOS:

```sh
./mvnw spring-boot:run
./mvnw -B -ntp verify
```

`GET http://127.0.0.1:8080/actuator/health` devuelve `{"status":"UP"}`. `TASKFLOW_API_PORT` cambia el puerto; `TASKFLOW_API_ADDRESS` cambia la dirección de escucha, limitada a localhost por defecto. El jar ejecutable se genera en `target/taskflow-api-0.1.0-SNAPSHOT.jar`.

## PostgreSQL de desarrollo

El perfil predeterminado `local` mantiene solo salud y rutas cerradas, sin necesitar base ni proveedor. Los perfiles `cloud` e `invite-admin` activan la base mediante el grupo `database`. Requieren:

- `TASKFLOW_DB_URL`: JDBC de PostgreSQL, por ejemplo `jdbc:postgresql://127.0.0.1:5432/taskflow`.
- `TASKFLOW_DB_USER`: `taskflow_app` en el Compose local.
- `TASKFLOW_DB_PASSWORD`: contraseña del rol de aplicación.

Con Docker Desktop iniciado, configura las contraseñas de aplicación y de inicialización (`TASKFLOW_DB_ADMIN_PASSWORD`) en tu entorno local y ejecuta `docker compose up -d --wait` desde `backend/`. No se guardan contraseñas en el repositorio. `TASKFLOW_DB_PORT` permite cambiar el puerto local. Compose solo publica PostgreSQL en localhost y conserva los datos en un volumen. El script de inicialización crea `taskflow_app` sin superusuario; solo se ejecuta al crear un volumen nuevo. No borres un volumen existente para cambiar credenciales.

Flyway aplica exclusivamente `src/main/resources/db/migration/`, empezando por cuentas, identidades, invitaciones, solicitudes idempotentes y calendarios personales. `docs/backend/schema.sql` sigue siendo el diseño de los módulos futuros y no se ejecuta. El backend rechaza roles con `SUPERUSER` o `BYPASSRLS`; el rol de aplicación necesita permisos de esquema para las migraciones. En producción se deberán separar las credenciales de migración de las de ejecución antes del despliegue.

El proceso Java y las pruebas usan UTC para la conexión JDBC; cada agenda conserva su zona IANA. Así la zona o los alias del sistema operativo no condicionan la conexión.

## Identidad y acceso privado

El perfil `cloud` requiere un proveedor de identidad que emita JWT firmados. El proveedor puede ofrecer Google como método de login; esta API no implementa passwords ni una pantalla de OAuth. Configura:

- `TASKFLOW_AUTH_ISSUER`: emisor exacto de los tokens.
- `TASKFLOW_AUTH_JWKS_URI`: URL del juego de claves públicas del emisor.
- `TASKFLOW_AUTH_AUDIENCE`: audiencia asignada a TaskFlow.
- `TASKFLOW_AUTH_EMAIL_CLAIM` y `TASKFLOW_AUTH_EMAIL_VERIFIED_CLAIM`: nombres de los claims de email, por defecto `email` y `email_verified`.
- `TASKFLOW_WEB_ORIGINS`: orígenes explícitos de frontend separados por coma, sin rutas ni comodines; vacío mantiene CORS cerrado.

El frontend integra Auth0 Universal Login para Google y email/contraseña, alta por invitación y consulta del perfil. La [guía de Auth0](../docs/backend/auth0-setup.md) explica el tenant, la Action de claims, URLs permitidas y variables públicas/privadas. La configuración real del proveedor sigue pendiente.

Usa HTTPS y tokens destinados a esta API en el entorno desplegado. Firma RS256, emisor, audiencia, expiración, vigencia y subject se verifican en el servidor. La aceptación de invitaciones requiere además un email con `email_verified: true` booleano. No se vinculan cuentas automáticamente por coincidencia de email. El acceso posterior se resuelve por emisor/subject verificados.

Para arrancar la API: `.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=cloud` (Unix: sustituir por `./mvnw`). No se crean cuentas ni calendarios simplemente por iniciar sesión en el proveedor.

### Emitir una invitación

La emisión es una operación del administrador con acceso a la base; no hay endpoint HTTP de emisión ni envío de emails. Después de `verify`, ejecuta:

```sh
java -jar target/taskflow-api-0.1.0-SNAPSHOT.jar --spring.profiles.active=invite-admin --taskflow.invitation.email=persona@example.com --taskflow.invitation.hours=48
```

El comando no inicia un servidor web. Imprime una única copia del token aleatorio de 256 bits y su vencimiento. En la base solo queda SHA-256 del token. Compártelo de forma privada; no lo pongas en URLs, logs o commits. La vigencia admitida es 1–168 horas. Para revocar antes de usarlo, un operador puede establecer `revoked_at` en `access_invitations` por su ID. No hay límite fijo de cinco cuentas.

### Operaciones implementadas

- `POST /api/v1/account/invitations/redeem`: Bearer verificado, `Idempotency-Key` UUID y JSON con `token`, `handle`, `displayName` y `timeZone`. Exige que la invitación esté vigente, disponible y dirigida al email verificado. Devuelve el perfil y crea su calendario personal en la misma transacción.
- `GET /api/v1/me`: perfil de la cuenta invitada asociada al token.
- `GET /api/v1/calendars`: lista de calendarios personales propios, con `nextCursor: null`.
- `GET /api/v1/calendars/{calendarId}`: lectura de un calendario propio; responde 404 si pertenece a otra cuenta.

Una identidad válida sin alta responde 403. Las solicitudes sin identidad válida responden 401 JSON. Reintentos del alta con la misma identidad, clave y datos devuelven el resultado original; datos diferentes con la misma clave responden 409. La transacción protege el uso único de la invitación y las altas concurrentes. Un conflicto de handle revierte el alta y conserva la invitación disponible.

Usuarios y calendarios tienen RLS forzada, además de filtros explícitos del repositorio. El actor se establece solo dentro de una transacción desde el mapeo de identidad, y no se filtra a otra conexión del pool. Las tablas de bootstrap de identidad/invitación son exclusivas del servidor; las credenciales PostgreSQL nunca deben distribuirse al navegador.

No se implementaron todavía edición de perfiles, elementos de agenda remotos, amistades, grupos ni sincronización. El acceso desde React no sube ni reemplaza el workspace local. La base local preservada continúa independiente.

## Pruebas

`verify` requiere Docker operativo: Testcontainers crea PostgreSQL 17 desechable y un rol sin bypass de RLS. No usa bases reales ni sustituye PostgreSQL por H2. El servidor de claves del test y las claves de firma son locales y temporales. Se prueban los tokens, invitaciones, reintentos, concurrencia, rollback, perfil/calendario propio y aislamiento HTTP/SQL entre dos cuentas. El CI usa la misma suite.

## Organización

`me.sachadev.taskflow` ensambla la aplicación. `config` contiene configuración técnica. Los módulos de negocio se incorporarán por responsabilidad (`account`, `calendars`, `friendships`, `groups`, `meetings`, `sync`) cuando tengan implementación, con dominio, casos de uso y adaptadores separados. No crear carpetas vacías ni importar frontend, React o almacenamiento del navegador.

La lógica TypeScript de `src/server/modules` es una referencia previa y no se ejecuta dentro de Java. El cálculo de disponibilidad y la normalización de elementos necesitarán adaptadores y pruebas de equivalencia antes de exponerse desde Java; esta entrega no afirma reutilizarlos automáticamente.

Referencias: [requisitos de Spring Boot](https://docs.spring.io/spring-boot/system-requirements.html), [autorización HTTP de Spring Security](https://docs.spring.io/spring-security/reference/servlet/authorization/authorize-http-requests.html).
