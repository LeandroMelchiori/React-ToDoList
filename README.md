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

TaskFlow es una aplicacion React para gestionar tareas con busqueda, filtros, edicion, validaciones y persistencia local. El objetivo del proyecto es mostrar como una ToDo List clasica puede evolucionar hacia una experiencia de portfolio mas cuidada: UI clara, estado bien separado, pruebas automatizadas, CI y deploy en produccion.

## Demo

- Produccion: https://taskflow.sachadev.me
- Repositorio: https://github.com/LeandroMelchiori/React-ToDoList

## Lectura rapida para recruiters

| Punto | Evidencia |
| --- | --- |
| Producto | Flujo completo para crear, buscar, editar, completar y eliminar tareas. |
| Frontend | React con componentes funcionales, hooks propios y estado inmutable. |
| UX | Estados vacios, carga, error, filtros, validaciones, confirmacion de borrado y feedback visible. |
| Calidad | Unit/integration tests con Vitest y React Testing Library, E2E con Playwright y CI en GitHub Actions. |
| Deploy | Produccion en Vercel con dominio propio: `taskflow.sachadev.me`. |

## Caso de portfolio

**Problema:** una ToDo List suele ser un ejercicio comun y poco diferenciador si solo permite agregar y borrar items.

**Solucion:** convertirla en una app pequena pero completa, con decisiones visibles de producto, arquitectura y calidad: validaciones, persistencia, busqueda, filtros, edicion, sincronizacion por `storage`, pruebas automatizadas y deploy real.

**Resultado:** un proyecto facil de revisar para un reclutador tecnico: se puede usar en produccion, leer el README, mirar el pipeline de CI y comprobar que los flujos principales estan cubiertos por tests.

## Valor del proyecto

Este proyecto esta pensado como una pieza de portfolio para demostrar:

- Criterio de producto al convertir un ejercicio comun en una app usable.
- Buenas practicas de React con componentes funcionales, hooks y estado inmutable.
- Cuidado de UI/UX en estados vacios, carga, error, filtros, busqueda y modal.
- Validaciones de entrada para evitar tareas vacias o duplicadas.
- Cobertura de tests sobre helpers y flujos principales de usuario.
- Pipeline de calidad con audit, tests y build automatico.

## Funcionalidades

- Crear tareas con validacion de texto vacio y duplicados.
- Editar tareas desde un modal con validacion de duplicados.
- Marcar tareas como completadas o pendientes.
- Eliminar tareas con confirmacion previa.
- Buscar tareas por texto.
- Filtrar por todas, pendientes o completadas.
- Persistir datos en `localStorage`.
- Normalizar tareas antiguas guardadas sin `id`.
- Detectar cambios hechos en otra pestana y permitir sincronizar.
- Mostrar estados de carga, error, lista vacia y busqueda sin resultados.

## Stack

- React 18
- Vite
- React Icons
- CSS por componente
- React Testing Library
- Vitest
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
- Los datos antiguos guardados sin `id` se normalizan para mantener compatibilidad con usuarios existentes.
- Las operaciones sobre tareas son inmutables: completar, borrar, agregar y editar generan nuevas referencias.
- La logica principal vive en hooks (`useTodos`, `useLocalStorage`) para separar estado y presentacion.
- El formulario se reutiliza para creacion y edicion, manteniendo validaciones consistentes.
- La UI usa labels, botones accesibles y estados visibles para mejorar navegacion y feedback.
- El build usa base `/` para publicar correctamente en Vercel desde `taskflow.sachadev.me`.
- El toolchain usa Vite para reducir dependencias vulnerables y acelerar desarrollo/build.

## Arquitectura

```mermaid
flowchart TD
  App["App.jsx"] --> Header["TodoHeader"]
  App --> List["TodoList"]
  App --> Modal["Modal"]
  App --> Alert["ChangeAlert"]
  App --> Todos["useTodos"]
  Todos --> Storage["useLocalStorage"]
  Storage --> Browser["localStorage TODOS_V1"]
  Todos --> Filters["search + filter + derived counts"]
  Todos --> Actions["create / edit / complete / delete"]
  List --> Item["TodoItem"]
  Modal --> Form["TodoForm"]
  Modal --> DeleteDialog["DeleteTodoDialog"]
```

El estado de negocio vive en `useTodos`; la persistencia y sincronizacion con el navegador quedan aisladas en `useLocalStorage`. Los componentes visuales reciben datos y callbacks, lo que mantiene la UI facil de probar y cambiar.

## Estructura

```txt
src/
  App/
    App.jsx
    useTodos.js
    useLocalStorage.js
  components/
    ChangeAlert/
    CreateTodoButton/
    Modal/
    TodoHeader/
    TodoIcon/
    TodoList/
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

- En cada pull request a `main`: instala dependencias con `npm ci`, ejecuta `npm audit --audit-level=moderate`, corre tests y genera build.
- En cada push a `main`: repite la validacion, incluyendo el flujo E2E con Playwright.
- Vercel publica la app en `taskflow.sachadev.me`.

## Tests

La suite actual cubre:

- Normalizacion de tareas antiguas.
- Creacion de tareas con ids y texto limpio.
- Filtros por busqueda y estado.
- Flujo principal desde la UI: crear, validar, buscar, completar, filtrar y eliminar.
- Validacion de tareas duplicadas desde el formulario de creacion.
- Edicion de tareas desde modal y validacion de duplicados en edicion.
- Cancelacion segura antes de eliminar una tarea.
- Flujo E2E de produccion con Playwright: crear, buscar, editar, completar, cancelar borrado y eliminar.

## Mejoras futuras

- Prioridades y fechas limite.
- Atajos de teclado para usuarios frecuentes.
- Modo oscuro.
- Drag and drop para reordenar tareas.
- Migracion a TypeScript.
- Backend con autenticacion y base de datos para soportar multiusuario y sincronizacion real entre dispositivos.

## Autor

Desarrollado por Leandro Melchiori.
