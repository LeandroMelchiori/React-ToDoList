# TaskFlow - React ToDo List

[![CI](https://github.com/LeandroMelchiori/React-ToDoList/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/LeandroMelchiori/React-ToDoList/actions/workflows/ci-cd.yml)

TaskFlow es una aplicacion React para gestionar tareas con busqueda, filtros, edicion, validaciones y persistencia local. El objetivo del proyecto es mostrar como una ToDo List clasica puede evolucionar hacia una experiencia de portfolio mas cuidada: UI clara, estado bien separado, pruebas automatizadas, CI y deploy en produccion.

## Demo

- Produccion: https://taskflow.sachadev.me
- Repositorio: https://github.com/LeandroMelchiori/React-ToDoList

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
- Eliminar tareas.
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

## Decisiones tecnicas

- Cada tarea usa un `id` unico para evitar depender del texto como key o identificador.
- Los datos antiguos guardados sin `id` se normalizan para mantener compatibilidad con usuarios existentes.
- Las operaciones sobre tareas son inmutables: completar, borrar, agregar y editar generan nuevas referencias.
- La logica principal vive en hooks (`useTodos`, `useLocalStorage`) para separar estado y presentacion.
- El formulario se reutiliza para creacion y edicion, manteniendo validaciones consistentes.
- La UI usa labels, botones accesibles y estados visibles para mejorar navegacion y feedback.
- El build usa base `/` para publicar correctamente en Vercel desde `taskflow.sachadev.me`.
- El toolchain usa Vite para reducir dependencias vulnerables y acelerar desarrollo/build.

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
- En cada push a `main`: repite la validacion.
- Vercel publica la app en `taskflow.sachadev.me`.

## Tests

La suite actual cubre:

- Normalizacion de tareas antiguas.
- Creacion de tareas con ids y texto limpio.
- Filtros por busqueda y estado.
- Flujo principal desde la UI: crear, validar, buscar, completar, filtrar y eliminar.
- Validacion de tareas duplicadas desde el formulario de creacion.
- Edicion de tareas desde modal y validacion de duplicados en edicion.

## Mejoras futuras

- Confirmacion antes de eliminar tareas.
- Prioridades y fechas limite.
- Atajos de teclado para usuarios frecuentes.
- Modo oscuro.
- Drag and drop para reordenar tareas.
- Migracion a TypeScript.
- Backend con autenticacion y base de datos para soportar multiusuario y sincronizacion real entre dispositivos.

## Autor

Desarrollado por Leandro Melchiori.
