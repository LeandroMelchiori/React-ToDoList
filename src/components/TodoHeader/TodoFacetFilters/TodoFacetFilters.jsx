import { handleButtonGroupNavigation } from '../../buttonGroupNavigation';
import './TodoFacetFilters.css';

function TodoFacetFilters({
  activeProject,
  activeTag,
  projectOptions,
  tagOptions,
  onClearFacetFilters,
  onSelectProject,
  onSelectTag,
}) {
  const hasProjects = projectOptions.length > 0;
  const hasTags = tagOptions.length > 0;
  const hasActiveFilters = Boolean(activeProject || activeTag);

  if (!hasProjects && !hasTags) {
    return null;
  }

  return (
    <div
      className="TodoFacetFilters"
      role="group"
      aria-label="Filtrar por proyecto o etiqueta"
      onKeyDown={handleButtonGroupNavigation}
    >
      {hasProjects && (
        <div className="TodoFacetFilters-group" role="group" aria-label="Proyectos">
          <span>Proyectos</span>
          {projectOptions.map(project => {
            const isActive = activeProject === project.name;

            return (
              <button
                key={project.name}
                type="button"
                className={`TodoFacetFilters-button ${isActive ? 'TodoFacetFilters-button--active' : ''}`}
                aria-pressed={isActive}
                onClick={() => onSelectProject(project.name)}
              >
                {project.name}
                {' '}
                <span>{project.count}</span>
              </button>
            );
          })}
        </div>
      )}

      {hasTags && (
        <div className="TodoFacetFilters-group" role="group" aria-label="Etiquetas">
          <span>Etiquetas</span>
          {tagOptions.map(tag => {
            const isActive = activeTag === tag.name;

            return (
              <button
                key={tag.name}
                type="button"
                className={`TodoFacetFilters-button ${isActive ? 'TodoFacetFilters-button--active' : ''}`}
                aria-pressed={isActive}
                onClick={() => onSelectTag(tag.name)}
              >
                #{tag.name}
                {' '}
                <span>{tag.count}</span>
              </button>
            );
          })}
        </div>
      )}

      {hasActiveFilters && (
        <button
          type="button"
          className="TodoFacetFilters-clear"
          onClick={onClearFacetFilters}
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

export { TodoFacetFilters };
