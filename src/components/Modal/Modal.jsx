import ReactDOM from "react-dom";
import "./Modal.css";

function Modal({ children }) {
    return ReactDOM.createPortal(
            <div className="ModalBackground" role="dialog" aria-modal="true" aria-label="Crear tarea">
                {children}
            </div>,
            document.getElementById("modal")
    );
}

export { Modal };
