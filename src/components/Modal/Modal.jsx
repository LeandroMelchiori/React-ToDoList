import React from 'react';
import ReactDOM from 'react-dom';
import './Modal.css';

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

function Modal({ children, label = 'Dialogo', onClose }) {
    const dialogRef = React.useRef(null);
    const onCloseRef = React.useRef(onClose);
    const previousFocusRef = React.useRef(null);

    React.useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    React.useEffect(() => {
        const dialogNode = dialogRef.current;

        if (!dialogNode) {
            return undefined;
        }

        previousFocusRef.current = document.activeElement;

        const getFocusableElements = () => (
            Array.from(dialogNode.querySelectorAll(FOCUSABLE_SELECTOR))
        );

        const focusableElements = getFocusableElements();
        const firstFocusableElement = focusableElements[0] || dialogNode;
        firstFocusableElement.focus();

        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && onCloseRef.current) {
                event.preventDefault();
                onCloseRef.current();
                return;
            }

            if (event.key !== 'Tab') {
                return;
            }

            const currentFocusableElements = getFocusableElements();

            if (!currentFocusableElements.length) {
                event.preventDefault();
                dialogNode.focus();
                return;
            }

            const firstElement = currentFocusableElements[0];
            const lastElement = currentFocusableElements[currentFocusableElements.length - 1];

            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            }

            if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);

            if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
                previousFocusRef.current.focus();
            }
        };
    }, []);

    const handleBackdropClick = (event) => {
        if (event.target === event.currentTarget && onClose) {
            onClose();
        }
    };

    return ReactDOM.createPortal(
            <div className="ModalBackground" onClick={handleBackdropClick}>
              <div
                className="ModalContent"
                role="dialog"
                aria-modal="true"
                aria-label={label}
                ref={dialogRef}
                tabIndex="-1"
              >
                {children}
              </div>
            </div>,
            document.getElementById('modal')
    );
}

export { Modal };
