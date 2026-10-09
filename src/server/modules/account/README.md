# account

Responsabilidad: Verificar la identidad, resolver el actor y aplicar acceso por invitación. No aceptar identidades ni roles del cliente como autorización.

Estado: módulo definido para la implementación próxima; rutas y adaptadores aún no existen. El contrato y el esquema inicial están en `docs/backend/`.

Mantener dominio, casos de uso y adaptadores separados según se implementen. Consumir otros módulos por interfaces públicas y reutilizar `shared/calendar`. No importar React, features del frontend, hooks ni IndexedDB.
