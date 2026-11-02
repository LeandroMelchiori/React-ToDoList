# TaskFlow API

Primer runtime del backend: Java 17, Spring Boot 4.1.2 y Maven Wrapper. El frontend continúa independiente y local-first. No se despliega esta API al publicar el frontend en Vercel.

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

## Alcance actual

- Solo la comprobación de salud es pública y no expone componentes ni configuración.
- Las demás rutas responden 401 JSON con `code`, `message` y un `requestId` generado por el servidor. No hay login, usuarios de prueba, contraseña generada, cookies de sesión ni aceptación de tokens sin verificar.
- Las pruebas arrancan un servidor HTTP en un puerto aleatorio y comprueban salud, acceso anónimo y rechazo de escrituras con identidad no verificada.
- No hay persistencia remota ni acceso a los datos del navegador. No se ha aplicado `docs/backend/schema.sql` a una base.

La siguiente entrega implementará el acceso por invitación y la resolución del actor, antes de activar perfiles o calendarios. Luego se incorporarán PostgreSQL, migraciones y repositorios con pruebas de aislamiento entre cuentas. El contrato previsto sigue en `docs/backend/openapi.json`; sus operaciones de negocio todavía no están implementadas.

## Organización

`me.sachadev.taskflow` ensambla la aplicación. `config` contiene configuración técnica. Los módulos de negocio se incorporarán por responsabilidad (`account`, `calendars`, `friendships`, `groups`, `meetings`, `sync`) cuando tengan implementación, con dominio, casos de uso y adaptadores separados. No crear carpetas vacías ni importar frontend, React o almacenamiento del navegador.

La lógica TypeScript de `src/server/modules` es una referencia previa y no se ejecuta dentro de Java. El cálculo de disponibilidad y la normalización de elementos necesitarán adaptadores y pruebas de equivalencia antes de exponerse desde Java; esta entrega no afirma reutilizarlos automáticamente.

Referencias: [requisitos de Spring Boot](https://docs.spring.io/spring-boot/system-requirements.html), [autorización HTTP de Spring Security](https://docs.spring.io/spring-security/reference/servlet/authorization/authorize-http-requests.html).
