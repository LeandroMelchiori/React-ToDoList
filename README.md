# TaskFlow - React ToDo List

[![CI](https://github.com/LeandroMelchiori/React-ToDoList/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/LeandroMelchiori/React-ToDoList/actions/workflows/ci-cd.yml)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=061A23)
![Vite](https://img.shields.io/badge/Vite-build-646CFF?logo=vite&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-tested-6E9F18?logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?logo=playwright&logoColor=white)
![Lighthouse](https://img.shields.io/badge/Lighthouse-100%2F100%2F100%2F100-0B57D0?logo=lighthouse&logoColor=white)

<p align="center">
  <a href="https://taskflow.sachadev.me">
    <img src="public/demo-taskflow.png" alt="TaskFlow con tareas, filtros y acciones principales" width="100%" />
  </a>
</p>

TaskFlow es una aplicacion React para gestionar tareas con busqueda, filtros, edicion, validaciones, orden manual y persistencia local. El proyecto mantiene una base simple, probada y desplegable, con foco en separar estado, UI, modelo de datos y persistencia sin agregar complejidad innecesaria.

## Demo

- Produccion: https://taskflow.sachadev.me
- Repositorio: https://github.com/LeandroMelchiori/React-ToDoList

## Objetivo y alcance

La aplicacion parte de un flujo de tareas clasico y agrega comportamiento de producto sin salir de una arquitectura liviana:

- Gestion completa de tareas: crear, editar, completar, buscar, filtrar y eliminar.
- Persistencia local en IndexedDB con migracion desde `localStorage`.
- Orden manual con drag and drop y controles accesibles subir/bajar.
- Validaciones para evitar entradas vacias y duplicadas.
- Estados visibles para carga, error, lista vacia y busqueda sin resultados.
- Sincronizacion cuando el almacenamiento cambia desde otra pestana.
- Soporte PWA con shell offline para abrir la app sin conexion luego de la primera visita.
- Exportacion e importacion de backups en JSON.
- Pruebas automatizadas y validacion continua antes de publicar cambios.

## Funcionalidades

- Crear tareas con validacion de texto vacio y duplicados.
- Editar tareas desde un modal con validacion de duplicados.
- Asignar prioridad y fecha limite opcional a cada tarea.
- Organizar tareas por proyecto y etiquetas opcionales.
- Dividir tareas en subtareas tipo checklist.
- Cargar plantillas iniciales desde el estado vacio.
- Marcar tareas como completadas o pendientes.
- Eliminar tareas con confirmacion previa.
- Deshacer una eliminacion reciente desde un aviso temporal.
- Buscar tareas por texto, proyecto o etiqueta.
- Filtrar rapidamente por proyecto o etiqueta.
- Filtrar por todas, pendientes, completadas, vencidas, de hoy o proximas.
- Reordenar tareas con drag and drop o con controles subir/bajar.
- Usar atajos de teclado: `/` enfoca busqueda, `n` abre el formulario de nueva tarea y el skip link salta directo a la lista.
- Persistir datos en IndexedDB, manteniendo compatibilidad con datos antiguos en `localStorage`.
- Normalizar tareas antiguas guardadas sin `id`.
- Detectar cambios hechos en otra pestana y permitir sincronizar.
- Exportar e importar tareas con un archivo JSON local.
- Mostrar estado offline/PWA y avisar cuando hay una version nueva disponible.
- Mostrar estados de carga, error, lista vacia y busqueda sin resultados.

## Stack

- React 18
- Vite
- CSS por componente
- React Testing Library
- Vitest
- Playwright
- IndexedDB
- PWA / Service Worker
- Jest DOM
- GitHub Actions
- Vercel

## Calidad y entrega

| Senal | Estado |
| --- | --- |
| Auditoria de dependencias | `npm audit --audit-level=moderate` sin vulnerabilidades. |
| Tests unitarios/integracion | `npm test` cubre hooks y flujos principales de UI. |
| Tests E2E | `npm run test:e2e` valida el flujo completo sobre el build de produccion local. |
| Lighthouse | `npm run audit:lighthouse` genera reporte del sitio publicado. Ultima medicion: 100/100/100/100. |
| CI | GitHub Actions ejecuta audit, tests, Playwright y build en cada push/PR a `main`. |

## Decisiones tecnicas

- Cada tarea usa un `id` unico para evitar depender del texto como key o identificador.
- Los datos antiguos se normalizan para mantener compatibilidad con tareas sin `id`, prioridad, proyecto o etiquetas.
- Las operaciones sobre tareas son inmutables: completar, borrar, agregar, editar y reordenar generan nuevas referencias.
- El modelo puro de tareas vive en `todoModel.js`; ahi se normalizan datos, filtros, grupos, backups y reordenamiento.
- La logica principal vive en hooks (`useTodos`, `useLocalStorage`) para separar estado y presentacion.
- IndexedDB es la persistencia principal y `localStorage` queda como compatibilidad, migracion y puente para eventos `storage`.
- El formulario se reutiliza para creacion y edicion, manteniendo validaciones consistentes.
- La UI usa labels, botones accesibles, skip link, foco visible y estados claros para mejorar navegacion y feedback.
- El build usa base `/` para publicar correctamente en Vercel desde `taskflow.sachadev.me`.
- El toolchain usa Vite para reducir dependencias vulnerables y acelerar desarrollo/build.

## Arquitectura

```mermaid
flowchart TD
  App["App.jsx"] --> Header["TodoHeader"]
  App --> List["TodoList"]
  App --> Modal["Modal"]
  App --> Alert["ChangeAlert"]
  App --> PWA["PwaStatus"]
  App --> Undo["UndoToast"]
  App --> Todos["useTodos"]
  Todos --> Model["todoModel.js"]
  Todos --> Storage["useLocalStorage"]
  Storage --> Adapter["todoStorage.js"]
  Adapter --> IndexedDB["IndexedDB taskflow-db"]
  Adapter --> LocalStorage["localStorage TODOS_V1"]
  Todos --> Filters["search + filters + facets + counts"]
  Todos --> Actions["create / edit / complete / delete / reorder"]
  List --> Item["TodoItem"]
  Item --> Order["drag and drop + subir/bajar"]
  Modal --> Form["TodoForm"]
  Modal --> DeleteDialog["DeleteTodoDialog"]
```

El estado de negocio vive en `useTodos`; las reglas puras de tareas viven en `todoModel.js`; la persistencia y sincronizacion con el navegador quedan aisladas en `useLocalStorage` y `todoStorage.js`. Los componentes visuales reciben datos y callbacks, lo que mantiene la UI facil de probar y cambiar.

## Estructura

```txt
src/
  App/
    App.jsx
    todoModel.js
    todoStorage.js
    useTodos.js
    useLocalStorage.js
    usePwaStatus.js
    useTheme.js
  components/
    ChangeAlert/
    CreateTodoButton/
    Modal/
    PwaStatus/
    ThemeToggle/
    TodoHeader/
    TodoIcon/
    TodoList/
    UndoToast/
  serviceWorkerRegistration.js
public/
  manifest.json
  sw.js
tests/
  e2e/
```

## Scripts

Instalar dependencias:

```bash
npm install
```

Ejecutar en desarrollo:

```bash
npm start
```

Ejecutar tests:

```bash
npm test
```

Ejecutar E2E sobre el build de produccion:

```bash
npm run test:e2e
```

Generar auditoria Lighthouse del sitio publicado:

```bash
npm run audit:lighthouse
```

Regenerar la captura demo del README:

```bash
npm run capture:demo
```

Generar build de produccion:

```bash
npm run build
```

Previsualizar el build:

```bash
npm run preview
```

## CI

El proyecto usa GitHub Actions para validar cada cambio. Vercel toma los cambios de `main` y publica automaticamente la version principal.

- En cada pull request o push a `main`: instala dependencias con `npm ci`, ejecuta `npm audit --audit-level=moderate`, corre tests, ejecuta E2E con Playwright y genera build.
- Vercel publica la app en `taskflow.sachadev.me`.

## Tests

La suite actual cubre:

- Normalizacion de tareas antiguas.
- Creacion de tareas con ids y texto limpio.
- Filtros por busqueda y estado.
- Filtros temporales por tareas vencidas, de hoy y proximas.
- Creacion y marcado de subtareas.
- Plantillas iniciales desde el estado vacio.
- Reordenamiento manual con botones y drag and drop.
- Flujo principal desde la UI: crear, validar, buscar, completar, filtrar y eliminar.
- Validacion de tareas duplicadas desde el formulario de creacion.
- Edicion de tareas desde modal y validacion de duplicados en edicion.
- Cancelacion segura antes de eliminar una tarea.
- Deshacer una eliminacion reciente y autocierre del aviso.
- Navegacion por teclado, skip link, foco en modal y cierre con `Escape`.
- Exportacion e importacion de backups JSON.
- Estado PWA/offline y aplicacion de actualizaciones del service worker.
- Flujo E2E de produccion con Playwright: crear, buscar, editar, completar, cancelar borrado y eliminar.

## Mejoras futuras

- Vista previa de importacion con opcion de fusionar, reemplazar u omitir duplicados.
- Metricas locales sin backend: tareas completadas por semana, vencidas y distribucion por prioridad.
- Mas plantillas locales para flujos recurrentes de estudio, talleres o proyectos.
- Migracion a TypeScript.
- Soporte opcional de multiples tableros locales sin salir del modelo local-first.

## Autor

Desarrollado por Leandro Melchiori.
