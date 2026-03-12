 # ✅ React ToDoList

Aplicación de gestión de tareas construida con **React 18**, desarrollada como proyecto de la ruta de aprendizaje de React de Platzi. Implementa patrones avanzados de React como custom hooks, Context API, render props y persistencia con `localStorage`.

🌐 **Demo en vivo:** [leandromelchiori.github.io/React-ToDoList](https://leandromelchiori.github.io/React-ToDoList/)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Arquitectura](#-arquitectura)
- [Instalación y Uso](#-instalación-y-uso)
- [Scripts Disponibles](#-scripts-disponibles)
- [Deploy](#-deploy)

---

## ✨ Características

- **Crear tareas** mediante un modal con formulario dedicado
- **Completar tareas** marcándolas individualmente con toggle
- **Eliminar tareas** con un solo clic
- **Buscar y filtrar** tareas en tiempo real por texto
- **Contador de progreso** que muestra tareas completadas vs. totales
- **Persistencia automática** en `localStorage` — los datos sobreviven recargas
- **Sincronización entre pestañas** — alerta al detectar cambios en otra pestaña del navegador
- **Estados de UI** diferenciados: cargando, error, lista vacía y sin resultados de búsqueda

---

## 🛠 Tecnologías

| Tecnología | Versión | Uso |
|---|---|---|
| React | ^18 | UI y gestión de estado |
| React DOM | ^18 | Portales (Modal) |
| react-icons | ^5.5.0 | Íconos de completar y eliminar |
| react-scripts | 5.0.1 | Toolchain (CRA) |
| gh-pages | ^6.3.0 | Deploy a GitHub Pages |

---

## 📁 Estructura del Proyecto

```
src/
├── index.js                        # Entry point
├── index.css                       # Estilos globales
│
├── App/
│   ├── App.js                      # Componente raíz — orquesta toda la UI
│   ├── App.css
│   ├── useTodos.js                 # Hook principal: estados y lógica de negocio
│   └── useLocalStorage.js          # Hook de persistencia con useReducer
│
├── TodoContext/
│   └── TodoContext copy.js         # Exploración de Context API (referencia)
│
└── components/
    ├── index.js                    # Barrel de exports
    ├── index.css
    │
    ├── TodoHeader/                 # Cabecera de la app
    │   ├── TodoHeader.js
    │   ├── TodoCounter/            # "X de Y completadas"
    │   └── TodoSearch/             # Input de búsqueda + botón sincronizar
    │
    ├── TodoList/                   # Sección principal de lista
    │   ├── TodoList.js             # Render props / children pattern
    │   ├── TodoList.css
    │   ├── TodoItem/               # Ítem individual de tarea
    │   ├── TodoForm/               # Formulario para nueva tarea
    │   ├── EmptyTodos/             # Estado: sin tareas creadas
    │   ├── TodosLoading/           # Estado: cargando desde localStorage
    │   └── TodosError/             # Estado: error al leer storage
    │
    ├── TodoIcon/                   # Íconos reutilizables
    │   ├── TodoIcon.js             # Componente base
    │   ├── CompleteIcon.js         # Check verde
    │   └── DeleteIcon.js           # X roja
    │
    ├── CreateTodoButton/           # Botón flotante "+"
    ├── Modal/                      # Portal de React para el formulario
    └── ChangeAlert/                # Alerta de cambios entre pestañas
        ├── ChangeAlert.js
        └── useStorageListener.js   # Hook: escucha el evento "storage"
```

---

## 🏗 Arquitectura

### Custom Hooks

**`useLocalStorage`** — gestiona la persistencia con un patrón `useReducer`:

```
Estados: loading → success / error
Acciones: ERROR | SUCCESS | SYNCRONIZE | SAVE
```

Simula latencia con `setTimeout` para mostrar estados de carga reales. La acción `SYNCRONIZE` permite forzar una re-lectura del storage (útil al detectar cambios desde otra pestaña).

**`useTodos`** — centraliza toda la lógica de negocio:

```
states        → loading, error, searchValue, totalTodos, completedTodos, searchTodos, openModal
stateUpdaters → setSearchValue, completeTodo, deleteTodo, toogleModal, addTodo, sincronizeTodos
```

**`useStorageListener`** — escucha el evento nativo `window storage` para detectar cambios realizados en otras pestañas del mismo navegador y mostrar un aviso de recarga.

### Patrón Render Props en `TodoList`

`TodoList` acepta tanto una prop `render` como `children` como función, delegando el renderizado de cada ítem al componente padre:

```jsx
<TodoList render={todo => <TodoItem key={todo.text} {...todo} />}>
  {todo => <TodoItem key={todo.text} {...todo} />}
</TodoList>
```

### Modal con Portal

El componente `Modal` usa `ReactDOM.createPortal` para renderizar fuera del árbol del DOM principal, montándose en `#modal` (definido en `public/index.html`):

```jsx
ReactDOM.createPortal(<div className="ModalBackground">{children}</div>, document.getElementById("modal"))
```

---

## 🚀 Instalación y Uso

**Requisitos:** Node.js 16+

```bash
# 1. Clonar el repositorio
git clone https://github.com/leandromelchiori/React-ToDoList.git
cd React-ToDoList

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm start
```

La app estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 📜 Scripts Disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Servidor de desarrollo con hot reload |
| `npm run build` | Build optimizado para producción en `/build` |
| `npm run deploy` | Build + deploy automático a GitHub Pages |
| `npm run eject` | Expone la configuración de webpack/Babel (irreversible) |

---

## 🌐 Deploy

El proyecto está configurado para desplegarse en **GitHub Pages** mediante `gh-pages`.

```bash
npm run deploy
```

Esto ejecuta `npm run build` y luego publica el contenido de `/build` en la rama `gh-pages` del repositorio. La URL de producción está definida en `package.json`:

```json
"homepage": "https://leandromelchiori.github.io/React-ToDoList/"
```

---

## 📚 Recursos

- [Curso de Introducción a React.js — Platzi](https://platzi.com/reactjs)
- [Documentación oficial de React](https://react.dev)
- [Create React App](https://create-react-app.dev)
