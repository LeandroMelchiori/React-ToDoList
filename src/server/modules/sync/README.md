# sync

Responsabilidad: Revisiones, idempotencia, tombstones y cambios sanitizados por destinatario. SQL y autorización permanecen en el servidor.

Estado: módulo definido para la implementación próxima; rutas y adaptadores aún no existen. El contrato y el esquema inicial están en `docs/backend/`.

Mantener dominio, casos de uso y adaptadores separados según se implementen. Consumir otros módulos por interfaces públicas y reutilizar `shared/calendar`. No importar React, features del frontend, hooks ni IndexedDB.
