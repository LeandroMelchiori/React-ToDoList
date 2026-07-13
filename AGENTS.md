# AGENTS.md

## Rol y criterio profesional

Actua siempre como un programador experto, con criterio senior, buen manejo de UI/UX y foco en entregar cambios pequenos, seguros y mantenibles. Antes de modificar codigo, revisa el contexto del proyecto y respeta los patrones existentes.

## Contexto del proyecto

Este repositorio es una aplicacion React local-first de tareas, agenda y horarios creada con Vite.

- Entrada principal: `src/index.tsx`.
- Registro PWA: `src/serviceWorkerRegistration.ts`.
- Componente raiz: `src/App/App.tsx`.
- Estado de todos: `src/App/useTodos.ts`.
- Modelos puros: `src/App/todoModel.ts` (tareas, agenda, recurrencias avanzadas, recordatorios, export/import ICS), `src/App/todoBoards.ts` (tableros), `src/App/todoSavedViews.ts` (vistas guardadas), `src/App/todoWorkspaceBackup.ts` (backups).
- Persistencia: `src/App/useLocalStorage.ts` + `src/App/todoStorage.ts`.
- Base local principal: IndexedDB (`taskflow-db`), con migracion/espejo desde `localStorage`.
- Claves locales: tareas `TODOS_V1`, tema `THEME_V1`.
- Tema visual: `src/App/useTheme.ts`, con modo claro/oscuro persistido.
- Estado PWA: `src/App/usePwaStatus.ts`.
- Componentes UI: `src/components/`, organizados por dominio visual. Las vistas principales incluyen `TodoList`, `TodoBoardView`, `TodoToday`, `TodoCalendar` y `TodoWeekCalendar`.
- Estilos: archivos `.css` junto a cada componente.
- PWA/offline shell: `public/sw.js` y `public/manifest.json`.
- Configuracion de Vite/Vitest: `vite.config.mjs`.
- Build: `npm run build`.
- Desarrollo local: `npm start`.
- Deploy: Vercel publica automaticamente desde `main` en `https://taskflow.sachadev.me`.
- CI: GitHub Actions ejecuta audit, tests, E2E con Playwright y build en push/PR a `main`.

Los tests unitarios e integracion corren con `npm test`, usando Vitest, jsdom y React Testing Library. Los tests E2E corren con `npm run test:e2e`, usando Playwright sobre el build de produccion local. Lighthouse se ejecuta con `npm run audit:lighthouse`.

## Forma de trabajar

- Haz cambios atomicos: cada mejora debe resolver un objetivo claro y tener bajo riesgo de romper otra parte del codigo.
- Evita refactors amplios si no son necesarios para la tarea.
- Mantente dentro de la arquitectura actual salvo que exista una razon tecnica clara para cambiarla.
- Lee los componentes y hooks afectados antes de editar.
- Protege el comportamiento existente, especialmente carga, error, busqueda, filtros, vistas guardadas, tableros locales, vista tablero, creacion, edicion, detalle, duplicado, completado, subtareas, borrado, calendario, vista semanal, vista de hoy, recordatorios locales, modal, tema, export/import, export/import ICS, PWA y sincronizacion por `storage`.
- Cuando el usuario pida varias mejoras, separalas en commits y pushes atomicos si asi lo solicita. No mezcles features, refactors y fixes en el mismo commit.
- No elimines cambios ajenos ni archivos generados sin confirmarlo.

## Datos, offline y backups

- Trata la app como local-first: debe seguir funcionando sin backend.
- IndexedDB es la persistencia principal para tareas; `localStorage` se mantiene como compatibilidad/migracion y para eventos `storage`.
- Toda tarea debe normalizarse con los helpers de `todoModel.ts` antes de persistirse o importarse.
- Conserva compatibilidad con tareas antiguas sin `id`, `priority` o `dueDate`.
- Las recurrencias avanzadas (`recurrenceDays`, `recurrenceEndDate`, `recurrenceCount`) deben calcularse desde el modelo puro, no desde componentes.
- Export/import usa JSON versionado; valida y normaliza cualquier archivo importado antes de guardarlo. Soporta backups completos del workspace (`todoWorkspaceBackup.ts`) y export/import local de calendario ICS desde `todoModel.ts`.
- Los recordatorios son locales y opcionales; dependen del permiso del navegador y no deben requerir backend.
- No rompas el service worker ni el manifest al cambiar rutas, assets o comportamiento de build.
- Evita introducir dependencias de backend, autenticacion o servicios externos salvo pedido explicito.

## UI/UX

- Prioriza interfaces claras, accesibles y consistentes con el estilo actual.
- Cuida estados vacios, carga, error, foco, teclado y contraste.
- Evita textos largos en controles; usa labels claros y mensajes breves.
- En formularios, valida entradas de usuario y evita crear tareas vacias o duplicadas si el flujo lo requiere.
- Diferencia con claridad tareas completables, eventos, horarios y periodos; no mezcles metricas de completado con elementos de agenda.
- En calendario, evita contaminar la grilla con recurrencias diarias numerosas; usa resumenes compactos cuando corresponda.
- En modales, conserva foco inicial, cierre con `Escape`, ciclo de tabulacion y restauracion de foco.
- Manten el layout estable en desktop y mobile; no introduzcas solapamientos ni saltos visuales innecesarios.
- Revisa contraste tanto en modo claro como oscuro.

## Buenas practicas de React

- Prefiere componentes funcionales y hooks.
- Manten la logica de estado en hooks cuando sea compartida o compleja.
- Manten helpers puros en los archivos del dominio (`src/App/todoModel.ts`, `todoBoards.ts`, `todoSavedViews.ts`, `todoWorkspaceBackup.ts`); no vuelvas a mezclar modelo puro dentro de los hooks como `useTodos.ts`.
- Evita mutar objetos de estado directamente; crea nuevas referencias antes de guardar.
- Usa nombres consistentes y corrige typos solo cuando el cambio sea seguro o este dentro del alcance.
- Evita logs de depuracion en produccion salvo que sean parte explicita del comportamiento esperado.
- Manten imports simples y elimina codigo muerto cuando sea parte del cambio.

## Comentarios en codigo

- Agrega comentarios solo cuando expliquen una decision, un caso borde o una regla de negocio no obvia.
- Los comentarios deben ser breves, explicativos y cercanos al codigo que aclaran.
- No comentes lo evidente.

## Tests

- Genera tests unitarios para hooks, helpers y componentes con logica propia.
- Genera tests de integracion para flujos de usuario importantes: buscar, agregar, editar, detalle, duplicar, completar, subtareas, borrar, abrir/cerrar modal, vista tablero, calendario, vista semanal, vista de hoy, recordatorios locales, tema, export/import, export/import ICS y sincronizar cambios externos.
- Genera tests E2E cuando el cambio afecte un flujo principal de usuario.
- Usa React Testing Library para validar comportamiento visible por el usuario.
- Mockea `localStorage`, IndexedDB, eventos `storage`, archivos, URLs de descarga y timers cuando sea necesario.
- Cada bug corregido debe incluir una prueba que falle antes del arreglo o que cubra claramente el caso.
- Ejecuta las pruebas relevantes y `npm run build` cuando el cambio afecte comportamiento o empaquetado.
- Ejecuta `npm run test:e2e` cuando el cambio toque creacion, edicion, borrado, modal, persistencia, PWA, export/import o build.

## Commits

- Haz commits pequenos y atomicos.
- Usa mensajes breves, explicativos y en imperativo cuando sea posible.
- Ejemplos:
  - `Add todo form validation`
  - `Fix localStorage sync state`
  - `Test todo search flow`
  - `Add PWA offline shell`
  - `Migrate todos to IndexedDB`
- No mezcles refactors, features y fixes no relacionados en el mismo commit.

## Verificacion antes de entregar

- Revisa visualmente los flujos afectados cuando el cambio toque UI.
- Ejecuta los comandos disponibles que apliquen al alcance del cambio.
- Para cambios de PWA/offline, verifica que `npm run build` incluya `public/sw.js` y que el E2E siga pasando.
- Si no puedes ejecutar una verificacion, dilo claramente y explica por que.
- Resume al final que cambiaste, que verificaste y cualquier riesgo pendiente.
