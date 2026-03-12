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

## 🔧 Mejoras Futuras
 
### 🐛 Bugs y deuda técnica
 
**Identificación de tareas por texto (crítico)**
Las operaciones `completeTodo`, `deleteTodo` y el `key` de React usan `todo.text` como identificador único. Si el usuario crea dos tareas con el mismo texto, ambas se verán afectadas al completar o eliminar una. La solución es generar un `id` único al crear cada tarea (por ejemplo con `crypto.randomUUID()`).
 
```js
// Actual — frágil
const todoIndex = newTodos.findIndex(todo => todo.text === text);
 
// Propuesto
const addTodo = (text) => {
  newTodos.push({ id: crypto.randomUUID(), text, completed: false });
};
```
 
**`setTimeout` de 2 segundos hardcodeado en `useLocalStorage`**
El delay artificial simula una carga asíncrona pero bloquea la UI innecesariamente en cada sincronización, incluyendo al recargar desde `ChangeAlert`. Debería eliminarse o hacerse configurable.
 
**Render prop duplicado en `App.js`**
`TodoList` recibe tanto la prop `render` como `children` con exactamente la misma función. Solo uno de los dos se usa (`render || children`), por lo que el otro es código muerto.
 
**`TodoContext copy.js` — refactor abandonado**
El archivo sugiere una migración a Context API que quedó incompleta. El estado sigue siendo prop-drilling desde `useTodos` hacia abajo. Terminar la migración eliminaría el paso intermedio de `states` / `stateUpdaters`.
 
**Typo consistente: `sincronize` → `synchronize`**
La palabra aparece mal escrita en múltiples archivos (`sincronizeTodos`, `sincronizeItem`, `useStorageListener`). No rompe funcionalidad, pero dificulta la legibilidad del código.
 
---
 
### 🚀 Features a agregar
 
**Edición de tareas existentes**
Actualmente solo se puede crear, completar o eliminar. Agregar un modo de edición inline o mediante el mismo modal mejoraría considerablemente la UX.
 
**Fecha de vencimiento y prioridad**
Extender el modelo de dato de `{ text, completed }` a `{ id, text, completed, priority, dueDate }` abriría la puerta a ordenamiento, filtros avanzados y alertas visuales.
 
**Categorías o etiquetas**
Permitir agrupar tareas por proyecto o contexto, con filtrado por categoría además de la búsqueda por texto.
 
**Reordenamiento con drag & drop**
La lista no tiene orden persistido. Integrar una librería como `@dnd-kit` permitiría arrastrar para reorganizar y guardar el orden en `localStorage`.
 
---
 
### 🏗 Calidad de código
 
**Migrar a TypeScript**
El proyecto no tiene ningún tipado. Agregar TypeScript evitaría errores como el de identificación por texto y documentaría la forma de `Todo`, `states` y `stateUpdaters`.
 
```ts
interface Todo {
  id: string;
  text: string;
  completed: boolean;
}
```
 
**Testing**
No existe ningún archivo de test. Los custom hooks `useLocalStorage` y `useTodos` son candidatos ideales para tests unitarios con `@testing-library/react-hooks`. Los flujos de crear/completar/eliminar tarea deberían cubrirse con tests de integración.
 
**Accesibilidad (a11y)**
Los botones de completar y eliminar en `TodoItem` no tienen `aria-label`, lo que los hace inaccesibles para lectores de pantalla. El modal tampoco gestiona el foco ni el atributo `role="dialog"`.
 
**Migración de CRA a Vite**
Create React App está en mantenimiento mínimo. Migrar a Vite reduciría drásticamente los tiempos de arranque y build, y simplificaría la configuración.
 
---
 
### ☁️ Infraestructura
 
**Automatizar el deploy con GitHub Actions**
El deploy actual es manual (`npm run deploy`). Un workflow de CI/CD que dispare el deploy automáticamente en cada push a `main` eliminaría ese paso y garantizaría que la demo siempre esté actualizada.

**Migración a base de datos relacional**
El almacenamiento en `localStorage` es local al navegador, no escala y no permite multiusuario. El paso natural es reemplazarlo por un backend con una base de datos relacional (PostgreSQL, MySQL) exponiendo una REST API o GraphQL.
 
El modelo de tabla para las tareas quedaría así:
 
```sql
CREATE TABLE todos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  text        VARCHAR(255) NOT NULL,
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
 
  CONSTRAINT uq_user_todo_text UNIQUE (user_id, text)
);
```
 
Esto resuelve varios problemas del diseño actual de forma estructural:
 
- **Clave primaria (`id`)** — cada tarea tiene un `UUID` irrepetible generado por la base de datos, eliminando el bug de identificación por texto.
- **Unicidad garantizada a nivel de BD** — el constraint `UNIQUE (user_id, text)` impide tareas duplicadas por usuario directamente en la capa de datos, sin depender de validaciones en el frontend.
- **Multiusuario** — la columna `user_id` asocia cada tarea a un usuario, habilitando autenticación y datos independientes por cuenta.
- **Auditoría** — `created_at` y `updated_at` permiten ordenar por fecha de creación, filtrar tareas recientes y registrar la última modificación.
- **Sincronización real entre dispositivos** — al estar los datos en el servidor, cualquier navegador o dispositivo del mismo usuario siempre ve el mismo estado, reemplazando el workaround actual de `useStorageListener` que solo funciona entre pestañas del mismo navegador.
 
---
 

## 📚 Recursos
- [Documentación oficial de React](https://react.dev)

## 👨‍💻 Autor
 
Desarrollado por Leandro Melchiori
