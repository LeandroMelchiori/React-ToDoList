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

interface ModalProps {
    children: React.ReactNode;
    label?: string;
    onClose?: () => void;
}

function Modal({ children, label = 'Dialogo', onClose }: ModalProps) {
    const dialogRef = React.useRef<HTMLDivElement>(null);
    const onCloseRef = React.useRef(onClose);
    const previousFocusRef = React.useRef<Element | null>(null);

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
        (firstFocusableElement as HTMLElement).focus();

        const handleKeyDown = (event: KeyboardEvent) => {
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
                (lastElement as HTMLElement).focus();
            }

            if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                (firstElement as HTMLElement).focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);

            if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
                (previousFocusRef.current as HTMLElement).focus();
            }
        };
    }, []);

    const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
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
                tabIndex={-1}
              >
                {children}
              </div>
            </div>,
            document.getElementById('modal') as Element
    );
}

export { Modal };
