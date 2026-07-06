# TaskFlow - React ToDo List

Aplicacion de gestion de tareas construida con React. El proyecto parte de una ToDo List clasica y la lleva a una version mas presentable para portfolio: modelo de datos con ids, validaciones, filtros, busqueda, persistencia local, UI responsive y pruebas automatizadas.

## Demo

- Deploy: https://leandromelchiori.github.io/React-ToDoList/

## Funcionalidades

- Crear tareas con validacion de texto vacio y duplicados.
- Marcar tareas como completadas o pendientes.
- Eliminar tareas.
- Buscar tareas por texto.
- Filtrar por todas, pendientes o completadas.
- Persistir datos en `localStorage`.
- Detectar cambios hechos en otra pestana y permitir sincronizar.
- Estados de carga, error, lista vacia y busqueda sin resultados.

## Stack

- React 18
- Vite
- React Icons
- CSS modular por componente
- React Testing Library
- Vitest
- Jest DOM
- GitHub Pages

## Decisiones tecnicas

- Cada tarea usa un `id` unico para evitar depender del texto como key o identificador.
- Los datos antiguos guardados sin `id` se normalizan para mantener compatibilidad con usuarios existentes.
- Las operaciones sobre tareas son inmutables: completar, borrar y agregar generan nuevas referencias.
- La logica principal vive en hooks (`useTodos`, `useLocalStorage`) para separar estado y presentacion.
- La UI usa labels, botones accesibles y estados visibles para mejorar navegacion y feedback.
- La suite de tests valida helpers puros y flujos visibles desde la UI.
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

Publicar en GitHub Pages:

```bash
npm run deploy
```

## Tests

La suite actual cubre:

- Normalizacion de tareas antiguas.
- Creacion de tareas con ids y texto limpio.
- Filtros por busqueda y estado.
- Flujo principal desde la UI: crear, validar, buscar, completar, filtrar y eliminar.
- Validacion de tareas duplicadas desde el formulario.

## Mejoras futuras

- Edicion inline de tareas.
- Prioridades y fechas limite.
- Confirmacion antes de eliminar.
- Modo oscuro.
- Drag and drop para reordenar tareas.
- Migracion a TypeScript.
- CI con GitHub Actions para correr tests y build en cada pull request.
- Backend con autenticacion y base de datos relacional para soportar multiusuario y sincronizacion real entre dispositivos.

## Autor

Desarrollado por Leandro Melchiori.
