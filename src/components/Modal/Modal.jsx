import ReactDOM from "react-dom";
import "./Modal.css";

function Modal({ children, label = 'Dialogo' }) {
    return ReactDOM.createPortal(
            <div className="ModalBackground" role="dialog" aria-modal="true" aria-label={label}>
                {children}
            </div>,
            document.getElementById("modal")
    );
}

export { Modal };
