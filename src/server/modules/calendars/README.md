# calendars

Responsabilidad: Normalizar elementos con shared/calendar y aplicar permisos de cada agenda antes de leer/escribir. Compartir libre/ocupado sin exponer detalles privados.

Estado: módulo definido para la implementación próxima; rutas y adaptadores aún no existen. El contrato y el esquema inicial están en `docs/backend/`.

Mantener dominio, casos de uso y adaptadores separados según se implementen. Consumir otros módulos por interfaces públicas y reutilizar `shared/calendar`. No importar React, features del frontend, hooks ni IndexedDB.
