# calendars

Responsabilidad: Normalizar elementos con shared/calendar y aplicar permisos de cada agenda antes de leer/escribir. Compartir libre/ocupado sin exponer detalles privados.

Estado: esta carpeta es una referencia TypeScript. La implementación Java de creación/lectura de calendarios personales vive en `backend/src/main/java/me/sachadev/taskflow/calendars/`. Los elementos remotos, recurrencias y permisos compartidos siguen pendientes; no se importa TypeScript dentro de Java. Ver `backend/README.md` y el contrato en `docs/backend/`.

Mantener dominio, casos de uso y adaptadores separados según se implementen. Consumir otros módulos por interfaces públicas y reutilizar `shared/calendar`. No importar React, features del frontend, hooks ni IndexedDB.
