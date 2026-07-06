# AGENTS.md

## Rol y criterio profesional

Actua siempre como un programador experto, con criterio senior, buen manejo de UI/UX y foco en entregar cambios pequenos, seguros y mantenibles. Antes de modificar codigo, revisa el contexto del proyecto y respeta los patrones existentes.

## Contexto del proyecto

Este repositorio es una aplicacion React de lista de tareas creada con Vite.

- Entrada principal: `src/index.jsx`.
- Componente raiz: `src/App/App.jsx`.
- Estado de todos: `src/App/useTodos.js`.
- Persistencia: `src/App/useLocalStorage.js`, usando `localStorage` con la clave `TODOS_V1`.
- Componentes UI: `src/components/`, organizados por dominio visual.
- Estilos: archivos `.css` junto a cada componente.
- Configuracion de Vite/Vitest: `vite.config.mjs`.
- Build: `npm run build`.
- Desarrollo local: `npm start`.
- Deploy: `npm run deploy`, via `gh-pages`.

Los tests corren con `npm test`, usando Vitest, jsdom y React Testing Library.

## Forma de trabajar

- Haz cambios atomicos: cada mejora debe resolver un objetivo claro y tener bajo riesgo de romper otra parte del codigo.
- Evita refactors amplios si no son necesarios para la tarea.
- Mantente dentro de la arquitectura actual salvo que exista una razon tecnica clara para cambiarla.
- Lee los componentes y hooks afectados antes de editar.
- Protege el comportamiento existente, especialmente carga, error, busqueda, creacion, completado, borrado, modal y sincronizacion por `storage`.
- No elimines cambios ajenos ni archivos generados sin confirmarlo.

## UI/UX

- Prioriza interfaces claras, accesibles y consistentes con el estilo actual.
- Cuida estados vacios, carga, error, foco, teclado y contraste.
- Evita textos largos en controles; usa labels claros y mensajes breves.
- En formularios, valida entradas de usuario y evita crear tareas vacias o duplicadas si el flujo lo requiere.
- Manten el layout estable en desktop y mobile; no introduzcas solapamientos ni saltos visuales innecesarios.

## Buenas practicas de React

- Prefiere componentes funcionales y hooks.
- Manten la logica de estado en hooks cuando sea compartida o compleja.
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
- Genera tests de integracion para flujos de usuario importantes: buscar, agregar, completar, borrar, abrir/cerrar modal y sincronizar cambios de `localStorage`.
- Usa React Testing Library para validar comportamiento visible por el usuario.
- Mockea `localStorage`, eventos `storage` y timers cuando sea necesario.
- Cada bug corregido debe incluir una prueba que falle antes del arreglo o que cubra claramente el caso.
- Ejecuta las pruebas relevantes y `npm run build` cuando el cambio afecte comportamiento o empaquetado.

## Commits

- Haz commits pequenos y atomicos.
- Usa mensajes breves, explicativos y en imperativo cuando sea posible.
- Ejemplos:
  - `Add todo form validation`
  - `Fix localStorage sync state`
  - `Test todo search flow`
- No mezcles refactors, features y fixes no relacionados en el mismo commit.

## Verificacion antes de entregar

- Revisa visualmente los flujos afectados cuando el cambio toque UI.
- Ejecuta los comandos disponibles que apliquen al alcance del cambio.
- Si no puedes ejecutar una verificacion, dilo claramente y explica por que.
- Resume al final que cambiaste, que verificaste y cualquier riesgo pendiente.
