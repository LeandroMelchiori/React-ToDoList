import './EmptyTodos.css';

const STARTER_TEMPLATES = [
  {
    id: 'weekly-plan',
    title: 'Plan semanal',
    description: 'Define objetivos y bloques de tiempo.',
    todo: {
      text: 'Definir prioridades de la semana',
      priority: 'high',
      project: 'Personal',
      tags: ['planificacion'],
      subtasks: ['Elegir 3 objetivos', 'Reservar bloques de trabajo'],
    },
  },
  {
    id: 'interview',
    title: 'Preparar entrevista',
    description: 'Organiza portfolio, practica y seguimiento.',
    todo: {
      text: 'Preparar entrevista tecnica',
      priority: 'high',
      project: 'Carrera',
      tags: ['portfolio', 'react'],
      subtasks: ['Revisar proyectos', 'Practicar explicacion tecnica'],
    },
  },
  {
    id: 'product-qa',
    title: 'Lanzar mejora',
    description: 'Convierte una idea en entrega verificable.',
    todo: {
      text: 'Publicar mejora de producto',
      priority: 'medium',
      project: 'TaskFlow',
      tags: ['producto', 'qa'],
      subtasks: ['Definir alcance', 'Probar flujo principal'],
    },
  },
  {
    id: 'workshop-material',
    title: 'Organizar taller',
    description: 'Prepara materiales, agenda y recursos para asistentes.',
    todo: {
      text: 'Preparar material del taller',
      priority: 'high',
      project: 'Talleres',
      tags: ['talleres', 'material'],
      subtasks: ['Definir objetivos', 'Revisar presentacion', 'Preparar recursos descargables'],
    },
  },
  {
    id: 'social-economy',
    title: 'Validar emprendimiento',
    description: 'Ordena hipotesis, costos y proximos experimentos.',
    todo: {
      text: 'Validar idea de emprendimiento',
      priority: 'medium',
      project: 'Economia social',
      tags: ['emprendedores', 'validacion'],
      subtasks: ['Definir cliente', 'Listar costos clave', 'Preparar encuesta corta'],
    },
  },
  {
    id: 'educational-game',
    title: 'Disenar juego educativo',
    description: 'Convierte un contenido en una actividad jugable.',
    todo: {
      text: 'Probar dinamica de juego educativo',
      priority: 'medium',
      project: 'Juegos educativos',
      tags: ['educacion', 'juegos'],
      subtasks: ['Definir objetivo pedagogico', 'Crear consigna', 'Probar con un usuario'],
    },
  },
];

interface Template {
  id: string;
  title: string;
  description: string;
  todo: any;
}

interface EmptyTodosProps {
  onCreateTemplate?: (template: Template) => void;
}

function EmptyTodos({ onCreateTemplate }: EmptyTodosProps) {
  return (
    <div className="EmptyTodo-container">
      <p className="EmptyTodo-completeIcon" aria-hidden="true"></p>
      <div className="EmptyTodo-content">
        <div>
          <p className="EmptyTodo-title" id="emptyTodos-title">Todavia no hay tareas</p>
          <p className="EmptyTodo-text">Crea una tarea o carga una plantilla para empezar con contexto.</p>
        </div>
        <div
          className="EmptyTodo-templates"
          aria-label="Plantillas de inicio"
        >
          {STARTER_TEMPLATES.map(template => (
            <button
              type="button"
              className="EmptyTodo-template"
              key={template.id}
              aria-label={`Usar plantilla ${template.title}`}
              onClick={() => onCreateTemplate?.(template)}
            >
              <span>{template.title}</span>
              <small>{template.description}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export { EmptyTodos };
