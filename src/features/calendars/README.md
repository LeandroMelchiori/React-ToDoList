# Calendars

Feature implementada: agenda, tareas, horarios, vistas y flujos de planificación personal. `CalendarWorkspace.tsx` es la entrada de composición; recibe controles de apariencia/estado y un callback de tema desde `app`.

Los componentes y hooks viven dentro de esta feature. La lógica pura y los formatos compatibles están en `shared/calendar`. El acceso a IndexedDB/adjuntos usa las entradas públicas de `features/sync`. No importar `app` o módulos del servidor.
