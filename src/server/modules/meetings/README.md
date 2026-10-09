# meetings

Responsabilidad: Intersección de intervalos autorizados, revalidación de reservas y respuestas de participantes. El cálculo puro existe en domain/availability.ts.

Estado: el algoritmo puro y sus tests están implementados; rutas, reservas y adaptadores siguen pendientes. Entrada pública: index.ts. El contrato y el esquema inicial están en `docs/backend/`.

Mantener dominio, casos de uso y adaptadores separados según se implementen. Consumir otros módulos por interfaces públicas y reutilizar `shared/calendar`. No importar React, features del frontend, hooks ni IndexedDB.
