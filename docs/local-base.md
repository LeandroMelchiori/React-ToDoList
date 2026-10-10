# TaskFlow Local: base para herramientas de emprendedores

Esta entrega mantiene una agenda local utilizable sin cuenta, autenticación, API ni base remota. La copia al repositorio de herramientas será una integración separada; allí se conservará una versión base y este proyecto podrá evolucionar hacia la versión con nube.

## Qué incluye

- Tareas, eventos, horarios y períodos; recurrencias, fechas límite y bloques de trabajo.
- Planificación diaria, tres días, semanal y mensual; lista y tablero de tareas.
- IndexedDB como persistencia principal y compatibilidad con localStorage.
- Exportar/importar JSON versionado con revisión antes de fusionar o reemplazar.
- Backup de tareas y agenda, tableros y filtros guardados. Los archivos adjuntos, preferencias de apariencia y copias históricas no se incluyen en el JSON.
- Intercambio ICS de elementos con fecha; no sustituye al backup completo.
- Modo claro/oscuro, teclado y funcionamiento offline en el despliegue independiente.

No incluye usuarios, amigos, grupos, sincronización remota, suscripciones ni Nanami. Las carpetas y contratos preparados para esos módulos no activan servicios.

## Al copiar al otro repositorio

1. Partir de un commit verificado, conservando su referencia para identificar la base copiada. No copiar `node_modules`, `dist`, secretos ni resultados de tests.
2. Revisar el framework y la navegación del destino antes de elegir entre una ruta independiente o integración de componentes. El frontend actual es React/Vite; no asumir compatibilidad directa con otro stack.
3. Aislar los estilos globales, las claves de almacenamiento y el nombre de IndexedDB respecto de las otras herramientas. Si cambian nombres en la integración, migrar los datos existentes deliberadamente, no borrarlos.
4. Ajustar el `base` de Vite y las rutas de assets y fuentes. El despliegue actual está preparado para `/`, no para cualquier subruta sin ajustes.
5. No registrar el service worker actual sobre la raíz de la página de herramientas: su shell, cachés y alcance deben pertenecer a la herramienta o integrarse con la PWA del sitio anfitrión.
6. Verificar crear/editar, recurrencias, recarga, JSON/ICS, teclado, móvil y claro/oscuro en el repositorio de destino.

Los datos locales pertenecen al origen del navegador. Cambiar de dominio o puerto no traslada la agenda automáticamente; usar exportación/importación para el traspaso.

## Evolución posterior

Después de integrar la copia local, el backend Java y la sincronización podrán desarrollarse aquí sin requerir que la herramienta gratuita use cuentas. Las futuras mejoras compartidas se trasladarán explícitamente, con sus tests; no habrá sincronización automática entre repositorios.
