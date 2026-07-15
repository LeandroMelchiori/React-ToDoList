import React, { ReactNode } from 'react';
import './TodoMobileSummary.css';

interface TodoMobileSummaryProps {
  children: ReactNode;
  summary: string;
}

function TodoMobileSummary({ children, summary }: TodoMobileSummaryProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const panelId = 'todo-mobile-summary-panel';

  return (
    <section className="TodoMobileSummary" aria-label="Resumen y carga rapida">
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(currentValue => !currentValue)}
        type="button"
      >
        <span>Resumen y carga rapida</span>
        <small>{summary}</small>
      </button>
      {isOpen && (
        <div className="TodoMobileSummary-panel" id={panelId}>
          {children}
        </div>
      )}
    </section>
  );
}

export { TodoMobileSummary };
