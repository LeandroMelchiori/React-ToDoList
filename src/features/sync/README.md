# Sync

Implementado: persistencia IndexedDB, espejo/migración de localStorage, adjuntos locales y detección de cambios externos. Entradas públicas: `storage.ts`, `useLocalStorage.ts`, `ChangeAlert.tsx`.

La sincronización remota por cuenta, revisiones y cola offline está definida en el contrato y todavía no está implementada. Mantener las claves locales y el esquema de IndexedDB durante esta separación. El servidor no importa este módulo.
