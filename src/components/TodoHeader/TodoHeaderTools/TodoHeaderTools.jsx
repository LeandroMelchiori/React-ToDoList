import React from 'react';
import './TodoHeaderTools.css';

function TodoHeaderTools({ children, loading }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const panelId = 'todo-header-tools-panel';

  return (
    <section
      aria-label="Herramientas avanzadas"
      className={`TodoHeaderTools ${isOpen ? 'TodoHeaderTools--open' : ''}`}
    >
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className="TodoHeaderTools-summary"
        onClick={() => setIsOpen(currentIsOpen => !currentIsOpen)}
        type="button"
      >
        Herramientas
        <span>Tableros, vistas y backups</span>
      </button>
      {isOpen && (
        <div className="TodoHeaderTools-panel" id={panelId}>
          {React.Children
            .toArray(children)
            .map(child => (
              React.isValidElement(child)
                ? React.cloneElement(child, { loading })
                : child
            ))
          }
        </div>
      )}
    </section>
  );
}

export { TodoHeaderTools };
