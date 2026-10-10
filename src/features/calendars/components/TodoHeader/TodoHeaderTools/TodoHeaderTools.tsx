import React, { ReactElement, ReactNode } from 'react';
import './TodoHeaderTools.css';

interface TodoToolSection {
  content: ReactNode;
  description: string;
  id: string;
  label: string;
}

interface TodoHeaderToolsProps {
  loading?: boolean;
  sections: TodoToolSection[];
  shortcutSectionId?: string;
}

function TodoHeaderTools({ loading, sections, shortcutSectionId }: TodoHeaderToolsProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeSectionId, setActiveSectionId] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const panelId = 'todo-header-tools-panel';
  const activeSection = sections.find(section => section.id === activeSectionId) || null;
  const shortcutSection = sections.find(section => section.id === shortcutSectionId);

  const closeOptions = React.useCallback(() => {
    setIsOpen(false);
    setActiveSectionId(null);
  }, []);

  React.useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeOptions();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeOptions();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeOptions, isOpen]);

  const renderSectionContent = (content: ReactNode) => (
    React.Children.toArray(content).map(child => (
      React.isValidElement(child)
        ? React.cloneElement(child as ReactElement<any>, { loading })
        : child
    ))
  );

  return (
    <section aria-label="Opciones de la aplicacion" className="TodoHeaderTools" ref={containerRef}>
      {shortcutSection && (
        <button
          aria-controls={panelId}
          aria-expanded={isOpen && activeSectionId === shortcutSectionId}
          className="TodoHeaderTools-summary TodoHeaderTools-shortcut"
          onClick={event => {
            triggerRef.current = event.currentTarget;
            if (isOpen && activeSectionId === shortcutSectionId) {
              closeOptions();
            } else {
              setActiveSectionId(shortcutSectionId || null);
              setIsOpen(true);
            }
          }}
          type="button"
        >
          Exportar / importar
        </button>
      )}
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className="TodoHeaderTools-summary"
        onClick={event => {
          triggerRef.current = event.currentTarget;
          if (isOpen && activeSectionId === null) {
            closeOptions();
            return;
          }

          setIsOpen(true);
          setActiveSectionId(null);
        }}
        type="button"
      >
        <span aria-hidden="true" className="TodoHeaderTools-icon">...</span>
        Opciones
      </button>
      {isOpen && (
        <div className="TodoHeaderTools-panel" id={panelId}>
          <div className="TodoHeaderTools-panelHeader">
            {activeSection ? (
              <button
                aria-label="Volver a opciones"
                className="TodoHeaderTools-back"
                onClick={() => setActiveSectionId(null)}
                type="button"
              >
                &larr;
              </button>
            ) : (
              <strong>Opciones</strong>
            )}
            {activeSection && <strong>{activeSection.label}</strong>}
            <button aria-label="Cerrar opciones" className="TodoHeaderTools-close" onClick={() => {
              closeOptions();
              triggerRef.current?.focus();
            }} type="button">
              &times;
            </button>
          </div>

          {activeSection ? (
            <div className="TodoHeaderTools-content">
              {renderSectionContent(activeSection.content)}
            </div>
          ) : (
            <div className="TodoHeaderTools-menu">
              {sections.map(section => (
                <button key={section.id} onClick={() => setActiveSectionId(section.id)} type="button">
                  <span>
                    <strong>{section.label}</strong>
                    <small>{section.description}</small>
                  </span>
                  <span aria-hidden="true">&rsaquo;</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export { TodoHeaderTools };
export type { TodoToolSection };
